import React, {useState, useEffect} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import apiService from '../../services/api';
import {formatPhoneNumber} from '../../utils/phoneUtils';
import './ContactForm.css';

const ContactForm = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        contact_id: '',
        first_name: '',
        last_name: '',
        job_title: '',
        email: '',
        phone: '',
        company: '',
        linkedin: '',
        contact_note: '',
        job_id: ''
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchJobs();
        if (isEdit) {
            fetchContactData();
        } else {
            // Pre-select job if job_id is in query params
            const jobIdParam = searchParams.get('job_id');
            if (jobIdParam) {
                setFormData(prev => ({...prev, job_id: jobIdParam}));
            }
        }
    }, [id, searchParams]);

    const fetchJobs = async () => {
        try {
            const response = await apiService.getJobList();
            setJobs(response || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        }
    };

    const fetchContactData = async () => {
        try {
            setLoading(true);
            const contact = await apiService.getContact(id);
            setFormData(contact);
        } catch (error) {
            console.error('Error fetching contact:', error);
            setError('Failed to load contact data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const {name, value} = e.target;

        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submitData = {
                ...formData,
                job_id: formData.job_id ? parseInt(formData.job_id) : null
            };

            if (isEdit) {
                await apiService.updateContact(submitData);
                // Navigate back to Job Details if job_id is in query params
                const jobIdParam = searchParams.get('job_id');
                if (jobIdParam) {
                    navigate(`/job-details/${jobIdParam}`);
                } else {
                    navigate(`/contact-details/${id}`);
                }
            } else {
                const response = await apiService.createContact(submitData);
                // Navigate back to Job Details if job_id is in query params
                const jobIdParam = searchParams.get('job_id');
                if (jobIdParam) {
                    navigate(`/job-details/${jobIdParam}`);
                } else {
                    navigate(`/contact-details/${response.contact_id}`);
                }
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            setError('Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Navigate back to Job Details if job_id is in query params
        const jobIdParam = searchParams.get('job_id');
        if (jobIdParam) {
            navigate(`/job-details/${jobIdParam}`);
        } else if (isEdit) {
            navigate(`/contact-details/${id}`);
        } else {
            navigate('/contacts');
        }
    };

    if (loading && isEdit) {
        return <div className="loading">Loading contact data...</div>;
    }

    return (
        <div className="contact-form-container">
            <div className="contact-form-header">
                <h1>{isEdit ? 'Edit Contact' : 'Add New Contact'}</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="contact-form">
                <input type="hidden" name="contact_id" value={formData.contact_id}/>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="first_name">First Name *</label>
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="last_name">Last Name *</label>
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="job_title">Job Title</label>
                        <input
                            type="text"
                            id="job_title"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleChange}
                            placeholder="e.g., Senior Software Engineer"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="company">Company Name</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g., Tech Corp Inc."
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="555-123-4567"
                            maxLength="12"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/johndoe"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="job_id">Link to Job</label>
                    <select
                        id="job_id"
                        name="job_id"
                        value={formData.job_id}
                        onChange={handleChange}
                    >
                        <option value="">No job selected</option>
                        {jobs.map(job => (
                            <option key={job.job_id} value={job.job_id}>
                                {job.company} - {job.job_title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="contact_note">Note</label>
                    <textarea
                        id="contact_note"
                        name="contact_note"
                        value={formData.contact_note}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Additional notes about this contact..."
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
                        {loading ? 'Saving...' : (isEdit ? 'Update Contact' : 'Add Contact')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContactForm;