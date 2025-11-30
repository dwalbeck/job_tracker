import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import ReactDiffViewer from 'react-diff-viewer-continued';
import HtmlDiff from 'htmldiff-js';
import apiService from '../../services/api';
import './OptimizedResume.css';

const OptimizedResume = () => {
    const {id: resumeId} = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [baselineScore, setBaselineScore] = useState(0);
    const [rewriteScore, setRewriteScore] = useState(0);
    const [originalText, setOriginalText] = useState('');
    const [rewrittenText, setRewrittenText] = useState('');
    const [originalHtml, setOriginalHtml] = useState('');
    const [rewrittenHtml, setRewrittenHtml] = useState('');
    const [htmlDiff, setHtmlDiff] = useState('');
    const [viewMode, setViewMode] = useState('rendered'); // 'rendered' or 'source'
    const [changeStates, setChangeStates] = useState({}); // Track accepted/rejected changes
    const [jobId, setJobId] = useState(null);
    const [fromViewResume, setFromViewResume] = useState(false);
    const diffContainerRef = useRef(null);

    useEffect(() => {
        if (location.state) {
            const origHtml = location.state.resumeHtml || '';
            const rewrHtml = location.state.resumeHtmlRewrite || '';

            // Store original HTML for rendered view
            setOriginalHtml(origHtml);
            setRewrittenHtml(rewrHtml);

            // Format HTML for source diff view
            setOriginalText(formatHtmlForDiff(origHtml));
            setRewrittenText(formatHtmlForDiff(rewrHtml));

            // Generate HTML diff with inline highlights
            try {
                const diff = HtmlDiff.execute(origHtml, rewrHtml);
                setHtmlDiff(diff);
            } catch (error) {
                console.error('Error generating HTML diff:', error);
                setHtmlDiff('');
            }

            setBaselineScore(location.state.baselineScore || 0);
            setRewriteScore(location.state.rewriteScore || 0);
            setJobId(location.state.jobId || null);
            setFromViewResume(location.state.fromViewResume || false);
        }
    }, [location.state]);

    // Make diff changes interactive
    useEffect(() => {
        if (viewMode === 'rendered' && diffContainerRef.current) {
            const container = diffContainerRef.current;

            // Find all ins and del elements
            const insElements = container.querySelectorAll('ins');
            const delElements = container.querySelectorAll('del');

            // Add unique IDs and click handlers
            insElements.forEach((el, index) => {
                const changeId = `ins-${index}`;
                el.setAttribute('data-change-id', changeId);
                el.style.cursor = 'pointer';
                el.title = 'Click to reject this addition';

                el.onclick = () => toggleChange(changeId, 'ins', el);
            });

            delElements.forEach((el, index) => {
                const changeId = `del-${index}`;
                el.setAttribute('data-change-id', changeId);
                el.style.cursor = 'pointer';
                el.title = 'Click to keep this (reject deletion)';

                el.onclick = () => toggleChange(changeId, 'del', el);
            });
        }
    }, [htmlDiff, viewMode]);

    const toggleChange = (changeId, changeType, element) => {
        setChangeStates(prev => {
            const newState = {...prev};
            const currentState = newState[changeId] || 'accepted';

            if (currentState === 'accepted') {
                // Reject the change
                newState[changeId] = 'rejected';
                if (changeType === 'ins') {
                    // Hide the inserted text
                    element.style.display = 'none';
                } else {
                    // Show deleted text normally (remove strikethrough)
                    element.style.textDecoration = 'none';
                    element.style.backgroundColor = '#fff3cd';
                    element.title = 'Click to accept deletion';
                }
            } else {
                // Accept the change
                newState[changeId] = 'accepted';
                if (changeType === 'ins') {
                    // Show the inserted text
                    element.style.display = 'inline';
                } else {
                    // Show as deleted (strikethrough)
                    element.style.textDecoration = 'line-through';
                    element.style.backgroundColor = '#ffa8a8';
                    element.title = 'Click to keep this (reject deletion)';
                }
            }

            return newState;
        });
    };

    // Format HTML for better diffing - preserve structure but make it more readable
    const formatHtmlForDiff = (html) => {
        if (!html) return '';

        // Add newlines after block-level closing tags for better line-by-line comparison
        let formatted = html
            // Block level elements - add newlines
            .replace(/<\/(p|div|h[1-6]|li|ul|ol|section|article|header|footer|table|tr|td|th)>/gi, '</$1>\n')
            // Opening block elements
            .replace(/<(p|div|h[1-6]|li|ul|ol|section|article|header|footer|table|tr|td|th)[^>]*>/gi, '\n<$1>')
            // Clean up multiple newlines
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return formatted;
    };

    const handleCancel = () => {
        if (fromViewResume) {
            navigate(`/view-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
        } else if (jobId) {
            navigate(`/job-details/${jobId}`);
        } else {
            navigate('/job-tracker');
        }
    };

    const reconstructHtml = () => {
        if (!diffContainerRef.current) return rewrittenHtml;

        // Clone the diff container to work with
        const clone = diffContainerRef.current.cloneNode(true);

        // Process all changes based on their state
        const insElements = clone.querySelectorAll('ins');
        const delElements = clone.querySelectorAll('del');

        insElements.forEach((el) => {
            const changeId = el.getAttribute('data-change-id');
            const state = changeStates[changeId] || 'accepted';

            if (state === 'accepted') {
                // Keep the insertion - replace <ins> with its content
                const textNode = document.createTextNode(el.textContent);
                el.parentNode.replaceChild(textNode, el);
            } else {
                // Reject the insertion - remove it entirely
                el.remove();
            }
        });

        delElements.forEach((el) => {
            const changeId = el.getAttribute('data-change-id');
            const state = changeStates[changeId] || 'accepted';

            if (state === 'accepted') {
                // Accept the deletion - remove the element
                el.remove();
            } else {
                // Reject the deletion - keep the original text
                const textNode = document.createTextNode(el.textContent);
                el.parentNode.replaceChild(textNode, el);
            }
        });

        return clone.innerHTML;
    };

    const handleAcceptChanges = async () => {
        try {
            // Reconstruct HTML based on user's change selections
            const finalHtml = reconstructHtml();

            await apiService.updateResumeDetail({
                resume_id: parseInt(resumeId),
                resume_html_rewrite: finalHtml
            });

            if (fromViewResume) {
                navigate(`/view-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
            } else if (jobId) {
                navigate(`/job-details/${jobId}`);
            } else {
                navigate('/resume');
            }
        } catch (error) {
            console.error('Error saving resume changes:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    return (
        <div className="optimized-resume">
            <div className="resume-header">
                <h1 className="page-title">Resume Comparison</h1>
                <div className="score-display">
                    <div className="score-item">
                        <span className="score-label">baseline:</span>
                        <span className="score-value">{baselineScore}%</span>
                    </div>
                    <div className="score-item">
                        <span className="score-label">optimized:</span>
                        <span className="score-value">{rewriteScore}%</span>
                    </div>
                </div>
            </div>

            <div className="view-mode-tabs">
                <button
                    className={`tab-button ${viewMode === 'rendered' ? 'active' : ''}`}
                    onClick={() => setViewMode('rendered')}
                >
                    Rendered View
                </button>
                <button
                    className={`tab-button ${viewMode === 'source' ? 'active' : ''}`}
                    onClick={() => setViewMode('source')}
                >
                    Source View
                </button>
            </div>

            {viewMode === 'rendered' && (
                <div className="diff-help-text">
                    Click on any highlighted change to toggle it. Green = additions, Red with strikethrough = deletions.
                    Clicking toggles between accepting and rejecting each change.
                </div>
            )}

            <div className="diff-container">
                {viewMode === 'rendered' ? (
                    <div className="rendered-diff-container" ref={diffContainerRef}>
                        <div
                            className="html-diff-content"
                            dangerouslySetInnerHTML={{__html: htmlDiff}}
                        />
                    </div>
                ) : (
                    <ReactDiffViewer
                        oldValue={originalText}
                        newValue={rewrittenText}
                        splitView={true}
                        compareMethod="diffWordsWithSpace"
                        useDarkTheme={false}
                        leftTitle="Baseline Resume (Source)"
                        rightTitle="Optimized Resume (Source)"
                        styles={{
                            variables: {
                                light: {
                                    diffViewerBackground: '#fff',
                                    addedBackground: '#d4edda',
                                    addedColor: '#155724',
                                    removedBackground: '#f8d7da',
                                    removedColor: '#721c24',
                                    wordAddedBackground: '#a6f3a6',
                                    wordRemovedBackground: '#ffa8a8',
                                    gutterBackground: '#f7f7f7',
                                    gutterColor: '#666',
                                    codeFoldBackground: '#f1f1f1',
                                    emptyLineBackground: '#fafafa',
                                    highlightBackground: '#fffbdd',
                                    highlightGutterBackground: '#ffcd3c',
                                }
                            },
                            line: {
                                padding: '10px 2px',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                fontFamily: 'Arial, sans-serif'
                            },
                            gutter: {
                                padding: '10px 8px',
                                minWidth: '50px'
                            },
                            diffContainer: {
                                marginBottom: '20px'
                            }
                        }}
                        showDiffOnly={false}
                    />
                )}
            </div>

            <div className="button-container">
                <button onClick={handleCancel} className="cancel-button">
                    Cancel
                </button>
                <button onClick={handleAcceptChanges} className="accept-button">
                    Accept Changes
                </button>
            </div>
        </div>
    );
};

export default OptimizedResume;
