import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import './Contacts.css';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const {selectedJobId} = useJob();
    const navigate = useNavigate();

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = contacts.filter(contact =>
                `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredContacts(filtered);
        } else {
            setFilteredContacts(contacts);
        }
    }, [searchTerm, contacts]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllContacts();
            setContacts(response || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleContactClick = (contact) => {
        navigate(`/contact-details/${contact.contact_id}`);
    };

    const handleCreateContact = () => {
        navigate('/contact-form');
    };

    const handleGoBack = () => {
        if (selectedJobId) {
            navigate(`/job-details/${selectedJobId}`);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportContacts();
            const { contact_export_dir, contact_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${contact_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = contact_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`Contacts exported to: ${contact_export_dir}/${contact_export_file}`);
        } catch (error) {
            console.error('Error exporting contacts:', error);
            alert('Failed to export contacts');
        }
    };

    return (
        <div className="contacts-page">
            <div className="contacts-header">
                <div className="header-left">
                    {selectedJobId && (
                        <button onClick={handleGoBack} className="back-button">
                            ←
                        </button>
                    )}
                    <h1>Contacts</h1>
                </div>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search contacts..."
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
                    <button onClick={handleCreateContact} className="create-contact-btn">
                        + Create Contact
                    </button>
                    <ExportMenu label="Export Contacts" onExport={handleExport} />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading contacts...</div>
            ) : (
                <div className="contacts-table-container">
                    <table className="contacts-table">
                        <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Job Title</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Company</th>
                            <th>LinkedIn</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredContacts.map(contact => (
                            <tr
                                key={contact.contact_id}
                                className="contact-row"
                                onClick={() => handleContactClick(contact)}
                            >
                                <td>{contact.first_name}</td>
                                <td>{contact.last_name}</td>
                                <td>{contact.job_title}</td>
                                <td>{contact.email}</td>
                                <td>{contact.phone}</td>
                                <td>{contact.company}</td>
                                <td>
                                    {contact.linkedin && (
                                        <a
                                            href={contact.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            linkedin
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredContacts.length === 0 && !loading && (
                        <div className="no-contacts">
                            {searchTerm ? 'No contacts match your search.' : 'No contacts found.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Contacts;