import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Editor} from '@tinymce/tinymce-react';
import apiService from '../../services/api';
import './ManuallyEditResume.css';

const ManuallyEditResume = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resume_id');
    const jobId = searchParams.get('job_id');
    const editorRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [initialContent, setInitialContent] = useState('');
    const [tinyMceApiKey, setTinyMceApiKey] = useState('');

    useEffect(() => {
        if (resumeId) {
            fetchResumeContent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeId]);

    const fetchResumeContent = async () => {
        try {
            setLoading(true);

            // Get TinyMCE API key from personal settings
            const personalInfo = await apiService.getPersonalInfo();
            setTinyMceApiKey(personalInfo.tinymce_api_key || '');

            const data = await apiService.getResumeDetail(resumeId);

            // Use rewritten HTML if available, otherwise fall back to baseline HTML
            const htmlContent = data.resume_html_rewrite || data.resume_html || '';
            setInitialContent(htmlContent);
            setError(null);
        } catch (error) {
            console.error('Error fetching resume content:', error);
            setError('Failed to load resume content');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editorRef.current) {
            alert('Editor not initialized');
            return;
        }

        try {
            setSaving(true);
            const content = editorRef.current.getContent();

            // Update the resume_html_rewrite field
            await apiService.updateResumeDetail({
                resume_id: parseInt(resumeId),
                resume_html_rewrite: content
            });

            handleCancel();
        } catch (error) {
            console.error('Error saving resume:', error);
            alert('Failed to save resume. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/view-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
    };

    if (loading) {
        return <div className="manually-edit-resume loading">Loading resume...</div>;
    }

    if (error) {
        return <div className="manually-edit-resume error">{error}</div>;
    }

    return (
        <div className="manually-edit-resume">
            <div className="edit-resume-header">
                <div className="header-left">
                    <button onClick={handleCancel} className="back-button">
                        ←
                    </button>
                    <h1>Manually Edit Resume</h1>
                </div>
            </div>

            <div className="editor-container">
                <Editor
                    apiKey={tinyMceApiKey}
                    onInit={(_evt, editor) => editorRef.current = editor}
                    initialValue={initialContent}
                    init={{
                        height: 600,
                        menubar: true,
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        branding: false,
                        resize: true
                    }}
                />
            </div>

            <div className="editor-footer">
                <button
                    onClick={handleCancel}
                    className="cancel-button"
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="save-button"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
};

export default ManuallyEditResume;
