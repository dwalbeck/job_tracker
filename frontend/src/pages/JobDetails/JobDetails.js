import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import './JobDetails.css';

const JobDetails = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [notes, setNotes] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [baselineResumes, setBaselineResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [showResumeSelect, setShowResumeSelect] = useState(false);
    const [resumeDetail, setResumeDetail] = useState(null);

    const statusOptions = ['applied', 'interviewing', 'rejected', 'no response'];

    useEffect(() => {
        fetchJobDetails();
        fetchAppointments();
        fetchReminders();
        fetchNotes();
        fetchContacts();
        fetchBaselineResumes();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const jobData = await apiService.getJob(id);
            setJob(jobData);

            // Fetch resume details if job has an associated resume
            if (jobData.resume_id) {
                fetchResumeDetails(jobData.resume_id);
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            setError('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const fetchResumeDetails = async (resumeId) => {
        try {
            const details = await apiService.getResumeDetail(resumeId);
            setResumeDetail(details);
        } catch (error) {
            console.error('Error fetching resume details:', error);
            setResumeDetail(null);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await apiService.getAppointments(id);
            const data = await response.json();
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        }
    };

    const fetchReminders = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await apiService.getReminderList({
                duration: 'month',
                start_date: today,
                job_id: parseInt(id)
            });
            setReminders(data || []);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            setReminders([]);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await apiService.getNotes(id);
            const data = await response.json();
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
            setNotes([]);
        }
    };

    const fetchContacts = async () => {
        try {
            const response = await apiService.getAllContacts(id)
            const data = await response.json();
            setContacts(data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setContacts([]);
        }
    };

    const fetchBaselineResumes = async () => {
        try {
            const data = await apiService.getBaselineResumeList();
            setBaselineResumes(data || []);
            const defaultResume = data.find(resume => resume.is_default);
            if (defaultResume) {
                setSelectedResumeId(defaultResume.resume_id);
            }
        } catch (error) {
            console.error('Error fetching baseline resumes:', error);
            setBaselineResumes([]);
        }
    };

    const handleGoBack = () => {
        navigate('/job-tracker');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await apiService.deleteJob(id);
                navigate('/job-tracker');
            } catch (error) {
                console.error('Error deleting job:', error);
                alert('Failed to delete job');
            }
        }
    };

    const handleEdit = () => {
        navigate(`/job-form/${id}`);
    };

    const handleAddNote = () => {
        navigate(`/notes-form?job_id=${id}`);
    };

    const handleAddContact = () => {
        navigate(`/contact-form?job_id=${id}`);
    };

    const handleAddAppointment = () => {
        navigate(`/calendar-form?job_id=${id}`);
    };

    const handleAddReminder = () => {
        navigate(`/calendar?view=month&job_id=${id}&open_reminder=true`);
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const updatedJob = {...job, job_status: newStatus};
            await apiService.updateJob(updatedJob);
            setJob(updatedJob);
        } catch (error) {
            console.error('Error updating job status:', error);
            alert('Failed to update job status');
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) {
            alert(`No ${label} available`);
            return;
        }

        // Try modern Clipboard API first (simulates Ctrl+C behavior)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert(`${label} copied to clipboard!`);
            }).catch(err => {
                console.error('Failed to copy:', err);
                // Fallback to older method
                fallbackCopy(text, label);
            });
        } else {
            // Fallback for older browsers
            fallbackCopy(text, label);
        }
    };

    const fallbackCopy = (text, label) => {
        // Create a temporary textarea element (simulates selecting text)
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        // Select the text (simulates mouse selection)
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        try {
            // Execute copy command (simulates Ctrl+C)
            const successful = document.execCommand('copy');
            if (successful) {
                alert(`${label} copied to clipboard!`);
            } else {
                alert('Failed to copy to clipboard');
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const handleCopyPostingUrl = () => {
        copyToClipboard(job.posting_url, 'Posting URL');
    };

    const handleCopyApplyUrl = () => {
        copyToClipboard(job.apply_url, 'Application URL');
    };

    const handleViewDescription = () => {
        setShowDescriptionModal(true);
    };

    const handleCloseModal = () => {
        setShowDescriptionModal(false);
    };

    const handleAppointmentClick = (appointment) => {
        navigate(`/calendar-form/${appointment.calendar_id}?from=job-details&job_id=${id}`);
    };

    const handleNoteClick = (note) => {
        navigate(`/notes-form/${note.note_id}`);
    };

    const handleContactClick = (contact) => {
        navigate(`/contact-details/${contact.contact_id}`);
    };

    const handleCreateCoverLetter = () => {
        navigate(`/create-cover-letter?job_id=${id}&resume_id=${job.resume_id}`);
    };

    const handleOptimizeResume = () => {
        if (selectedResumeId) {
            navigate(`/job-analysis/${id}?resume_id=${selectedResumeId}`);
        } else {
            alert('Please select a baseline resume first');
        }
    };

    const handleDownloadResume = async () => {
        try {
            const response = await apiService.convertHtmlToDocx(id);
            const fileName = response.file_name;

            // Trigger file download using standardized naming endpoint
            const downloadUrl = `${apiService.baseURL}/v1/files/resumes/${fileName}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading resume:', error);
            alert('Failed to download resume. Please ensure a resume has been created for this job.');
        }
    };

    const handleManageResume = () => {
        if (job && job.resume_id) {
            navigate(`/view-resume?resume_id=${job.resume_id}&job_id=${id}`);
        } else {
            alert('No resume associated with this job.');
        }
    };

    const handleResumeClick = () => {
        setShowResumeSelect(true);
    };

    const handleResumeSelectChange = (e) => {
        setSelectedResumeId(parseInt(e.target.value));
        setShowResumeSelect(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString; // Already in YYYY-MM-DD format from backend
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatParticipants = (participants) => {
        if (!participants || participants.length === 0) return '';
        return participants.join(', ');
    };

    const formatNoteCreated = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="loading">Loading job details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!job) {
        return <div className="error">Job not found</div>;
    }

    return (
        <div className="job-details">
            <div className="job-details-header">
                <div className="header-left">
                    <button onClick={handleGoBack} className="back-button">
                        ←
                    </button>
                    <h1>Job Details</h1>
                </div>
                <div className="header-controls">
                    <button onClick={handleAddNote} className="action-button">
                        Add Note
                    </button>
                    <button onClick={handleAddReminder} className="action-button">
                        Add Reminder
                    </button>
                    <button onClick={handleAddContact} className="action-button">
                        Add Contact
                    </button>
                    <button onClick={handleAddAppointment} className="action-button">
                        Add Appointment
                    </button>
                    <select
                        value={job.job_status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="status-select"
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleEdit} className="edit-button">
                        Edit
                    </button>
                    <button onClick={handleDelete} className="delete-button">
                        Delete
                    </button>
                </div>
            </div>

            <div className="job-details-content">
                <div className="details-main-section">
                    <div className="details-left-column">
                        <div className="detail-row">
                            <span className="detail-label">Company:</span>
                            <span className="detail-value">{job.company}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Job Title:</span>
                            <span className="detail-value">{job.job_title}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Salary:</span>
                            <span className="detail-value">{job.salary || 'Not specified'}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">{job.location || 'Not specified'}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Interest Level:</span>
                            <span className="detail-value">{job.interest_level}/10</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Job Status:</span>
                            <span className="detail-value">{job.job_status}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Date Applied:</span>
                            <span
                                className="detail-value">{job.date_applied ? new Date(job.date_applied).toLocaleDateString() : 'Not specified'}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Last Contact:</span>
                            <span
                                className="detail-value">{job.last_contact ? new Date(job.last_contact).toLocaleDateString() : 'None'}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Job Created:</span>
                            <span
                                className="detail-value">{job.job_created ? new Date(job.job_created).toLocaleDateString() : 'Not specified'}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Job Directory:</span>
                            <span className="detail-value">{job.job_directory || 'Not specified'}</span>
                        </div>
                    </div>

                    {job.resume_id && resumeDetail && (
                        <div className="resume-stats-section">
                            <div className="stat-row">
                                <span className="stat-label">Keyword Count:</span>
                                <span className="stat-value">{resumeDetail.keyword_count || 0}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Focused Keyword Count:</span>
                                <span className="stat-value">{resumeDetail.focus_count || 0}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Baseline Score:</span>
                                <span className="stat-value score">{resumeDetail.baseline_score || 0}%</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Rewrite Score:</span>
                                <span className="stat-value score">{resumeDetail.rewrite_score || 0}%</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Score Average:</span>
                                <span className="stat-value score">{job?.average_score || 'N/A'}</span>
                            </div>
                        </div>
                    )}

                    <div className="details-right-buttons">
                        <button onClick={handleCopyPostingUrl} className="url-action-button">
                            Copy Posting URL
                        </button>
                        <button onClick={handleCopyApplyUrl} className="url-action-button">
                            Copy Application URL
                        </button>
                        <button onClick={handleViewDescription} className="url-action-button">
                            View Description
                        </button>

                        <div className="resume-optimization-row">
                            <div className="resume-selector-container">
                                {!showResumeSelect ? (
                                    <div className="resume-display" onClick={handleResumeClick}>
                                        <span className="baseline-label">baseline default</span>
                                        <span className="resume-title">
                      {baselineResumes.find(r => r.resume_id === selectedResumeId)?.resume_title || 'Select Resume'}
                    </span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedResumeId || ''}
                                        onChange={handleResumeSelectChange}
                                        className="resume-select"
                                        autoFocus
                                    >
                                        {baselineResumes.map(resume => (
                                            <option key={resume.resume_id} value={resume.resume_id}>
                                                {resume.resume_title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button onClick={handleOptimizeResume} className="url-action-button optimize-button">
                                Optimize Resume
                            </button>
                        </div>

                        {job.resume_id && (
                            <>
                                <button onClick={handleDownloadResume} className="url-action-button download-button">
                                    Download Resume
                                </button>
                                <button onClick={handleManageResume} className="url-action-button manage-button">
                                    Manage Resume
                                </button>
                                <button onClick={handleCreateCoverLetter}
                                        className="url-action-button create-cover-letter-button">
                                    Create Cover Letter
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="appointments-section">
                    <h2 className="section-title">Appointments</h2>
                    <div className="appointments-table-container">
                        <table className="appointments-table">
                            <thead>
                            <tr>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Type</th>
                                <th>Participants</th>
                                <th>Description</th>
                                <th>Score</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.length === 0 && reminders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="no-data">No appointments or reminders found</td>
                                </tr>
                            ) : (
                                <>
                                    {appointments.map((appointment) => (
                                        <tr
                                            key={`appt-${appointment.calendar_id}`}
                                            onClick={() => handleAppointmentClick(appointment)}
                                            className="appointment-row"
                                        >
                                            <td>{formatDate(appointment.start_date)}</td>
                                            <td>{formatDate(appointment.end_date)}</td>
                                            <td>{formatTime(appointment.start_time)}</td>
                                            <td>{formatTime(appointment.end_time)}</td>
                                            <td>{appointment.calendar_type}</td>
                                            <td>{formatParticipants(appointment.participant)}</td>
                                            <td>{appointment.calendar_desc || ''}</td>
                                            <td>{appointment.outcome_score || ''}</td>
                                        </tr>
                                    ))}
                                    {reminders.map((reminder) => (
                                        <tr
                                            key={`reminder-${reminder.reminder_id}`}
                                            className="reminder-row"
                                        >
                                            <td>{formatDate(reminder.reminder_date)}</td>
                                            <td></td>
                                            <td>{reminder.reminder_time ? formatTime(reminder.reminder_time) : ''}</td>
                                            <td></td>
                                            <td>reminder</td>
                                            <td></td>
                                            <td>{reminder.reminder_message}</td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="notes-section">
                    <h2 className="section-title">Notes</h2>
                    <div className="notes-grid">
                        {notes.length === 0 ? (
                            <div className="no-data">No notes found</div>
                        ) : (
                            notes.map((note) => (
                                <div
                                    key={note.note_id}
                                    className="note-card"
                                    onClick={() => handleNoteClick(note)}
                                >
                                    <div className="note-card-row">
                                        <div className="note-card-field">
                                            <span className="note-card-label">Created:</span>
                                            <span
                                                className="note-card-value">{formatNoteCreated(note.note_created)}</span>
                                        </div>
                                        <div className="note-card-field">
                                            <span className="note-card-label">Title:</span>
                                            <span className="note-card-value">{note.note_title}</span>
                                        </div>
                                    </div>
                                    <div className="note-card-row">
                                        <div className="note-card-field-full">
                                            <span className="note-card-label">Note:</span>
                                            <span className="note-card-value">{note.note_content}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="contacts-section">
                    <h2 className="section-title">Contacts</h2>
                    <div className="contacts-grid">
                        {contacts.length === 0 ? (
                            <div className="no-data">No contacts found</div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    key={contact.contact_id}
                                    className="contact-card"
                                    onClick={() => handleContactClick(contact)}
                                >
                                    <div className="contact-card-row">
                                        <span className="contact-card-label">First:</span>
                                        <span className="contact-card-value">{contact.first_name}</span>
                                    </div>
                                    <div className="contact-card-row">
                                        <span className="contact-card-label">Last:</span>
                                        <span className="contact-card-value">{contact.last_name}</span>
                                    </div>
                                    <div className="contact-card-row">
                                        <span className="contact-card-label">Title:</span>
                                        <span className="contact-card-value">{contact.job_title || ''}</span>
                                    </div>
                                    <div className="contact-card-row">
                                        <span className="contact-card-label">Email:</span>
                                        <span className="contact-card-value">{contact.email || ''}</span>
                                    </div>
                                    <div className="contact-card-row">
                                        <span className="contact-card-label">Phone:</span>
                                        <span className="contact-card-value">{contact.phone || ''}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showDescriptionModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Job Description</h2>
                            <button onClick={handleCloseModal} className="modal-close-button">
                                Close
                            </button>
                        </div>
                        <div className="modal-body">
                            {job.job_desc || 'No job description provided'}
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCloseModal} className="modal-close-button">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetails;
