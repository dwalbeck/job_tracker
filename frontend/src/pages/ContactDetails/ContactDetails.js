import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import apiService from '../../services/api';
import './ContactDetails.css';

const ContactDetails = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {selectedJobId, selectJob} = useJob();
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContactDetails();
    }, [id]);

    const fetchContactDetails = async () => {
        try {
            setLoading(true);
            const contactData = await apiService.getContact(id);
            setContact(contactData);
        } catch (error) {
            console.error('Error fetching contact details:', error);
            setError('Failed to load contact details');
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/contacts');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await apiService.deleteContact(id);
                navigate('/contacts');
            } catch (error) {
                console.error('Error deleting contact:', error);
                alert('Failed to delete contact');
            }
        }
    };

    const handleEdit = () => {
        navigate(`/contact-form/${id}`);
    };

    const handleJobClick = (job) => {
        selectJob(job.job_id);
        navigate(`/job-details/${job.job_id}`);
    };

    if (loading) {
        return <div className="loading">Loading contact details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!contact) {
        return <div className="error">Contact not found</div>;
    }

    return (
        <div className="contact-details">
            <div className="contact-details-header">
                <div className="header-left">
                    <button onClick={handleGoBack} className="back-button">
                        ←
                    </button>
                    <h1>Contact Details</h1>
                </div>
                <div className="header-controls">
                    <button onClick={handleEdit} className="edit-button">
                        Edit
                    </button>
                    <button onClick={handleDelete} className="delete-button">
                        Delete
                    </button>
                </div>
            </div>

            <div className="contact-details-content">
                <div className="detail-row">
                    <span className="detail-label">First Name:</span>
                    <span className="detail-value">{contact.first_name}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Last Name:</span>
                    <span className="detail-value">{contact.last_name}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Job Title:</span>
                    <span className="detail-value">{contact.job_title || 'Not specified'}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
            {contact.email ? (
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
            ) : (
                'Not specified'
            )}
          </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
            {contact.phone ? (
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            ) : (
                'Not specified'
            )}
          </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Company:</span>
                    <span className="detail-value">{contact.company || 'Not specified'}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">LinkedIn:</span>
                    <span className="detail-value">
            {contact.linkedin ? (
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                    {contact.linkedin}
                </a>
            ) : (
                'Not specified'
            )}
          </span>
                </div>

                {contact.contact_note && (
                    <div className="detail-row note-row">
                        <span className="detail-label">Notes:</span>
                        <div className="detail-value note-content">
                            {contact.contact_note}
                        </div>
                    </div>
                )}

                {contact.linked_to && contact.linked_to.length > 0 && (
                    <div className="detail-row linked-jobs-row">
                        <span className="detail-label">Linked Jobs:</span>
                        <div className="detail-value">
                            <div className="linked-jobs">
                                {contact.linked_to.map((job, index) => (
                                    <div key={index} className="linked-job">
                                        <button
                                            onClick={() => handleJobClick(job)}
                                            className="job-link"
                                        >
                                            {job.company} - {job.job_title}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactDetails;