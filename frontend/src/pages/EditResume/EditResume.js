import React, {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import './EditResume.css';

const EditResume = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const resumeId = searchParams.get('resume_id');
    const jobId = searchParams.get('job_id');

    const [resumeHtml, setResumeHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showRendered, setShowRendered] = useState(false);

    useEffect(() => {
        if (resumeId) {
            fetchResumeDetail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeId]);

    const fetchResumeDetail = async () => {
        try {
            setLoading(true);
            const data = await apiService.getResumeDetail(resumeId);

            // Use rewritten HTML if available, otherwise fall back to baseline HTML
            const htmlContent = data.resume_html_rewrite || data.resume_html || '';
            setResumeHtml(htmlContent);
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

            // Save to resume_html_rewrite
            await apiService.updateResumeDetail({
                resume_id: parseInt(resumeId),
                resume_html_rewrite: resumeHtml
            });

            // Navigate back to view resume page
            handleGoBack();
        } catch (error) {
            console.error('Error saving resume:', error);
            alert('Failed to save resume changes');
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        navigate(`/view-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
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
                        onClick={() => setShowRendered(!showRendered)}
                        className="toggle-button"
                    >
                        {showRendered ? 'Show Raw HTML' : 'Show Preview'}
                    </button>
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
                {showRendered ? (
                    <iframe
                        className="resume-preview"
                        srcDoc={resumeHtml}
                        title="Resume Preview"
                        sandbox="allow-same-origin"
                    />
                ) : (
                    <textarea
                        className="resume-editor"
                        value={resumeHtml}
                        onChange={(e) => setResumeHtml(e.target.value)}
                        placeholder="Enter your resume content in HTML format..."
                    />
                )}
            </div>
        </div>
    );
};

export default EditResume;
