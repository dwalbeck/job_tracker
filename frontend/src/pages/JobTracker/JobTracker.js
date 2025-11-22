import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';
import JobCard from '../../components/JobCard/JobCard';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import {useJob} from '../../context/JobContext';
import logger from '../../utils/logger';
import './JobTracker.css';

const JobTracker = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [noResponseWeeks, setNoResponseWeeks] = useState(null);
    const {selectJob} = useJob();
    const navigate = useNavigate();

    const columns = [
        {id: 'applied', title: 'Applied'},
        {id: 'interviewing', title: 'Interviewing'},
        {id: 'rejected', title: 'Rejected'},
        {id: 'no response', title: 'No Response'}
    ];

    useEffect(() => {
        logger.logPageView('Job Posting', '/job-tracker');
        fetchPersonalSettings();
    }, []);

    useEffect(() => {
        if (noResponseWeeks !== null) {
            fetchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noResponseWeeks]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = jobs.filter(job =>
                job.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredJobs(filtered);
        } else {
            setFilteredJobs(jobs);
        }
    }, [searchTerm, jobs]);

    const fetchPersonalSettings = async () => {
        try {
            const personalInfo = await apiService.getPersonalInfo();
            setNoResponseWeeks(personalInfo.no_response_week);
        } catch (error) {
            console.error('Error fetching personal settings:', error);
        }
    };

    const isJobOlderThanThreshold = (lastContact, weeks) => {
        if (!lastContact || !weeks) return false;

        const lastContactDate = new Date(lastContact);
        const today = new Date();
        const diffTime = Math.abs(today - lastContactDate);
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

        return diffWeeks >= weeks;
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllJobs();

            // Auto-move old jobs to "no response" if threshold is set
            if (noResponseWeeks && response) {
                const updatedJobs = await Promise.all(response.map(async (job) => {
                    // Only check jobs that aren't already in "no response" or "rejected" status
                    if (job.job_status !== 'no response' &&
                        job.job_status !== 'rejected' &&
                        isJobOlderThanThreshold(job.last_contact, noResponseWeeks)) {

                        try {
                            // Update job status to "no response"
                            await apiService.updateJob({
                                ...job,
                                job_status: 'no response'
                            });

                            return {...job, job_status: 'no response'};
                        } catch (error) {
                            console.error(`Error updating job ${job.job_id}:`, error);
                            return job;
                        }
                    }
                    return job;
                }));

                setJobs(updatedJobs);
            } else {
                setJobs(response || []);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const getJobsByStatus = (status) => {
        return filteredJobs.filter(job => job.job_status === status);
    };

    const handleJobClick = (job) => {
        selectJob(job.job_id);
        navigate(`/job-details/${job.job_id}`);
    };

    const handleAddJob = () => {
        navigate('/job-form');
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const {draggableId, destination} = result;
        const jobId = parseInt(draggableId);
        const newStatus = destination.droppableId;

        const jobToUpdate = jobs.find(job => job.job_id === jobId);
        if (jobToUpdate && jobToUpdate.job_status !== newStatus) {
            try {
                await apiService.updateJob({
                    ...jobToUpdate,
                    job_status: newStatus
                });

                setJobs(jobs.map(job =>
                    job.job_id === jobId
                        ? {...job, job_status: newStatus}
                        : job
                ));
            } catch (error) {
                console.error('Error updating job status:', error);
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportJobs();
            const { job_export_dir, job_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${job_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = job_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`Jobs exported to: ${job_export_dir}/${job_export_file}`);
        } catch (error) {
            console.error('Error exporting jobs:', error);
            alert('Failed to export jobs');
        }
    };

    return (
        <div className="job-tracker">
            <div className="job-tracker-header">
                <h1>Job Posting</h1>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ✕
                            </button>
                        )}
                    </div>
                    <button onClick={handleAddJob} className="add-job-btn">
                        + Add Job
                    </button>
                    <ExportMenu label="Export Jobs" onExport={handleExport} />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading jobs...</div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="job-columns">
                        {columns.map(column => {
                            const columnJobs = getJobsByStatus(column.id);
                            return (
                                <div key={column.id} className="job-column">
                                    <div className="column-header">
                                        <h3>{column.title}</h3>
                                        <span className="job-count">
                      {columnJobs.length} {columnJobs.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                                    </div>
                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                                            >
                                                {columnJobs.map((job, index) => (
                                                    <JobCard
                                                        key={job.job_id}
                                                        job={job}
                                                        index={index}
                                                        onClick={() => handleJobClick(job)}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
};

export default JobTracker;