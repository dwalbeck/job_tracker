import React, {useState, useEffect} from 'react';
import apiService from '../../services/api';
import './Personal.css';

const Personal = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [personalData, setPersonalData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        portfolio_url: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        no_response_week: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fieldLabels = {
        first_name: 'First Name',
        last_name: 'Last Name',
        email: 'Email',
        phone: 'Phone Number',
        linkedin_url: 'LinkedIn URL',
        github_url: 'Github URL',
        website_url: 'Personal Website',
        portfolio_url: 'Portfolio URL',
        address_1: 'Street Address',
        address_2: 'Street Address 2',
        city: 'City',
        state: 'State/Province',
        zip: 'Zip Code',
        country: 'Country',
        no_response_week: 'Auto Status Change'
    };

    useEffect(() => {
        fetchPersonalInfo();
    }, []);

    const fetchPersonalInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getPersonalInfo();
            setPersonalData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching personal info:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchPersonalInfo(); // Reset to original data
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setPersonalData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setError(null);
        try {
            await apiService.savePersonalInfo(personalData);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
            console.error('Error saving personal info:', err);
        }
    };

    if (loading) {
        return <div className="personal-container">Loading...</div>;
    }

    return (
        <div className="personal-container">
            <div className="personal-header">
                <h1 className="personal-title">Personal Information</h1>
                {!isEditing && (
                    <button className="edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="personal-content">
                {Object.keys(fieldLabels).map((fieldName) => (
                    <div key={fieldName} className="personal-field-row">
                        <label className="personal-label">
                            {fieldLabels[fieldName]}
                        </label>
                        {isEditing ? (
                            <div className="personal-input-wrapper">
                                <input
                                    type={fieldName === 'no_response_week' ? 'number' : 'text'}
                                    name={fieldName}
                                    value={personalData[fieldName]}
                                    onChange={handleChange}
                                    className="personal-input"
                                    min={fieldName === 'no_response_week' ? '1' : undefined}
                                    max={fieldName === 'no_response_week' ? '52' : undefined}
                                />
                                {fieldName === 'no_response_week' && (
                                    <span className="personal-input-suffix">weeks of no contact</span>
                                )}
                            </div>
                        ) : (
                            <span className="personal-value">
                {personalData[fieldName]
                    ? (fieldName === 'no_response_week'
                        ? `${personalData[fieldName]} weeks of no contact`
                        : personalData[fieldName])
                    : '-'}
              </span>
                        )}
                    </div>
                ))}
            </div>

            {isEditing && (
                <div className="personal-actions">
                    <button className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="save-button" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default Personal;
