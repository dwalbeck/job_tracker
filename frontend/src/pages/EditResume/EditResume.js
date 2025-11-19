import React, {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import './EditResume.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const EditResume = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const resumeId = searchParams.get('resume_id');

    const [resumeMarkdown, setResumeMarkdown] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (resumeId) {
            fetchResumeDetail();
        }
    }, [resumeId]);

    const fetchResumeDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/v1/resume/detail/${resumeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch resume details');
            }
            const data = await response.json();
            setResumeMarkdown(data.resume_markdown || '');
        } catch (error) {
            console.error('Error fetching resume detail:', error);
            setError('Failed to load resume details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch(`${API_BASE_URL}/v1/resume/detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resume_id: parseInt(resumeId),
                    resume_markdown: resumeMarkdown
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save resume');
            }

            // Navigate back to the previous page
            handleGoBack();
        } catch (error) {
            console.error('Error saving resume:', error);
            alert('Failed to save resume changes');
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        navigate('/resume');
    };

    const handleCancel = () => {
        handleGoBack();
    };

    if (loading) {
        return <div className="edit-resume loading">Loading resume...</div>;
    }

    if (error) {
        return <div className="edit-resume error">{error}</div>;
    }

    return (
        <div className="edit-resume">
            <div className="edit-resume-header">
                <div className="header-left">
                    <button onClick={handleGoBack} className="back-button">
                        ←
                    </button>
                    <h1>Edit Resume</h1>
                </div>
                <div className="header-controls">
                    <button
                        onClick={handleCancel}
                        className="cancel-button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="save-button"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="edit-resume-content">
        <textarea
            className="resume-editor"
            value={resumeMarkdown}
            onChange={(e) => setResumeMarkdown(e.target.value)}
            placeholder="Enter your resume content in Markdown format..."
        />
            </div>
        </div>
    );
};

export default EditResume;
