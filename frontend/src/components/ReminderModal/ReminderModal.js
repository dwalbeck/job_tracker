import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import './ReminderModal.css';

const ReminderModal = ({isOpen, onClose, reminder = null, preSelectedJobId = null, redirectJobId = null}) => {
    const isEdit = Boolean(reminder);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        job_id: preSelectedJobId || '',
        reminder_date: '',
        reminder_time: '',
        reminder_message: ''
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchJobs();
            if (reminder) {
                // Editing mode - populate form with reminder data
                setFormData({
                    job_id: reminder.job_id || '',
                    reminder_date: reminder.reminder_date || '',
                    reminder_time: reminder.reminder_time || '',
                    reminder_message: reminder.reminder_message || ''
                });
            } else if (preSelectedJobId) {
                // Adding mode with pre-selected job
                setFormData({
                    job_id: preSelectedJobId,
                    reminder_date: '',
                    reminder_time: '',
                    reminder_message: ''
                });
            } else {
                // Adding mode without pre-selected job - clear form
                setFormData({
                    job_id: '',
                    reminder_date: '',
                    reminder_time: '',
                    reminder_message: ''
                });
            }
        }
    }, [isOpen, reminder, preSelectedJobId]);

    const fetchJobs = async () => {
        try {
            const response = await apiService.getJobList();
            setJobs(response || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        }
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submitData = {
                reminder_date: formData.reminder_date,
                reminder_time: formData.reminder_time || null,
                reminder_message: formData.reminder_message,
                reminder_dismissed: false,
                job_id: formData.job_id ? parseInt(formData.job_id) : null
            };

            if (isEdit) {
                submitData.reminder_id = reminder.reminder_id;
            }

            await apiService.saveReminder(submitData);
            onClose(true); // Pass true to indicate success
        } catch (error) {
            console.error('Error saving reminder:', error);
            setError('Failed to save reminder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiService.deleteReminder(reminder.reminder_id);
            onClose(true); // Pass true to indicate success
        } catch (error) {
            console.error('Error deleting reminder:', error);
            setError('Failed to delete reminder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (redirectJobId) {
            navigate(`/job-details/${redirectJobId}`);
        } else {
            onClose(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="reminder-modal-overlay" onClick={handleCancel}>
            <div className="reminder-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="reminder-modal-title">
                    {isEdit ? 'Edit Reminder' : 'Add Reminder'}
                </h2>

                {error && <div className="reminder-error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="reminder-form">
                    <div className="reminder-form-row">
                        <label className="reminder-label">For Job Posting</label>
                        <select
                            name="job_id"
                            value={formData.job_id}
                            onChange={handleChange}
                            className="reminder-select"
                            disabled={Boolean(preSelectedJobId)}
                        >
                            <option value="">No job selected</option>
                            {jobs.map(job => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.company} - {job.job_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="reminder-form-row">
                        <label className="reminder-label">Reminder Date*</label>
                        <input
                            type="date"
                            name="reminder_date"
                            value={formData.reminder_date}
                            onChange={handleChange}
                            className="reminder-input"
                            required
                        />
                    </div>

                    <div className="reminder-form-row">
                        <label className="reminder-label">Reminder Time</label>
                        <input
                            type="time"
                            name="reminder_time"
                            value={formData.reminder_time}
                            onChange={handleChange}
                            className="reminder-input"
                        />
                    </div>

                    <div className="reminder-form-row">
                        <label className="reminder-label">Reminder Message*</label>
                        <textarea
                            name="reminder_message"
                            value={formData.reminder_message}
                            onChange={handleChange}
                            className="reminder-textarea"
                            rows={2}
                            required
                            placeholder="Enter reminder message (min 60 characters)"
                        />
                    </div>

                    <div className="reminder-form-actions">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="delete-button"
                                disabled={loading}
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="cancel-button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="action-button"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Update Reminder' : 'Add Reminder')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReminderModal;
