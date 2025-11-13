import React, {useState, useEffect} from 'react';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import './ViewResume.css';

const ViewResume = () => {
    const {id} = useParams();
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
    }, [resumeId]);

    const fetchResumeDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://api.jobtracker.com/v1/resume/detail/${resumeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch resume details');
            }
            const data = await response.json();
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

            // Call convert/final endpoint to generate the file
            const convertResponse = await fetch('http://api.jobtracker.com/v1/convert/final', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resume_id: parseInt(resumeId),
                    output_format: format
                }),
            });

            if (!convertResponse.ok) {
                throw new Error('Failed to convert resume');
            }

            const {file_name} = await convertResponse.json();

            // Get personal info for custom filename
            const personalInfoResponse = await fetch('http://api.jobtracker.com/v1/personal');
            const personalInfo = await personalInfoResponse.json();
            const firstName = personalInfo.first_name || 'resume';
            const lastName = personalInfo.last_name || '';

            // Create standardized filename: resume-first_name_last_name.ext
            const downloadFileName = lastName
                ? `resume-${firstName}_${lastName}.${format}`.toLowerCase().replace(/ /g, '_')
                : `resume-${firstName}.${format}`.toLowerCase().replace(/ /g, '_');

            // Download the file
            const downloadUrl = `http://api.jobtracker.com/v1/file/download/resume/${file_name}`;
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

    const renderKeywords = () => {
        if (!resumeDetail) return null;

        const keywords = resumeDetail.keyword_final || [];
        const focusKeywords = resumeDetail.focus_final || [];

        // Split into columns to avoid excessive scrolling
        const midpoint = Math.ceil(Math.max(keywords.length, focusKeywords.length) / 2);

        return (
            <div className="keywords-container">
                <div className="keywords-section">
                    <h3 className="keywords-heading">Keywords</h3>
                    <div className="keywords-columns">
                        <div className="keywords-column">
                            {keywords.slice(0, midpoint).map((keyword, index) => (
                                <div key={index} className="keyword-item">{keyword}</div>
                            ))}
                        </div>
                        <div className="keywords-column">
                            {keywords.slice(midpoint).map((keyword, index) => (
                                <div key={index + midpoint} className="keyword-item">{keyword}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="keywords-section">
                    <h3 className="keywords-heading">Focused Keywords</h3>
                    <div className="keywords-columns">
                        <div className="keywords-column">
                            {focusKeywords.slice(0, midpoint).map((keyword, index) => (
                                <div key={index} className="keyword-item">{keyword}</div>
                            ))}
                        </div>
                        <div className="keywords-column">
                            {focusKeywords.slice(midpoint).map((keyword, index) => (
                                <div key={index + midpoint} className="keyword-item">{keyword}</div>
                            ))}
                        </div>
                    </div>
                </div>
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
            if (!resumeDetail || !resumeDetail.resume_html_rewrite) {
                return <div className="no-content">No resume content available</div>;
            }
            return (
                <iframe
                    className="resume-iframe"
                    srcDoc={resumeDetail.resume_html_rewrite}
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
