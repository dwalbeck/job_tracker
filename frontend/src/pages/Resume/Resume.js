import React, {useState, useEffect} from 'react';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import './Resume.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const Resume = () => {
    const [baselineResumes, setBaselineResumes] = useState([]);
    const [jobResumes, setJobResumes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBaselineResumes();
        fetchJobResumes();
    }, []);

    const fetchBaselineResumes = async () => {
        try {
            setLoading(true);
            const response = await apiService.getBaselineResumes()
            const data = await response.json();
            setBaselineResumes(data || []);
        } catch (error) {
            console.error('Error fetching baseline resumes:', error);
            setBaselineResumes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobResumes = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/resume/job`);
            const data = await response.json();
            setJobResumes(data || []);
        } catch (error) {
            console.error('Error fetching job resumes:', error);
            setJobResumes([]);
        }
    };

    const handleClone = async (resumeId, isBaseline = true) => {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/resume/clone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({resume_id: resumeId}),
            });

            if (response.ok) {
                const newResume = await response.json();
                // Add the cloned resume to the appropriate list
                if (isBaseline) {
                    setBaselineResumes(prev => [...prev, newResume]);
                } else {
                    // For job resumes, we need to fetch the updated list to get keyword/focus counts
                    fetchJobResumes();
                }
            } else {
                alert('Failed to clone resume');
            }
        } catch (error) {
            console.error('Error cloning resume:', error);
            alert('Failed to clone resume');
        }
    };

    const handleDelete = async (resumeId, isBaseline = true) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/v1/resume?resume_id=${resumeId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the deleted resume from the appropriate list
                if (isBaseline) {
                    setBaselineResumes(prev => prev.filter(resume => resume.resume_id !== resumeId));
                } else {
                    setJobResumes(prev => prev.filter(resume => resume.resume_id !== resumeId));
                }
            } else {
                alert('Failed to delete resume');
            }
        } catch (error) {
            console.error('Error deleting resume:', error);
            alert('Failed to delete resume');
        }
    };

    const handleSetDefault = async (resumeId) => {
        try {
            const resume = baselineResumes.find(r => r.resume_id === resumeId);
            if (!resume) return;

            const formData = new FormData();
            formData.append('resume_id', resumeId);
            formData.append('resume_title', resume.resume_title);
            formData.append('is_default', 'true');
            formData.append('is_baseline', 'true');

            const response = await fetch(`${API_BASE_URL}/v1/resume`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Update the resumes list - set all to not default, then set this one as default
                setBaselineResumes(prev => prev.map(r => ({
                    ...r,
                    is_default: r.resume_id === resumeId
                })));
            } else {
                alert('Failed to set as default');
            }
        } catch (error) {
            console.error('Error setting default resume:', error);
            alert('Failed to set as default');
        }
    };

    const handleEdit = (resumeId) => {
        window.location.href = `/edit-resume?resume_id=${resumeId}`;
    };

    const handleTailor = (jobId, baselineResumeId) => {
        console.log('Tailor clicked: jobId=', jobId, ', baselineResumeId=', baselineResumeId);
        if (jobId && baselineResumeId) {
            const url = `/job-analysis/${jobId}?resume_id=${baselineResumeId}`;
            console.log('Navigating to:', url);
            window.location.href = url;
        } else if (jobId) {
            const url = `/job-analysis/${jobId}`;
            console.log('Navigating to:', url);
            window.location.href = url;
        } else {
            console.error('No job ID provided');
            alert('Cannot tailor resume: Job information is missing');
        }
    };

    const handleViewResume = (resumeId) => {
        window.location.href = `/view-resume?resume_id=${resumeId}`;
    };

    const handleAddNew = () => {
        // Navigate to resume form page
        window.location.href = '/resume-form';
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportResumes();
            const { resume_export_dir, resume_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${resume_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = resume_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`Resumes exported to: ${resume_export_dir}/${resume_export_file}`);
        } catch (error) {
            console.error('Error exporting resumes:', error);
            alert('Failed to export resumes');
        }
    };

    const calculateLastEdit = (resumeUpdated, resumeCreated) => {
        const dateToUse = resumeUpdated || resumeCreated;
        if (!dateToUse) return '';

        const now = new Date();
        const editDate = new Date(dateToUse);
        const diffMs = now - editDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 13) {
            return `Last edit ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        } else {
            const diffWeeks = Math.floor(diffDays / 7);
            return `Last edit ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
        }
    };

    const filteredBaselineResumes = baselineResumes.filter(resume =>
        resume.resume_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredJobResumes = jobResumes.filter(resume =>
        resume.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="resume-page loading">Loading resumes...</div>;
    }

    return (
        <div className="resume-page">
            <div className="resume-header">
                <h1>Resume</h1>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search resumes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ✕
                            </button>
                        )}
                    </div>
                    <button onClick={handleAddNew} className="add-new-btn">
                        Add New
                    </button>
                    <ExportMenu label="Export Resumes" onExport={handleExport} />
                </div>
            </div>

            <div className="resume-content">
                <div className="resume-section">
                    <h2 className="resume-section-title">Baseline</h2>
                    <div className="resume-cards-grid">
                        {filteredBaselineResumes.length === 0 ? (
                            <div className="no-resumes">No baseline resumes found</div>
                        ) : (
                            filteredBaselineResumes.map((resume) => (
                                <div key={resume.resume_id} className="resume-card">
                                    <div className="resume-card-title clickable"
                                         onClick={() => handleViewResume(resume.resume_id)}>
                                        {resume.resume_title}
                                    </div>
                                    <div className="resume-card-last-edit">
                                        {calculateLastEdit(resume.resume_updated, resume.resume_created)}
                                    </div>

                                    <div className="resume-card-stats-row">
                                        <div className="stat-item">
                                            <span className="stat-label">Keywords</span>
                                            <span className="stat-value">{resume.keyword_count || 0}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Focus</span>
                                            <span className="stat-value">{resume.focus_count || 0}</span>
                                        </div>
                                    </div>

                                    <div className="resume-card-row">
                                        <div className="resume-card-action"
                                             onClick={() => handleClone(resume.resume_id)}>
                                            <span className="action-icon">📄</span>
                                            <span className="action-label">Clone</span>
                                        </div>
                                        <div className="resume-card-action"
                                             onClick={() => handleDelete(resume.resume_id)}>
                                            <span className="action-icon">🗑️</span>
                                            <span className="action-label">Delete</span>
                                        </div>
                                    </div>

                                    <div className="resume-card-row">
                                        <div className="resume-card-action"
                                             onClick={() => handleEdit(resume.resume_id)}>
                                            <span className="action-icon">⚙️</span>
                                            <span className="action-label">Edit</span>
                                        </div>
                                        {!resume.is_default && (
                                            <div className="resume-card-action"
                                                 onClick={() => handleSetDefault(resume.resume_id)}>
                                                <span className="action-icon">⭐</span>
                                                <span className="action-label">Set as Default</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="resume-section">
                    <h2 className="resume-section-title">Customized for Jobs</h2>
                    <div className="resume-cards-grid">
                        {filteredJobResumes.length === 0 ? (
                            <div className="no-resumes">No job-specific resumes found</div>
                        ) : (
                            filteredJobResumes.map((resume) => (
                                <div key={resume.resume_id} className="resume-card job-resume-card">
                                    <div className="resume-card-title clickable"
                                         onClick={() => handleViewResume(resume.resume_id)}>
                                        {resume.company}
                                    </div>
                                    <div className="resume-card-title clickable"
                                         onClick={() => handleViewResume(resume.resume_id)}>
                                        {resume.job_title}
                                    </div>
                                    <div className="resume-card-last-edit">
                                        {calculateLastEdit(resume.resume_updated, resume.resume_created)}
                                    </div>

                                    <div className="resume-card-stats-grid">
                                        <div className="stats-column">
                                            <div className="stat-item">
                                                <span className="stat-label">Baseline score</span>
                                                <span className="stat-value bold">{resume.baseline_score || 0}%</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Optimized score</span>
                                                <span className="stat-value bold">{resume.rewrite_score || 0}%</span>
                                            </div>
                                        </div>
                                        <div className="stats-column">
                                            <div className="stat-item">
                                                <span className="stat-label">Keywords</span>
                                                <span className="stat-value">{resume.keyword_count || 0}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Focus</span>
                                                <span className="stat-value">{resume.focus_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="resume-card-row">
                                        <div className="resume-card-action"
                                             onClick={() => handleClone(resume.resume_id, false)}>
                                            <span className="action-icon">📄</span>
                                            <span className="action-label">Clone</span>
                                        </div>
                                        <div className="resume-card-action"
                                             onClick={() => handleTailor(resume.job_id, resume.baseline_resume_id)}>
                                            <span className="action-icon">✏️</span>
                                            <span className="action-label">Tailor</span>
                                        </div>
                                    </div>

                                    <div className="resume-card-row">
                                        <div className="resume-card-action"
                                             onClick={() => handleDelete(resume.resume_id, false)}>
                                            <span className="action-icon">🗑️</span>
                                            <span className="action-label">Delete</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resume;
