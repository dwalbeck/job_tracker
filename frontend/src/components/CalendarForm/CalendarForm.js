import React, {useState, useEffect} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import apiService from '../../services/api';
import {calculateDuration, getTimeSlots} from '../../utils/calendarUtils';
import {getTodayDate} from '../../utils/dateUtils';
import './CalendarForm.css';

const CalendarForm = () => {
    const {id} = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        calendar_id: '',
        job_id: '',
        calendar_type: 'interview',
        start_date: searchParams.get('date') || getTodayDate(),
        start_time: searchParams.get('time') || '09:00',
        end_date: searchParams.get('date') || getTodayDate(),
        end_time: searchParams.get('time') ?
            (() => {
                const startTime = searchParams.get('time');
                const [hours, minutes] = startTime.split(':');
                const endHour = parseInt(hours) + 1;
                return `${String(endHour).padStart(2, '0')}:${minutes}`;
            })() : '10:00',
        duration_hour: 1,
        participant: [''],
        calendar_desc: '',
        calendar_note: '',
        outcome_score: null,
        outcome_note: '',
        video_link: ''
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calendarTypes = [
        {value: 'phone call', label: 'Phone Call'},
        {value: 'interview', label: 'Interview'},
        {value: 'on site', label: 'On Site'},
        {value: 'technical', label: 'Technical'}
    ];

    const outcomeScores = Array.from({length: 10}, (_, i) => i + 1);
    const timeSlots = getTimeSlots();

    useEffect(() => {
        fetchJobs();
        if (isEdit) {
            fetchAppointmentData();
        } else {
            // Pre-select job if job_id is in query params
            const jobIdParam = searchParams.get('job_id');
            if (jobIdParam) {
                setFormData(prev => ({...prev, job_id: jobIdParam}));
            }
            calculateAndSetDuration();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!isEdit) {
            calculateAndSetDuration();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.start_date, formData.start_time, formData.end_date, formData.end_time]);

    const fetchJobs = async () => {
        try {
            const response = await apiService.getJobList();
            setJobs(response || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        }
    };

    const fetchAppointmentData = async () => {
        try {
            setLoading(true);
            const appointment = await apiService.getCalendarEvent(id);
            setFormData({
                ...appointment,
                participant: Array.isArray(appointment.participant) ?
                    appointment.participant : [appointment.participant || '']
            });
        } catch (error) {
            console.error('Error fetching appointment:', error);
            setError('Failed to load appointment data');
        } finally {
            setLoading(false);
        }
    };

    const calculateAndSetDuration = () => {
        const duration = calculateDuration(
            formData.start_date,
            formData.start_time,
            formData.end_date,
            formData.end_time
        );
        setFormData(prev => ({...prev, duration_hour: duration}));
    };

    const handleChange = (e) => {
        const {name, value} = e.target;

        // Auto-populate End Date when Start Date is selected
        if (name === 'start_date') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                end_date: value
            }));
        }
        // Auto-populate End Time when Start Time is selected (add 1 hour)
        else if (name === 'start_time') {
            const [hours, minutes] = value.split(':');
            const endHour = (parseInt(hours) + 1) % 24;
            const endTime = `${String(endHour).padStart(2, '0')}:${minutes}`;
            setFormData(prev => ({
                ...prev,
                [name]: value,
                end_time: endTime
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleParticipantChange = (index, value) => {
        const newParticipants = [...formData.participant];
        newParticipants[index] = value;
        setFormData(prev => ({
            ...prev,
            participant: newParticipants
        }));
    };

    const addParticipantField = () => {
        setFormData(prev => ({
            ...prev,
            participant: [...prev.participant, '']
        }));
    };

    const removeParticipantField = (index) => {
        if (formData.participant.length > 1) {
            const newParticipants = formData.participant.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                participant: newParticipants
            }));
        }
    };

    const handleParticipantKeyPress = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addParticipantField();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Auto-prepend https:// to video_link if protocol is missing
            let videoLink = formData.video_link.trim();
            if (videoLink && !videoLink.startsWith('http://') && !videoLink.startsWith('https://')) {
                videoLink = `https://${videoLink}`;
            }

            const submitData = {
                ...formData,
                job_id: parseInt(formData.job_id),
                participant: formData.participant.filter(p => p.trim() !== ''),
                outcome_score: formData.outcome_score ? parseInt(formData.outcome_score) : null,
                video_link: videoLink
            };

            if (isEdit) {
                await apiService.updateCalendarEvent(submitData);
            } else {
                await apiService.createCalendarEvent(submitData);
            }

            // Smart navigation based on where we came from
            const fromParam = searchParams.get('from');
            const jobIdParam = searchParams.get('job_id');
            const dateParam = searchParams.get('date');
            const viewParam = searchParams.get('view');

            if (fromParam === 'job-details' && jobIdParam) {
                navigate(`/job-details/${jobIdParam}`);
            } else if (jobIdParam) {
                navigate(`/job-details/${jobIdParam}`);
            } else if (viewParam) {
                // Return to specific calendar view
                navigate(`/calendar?view=${viewParam}${dateParam ? `&date=${dateParam}` : ''}`);
            } else if (dateParam) {
                // Return to calendar with date
                navigate(`/calendar?date=${dateParam}`);
            } else {
                navigate('/calendar');
            }
        } catch (error) {
            console.error('Error saving appointment:', error);
            setError('Failed to save appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Smart navigation based on where we came from
        const fromParam = searchParams.get('from');
        const jobIdParam = searchParams.get('job_id');
        const dateParam = searchParams.get('date');
        const viewParam = searchParams.get('view');

        if (fromParam === 'job-details' && jobIdParam) {
            navigate(`/job-details/${jobIdParam}`);
        } else if (jobIdParam) {
            navigate(`/job-details/${jobIdParam}`);
        } else if (viewParam) {
            // Return to specific calendar view
            navigate(`/calendar?view=${viewParam}${dateParam ? `&date=${dateParam}` : ''}`);
        } else if (dateParam) {
            // Return to calendar with date
            navigate(`/calendar?date=${dateParam}`);
        } else {
            navigate('/calendar');
        }
    };

    if (loading && isEdit) {
        return <div className="loading">Loading appointment data...</div>;
    }

    return (
        <div className="calendar-form-container">
            <div className="calendar-form-header">
                <h1>{isEdit ? 'Edit Appointment' : 'Add New Appointment'}</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="calendar-form">
                <input type="hidden" name="calendar_id" value={formData.calendar_id}/>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="job_id">Job *</label>
                        <select
                            id="job_id"
                            name="job_id"
                            value={formData.job_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a job</option>
                            {jobs.map(job => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.company}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="calendar_type">Calendar Type *</label>
                        <select
                            id="calendar_type"
                            name="calendar_type"
                            value={formData.calendar_type}
                            onChange={handleChange}
                            required
                        >
                            {calendarTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">Start Date *</label>
                        <div className="date-input-container">
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                            <span className="calendar-icon">📅</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="start_time">Start Time *</label>
                        <div className="time-input-container">
                            <select
                                id="start_time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                required
                            >
                                {timeSlots.map(slot => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.display}
                                    </option>
                                ))}
                            </select>

                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="end_date">End Date *</label>
                        <div className="date-input-container">
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
                            <span className="calendar-icon">📅</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="end_time">End Time *</label>
                        <div className="time-input-container">
                            <select
                                id="end_time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                required
                            >
                                {timeSlots.map(slot => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.display}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Duration: {formData.duration_hour} hours</label>
                    <div className="duration-display">
                        Calculated automatically from start and end times
                    </div>
                </div>

                <div className="form-group">
                    <label>Participants</label>
                    <div className="participants-container">
                        {formData.participant.map((participant, index) => (
                            <div key={index} className="participant-row">
                                <input
                                    type="text"
                                    value={participant}
                                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                                    onKeyPress={(e) => handleParticipantKeyPress(e, index)}
                                    placeholder="Enter participant name"
                                />
                                {formData.participant.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeParticipantField(index)}
                                        className="remove-participant"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addParticipantField}
                            className="add-participant"
                        >
                            + Add Participant
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="calendar_desc">Description</label>
                    <input
                        type="text"
                        id="calendar_desc"
                        name="calendar_desc"
                        value={formData.calendar_desc}
                        onChange={handleChange}
                        placeholder="Brief description of the appointment"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="calendar_note">Notes</label>
                    <textarea
                        id="calendar_note"
                        name="calendar_note"
                        value={formData.calendar_note}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Additional notes about the appointment..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="outcome_score">Outcome Score</label>
                        <select
                            id="outcome_score"
                            name="outcome_score"
                            value={formData.outcome_score || ''}
                            onChange={handleChange}
                        >
                            <option value="">Select score</option>
                            {outcomeScores.map(score => (
                                <option key={score} value={score}>
                                    {score}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="outcome_note">Outcome Note</label>
                        <input
                            type="text"
                            id="outcome_note"
                            name="outcome_note"
                            value={formData.outcome_note}
                            onChange={handleChange}
                            placeholder="How did it go?"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="video_link">Video Link</label>
                    <input
                        type="text"
                        id="video_link"
                        name="video_link"
                        value={formData.video_link}
                        onChange={handleChange}
                        placeholder="https://... (protocol added automatically)"
                    />
                </div>

                <div className="form-actions">
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
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (isEdit ? 'Update Appointment' : 'Add Appointment')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CalendarForm;