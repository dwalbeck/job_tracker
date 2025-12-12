import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import apiService from '../../services/api';
import {API_BASE_URL} from '../../config';
import './ViewResume.css';

const ViewResume = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resume_id');
    const jobId = searchParams.get('job_id');

    const [resumeDetail, setResumeDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('resume');
    const [downloading, setDownloading] = useState(false);

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
            setResumeDetail(data);
        } catch (error) {
            console.error('Error fetching resume detail:', error);
            setError('Failed to load resume details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (format) => {
        try {
            setDownloading(true);

            // Call convert/file endpoint to generate the file
            const convertResult = await apiService.convertFile(parseInt(resumeId), 'html', format);

            const {file_name} = convertResult;

            // Get personal info for custom filename
            const personalInfo = await apiService.getPersonalInfo();
            const firstName = personalInfo.first_name || 'resume';
            const lastName = personalInfo.last_name || '';

            // Create standardized filename: resume-first_name_last_name.ext
            const downloadFileName = lastName
                ? `resume-${firstName}_${lastName}.${format}`.toLowerCase().replace(/ /g, '_')
                : `resume-${firstName}.${format}`.toLowerCase().replace(/ /g, '_');

            // Download the file
            const downloadUrl = `${API_BASE_URL}/v1/file/download/resume/${file_name}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading resume:', error);
            alert('Failed to download resume');
        } finally {
            setDownloading(false);
        }
    };

    const handleGoBack = () => {
        if (jobId) {
            navigate(`/job-details/${jobId}`);
        } else {
            navigate('/resume');
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleCompareClick = () => {
        // Navigate to OptimizedResume with state indicating we came from ViewResume
        navigate(`/optimized-resume/${resumeId}`, {
            state: {
                resumeHtml: resumeDetail?.resume_html,
                resumeHtmlRewrite: resumeDetail?.resume_html_rewrite,
                baselineScore: resumeDetail?.baseline_score || 0,
                rewriteScore: resumeDetail?.rewrite_score || 0,
                jobId: jobId,
                fromViewResume: true  // Flag to indicate we came from ViewResume
            }
        });
    };

    const handleEditClick = async () => {
        try {
            // Check if TinyMCE API key is configured
            const personalInfo = await apiService.getPersonalInfo();
            console.log('Personal Info:', personalInfo);
            console.log('TinyMCE API Key:', personalInfo.tinymce_api_key);

            const hasTinyMCEKey = personalInfo.tinymce_api_key && personalInfo.tinymce_api_key.trim() !== '';
            console.log('Has TinyMCE Key:', hasTinyMCEKey);

            if (hasTinyMCEKey) {
                console.log('Routing to TinyMCE editor (ManuallyEditResume)');
                // Navigate to ManuallyEditResume page with TinyMCE
                navigate(`/manually-edit-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
            } else {
                console.log('Routing to manual HTML editor (EditResume)');
                // Navigate to EditResume page for manual HTML editing
                navigate(`/edit-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
            }
        } catch (error) {
            console.error('Error checking TinyMCE API key:', error);
            // Fallback to manual editing if there's an error
            navigate(`/edit-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
        }
    };

    const renderKeywords = () => {
        if (!resumeDetail) return null;

        // Use final keywords if available, otherwise fall back to baseline resume_keyword
        const keywords = resumeDetail.keyword_final || resumeDetail.resume_keyword || [];
        const focusKeywords = resumeDetail.focus_final || [];

        // Split into columns to avoid excessive scrolling
        const keywordMidpoint = Math.ceil(keywords.length / 2);
        const focusMidpoint = Math.ceil(focusKeywords.length / 2);

        return (
            <div className="keywords-container">
                <div className="keywords-section">
                    <h3 className="keywords-heading">Keywords</h3>
                    {keywords.length === 0 ? (
                        <div className="no-content">No keywords available</div>
                    ) : (
                        <div className="keywords-columns">
                            <div className="keywords-column">
                                {keywords.slice(0, keywordMidpoint).map((keyword, index) => (
                                    <div key={index} className="keyword-item">{keyword}</div>
                                ))}
                            </div>
                            <div className="keywords-column">
                                {keywords.slice(keywordMidpoint).map((keyword, index) => (
                                    <div key={index + keywordMidpoint} className="keyword-item">{keyword}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {focusKeywords.length > 0 && (
                    <div className="keywords-section">
                        <h3 className="keywords-heading">Focused Keywords</h3>
                        <div className="keywords-columns">
                            <div className="keywords-column">
                                {focusKeywords.slice(0, focusMidpoint).map((keyword, index) => (
                                    <div key={index} className="keyword-item">{keyword}</div>
                                ))}
                            </div>
                            <div className="keywords-column">
                                {focusKeywords.slice(focusMidpoint).map((keyword, index) => (
                                    <div key={index + focusMidpoint} className="keyword-item">{keyword}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSuggestions = () => {
        if (!resumeDetail || !resumeDetail.suggestion) return null;

        const suggestions = resumeDetail.suggestion || [];

        if (suggestions.length === 0) {
            return <div className="no-content">No suggestions available</div>;
        }

        return (
            <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                        {suggestion}
                    </div>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        if (activeTab === 'resume') {
            // Use rewritten HTML if available, otherwise fall back to baseline HTML
            const htmlContent = resumeDetail?.resume_html_rewrite || resumeDetail?.resume_html;
            if (!htmlContent) {
                return <div className="no-content">No resume content available</div>;
            }
            return (
                <iframe
                    className="resume-iframe"
                    srcDoc={htmlContent}
                    title="Resume Preview"
                    sandbox="allow-same-origin"
                />
            );
        } else if (activeTab === 'suggestions') {
            return renderSuggestions();
        } else if (activeTab === 'keywords') {
            return renderKeywords();
        }
    };

    if (loading) {
        return <div className="view-resume loading">Loading resume...</div>;
    }

    if (error) {
        return <div className="view-resume error">{error}</div>;
    }

    if (!resumeDetail) {
        return <div className="view-resume error">Resume not found</div>;
    }

    return (
        <div className="view-resume">
            <div className="view-resume-header">
                <div className="header-left">
                    <button onClick={handleGoBack} className="back-button">
                        ←
                    </button>
                    <h1>View Resume</h1>
                </div>
                <div className="header-controls">
                    <button
                        onClick={handleEditClick}
                        className="edit-button"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDownload('odt')}
                        className="download-button"
                        disabled={downloading}
                    >
                        Download odt
                    </button>
                    <button
                        onClick={() => handleDownload('docx')}
                        className="download-button"
                        disabled={downloading}
                    >
                        Download docx
                    </button>
                    <button
                        onClick={() => handleDownload('pdf')}
                        className="download-button"
                        disabled={downloading}
                    >
                        Download pdf
                    </button>
                    <button
                        onClick={() => handleDownload('html')}
                        className="download-button"
                        disabled={downloading}
                    >
                        Download html
                    </button>
                </div>
            </div>

            <div className="view-resume-tabs">
                <div
                    className={`tab-item ${activeTab === 'resume' ? 'active' : ''}`}
                    onClick={() => handleTabClick('resume')}
                >
                    View Resume
                </div>
                <div
                    className={`tab-item ${activeTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => handleTabClick('suggestions')}
                >
                    View Suggestions
                </div>
                <div
                    className={`tab-item ${activeTab === 'keywords' ? 'active' : ''}`}
                    onClick={() => handleTabClick('keywords')}
                >
                    View Keyword Lists
                </div>
                {resumeDetail?.resume_html_rewrite && (
                    <div
                        className="tab-item"
                        onClick={handleCompareClick}
                    >
                        Compare
                    </div>
                )}
            </div>

            <div className="view-resume-content">
                {renderContent()}
            </div>

            <div className="view-resume-footer">
                <button onClick={handleGoBack} className="done-button">
                    Done
                </button>
            </div>
        </div>
    );
};

export default ViewResume;
