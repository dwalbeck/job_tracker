import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import HtmlDiff from 'htmldiff-js';
import apiService from '../../services/api';
import './OptimizedResume.css';

const OptimizedResume = () => {
    const {id: resumeId} = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [baselineScore, setBaselineScore] = useState(0);
    const [rewriteScore, setRewriteScore] = useState(0);
    const [htmlDiff, setHtmlDiff] = useState('');
    const [changeStates, setChangeStates] = useState({}); // Track accepted/rejected changes
    const [jobId, setJobId] = useState(null);
    const [fromViewResume, setFromViewResume] = useState(false);
    const [originalRewriteHtml, setOriginalRewriteHtml] = useState(''); // Store original complete HTML
    const diffContainerRef = useRef(null);

    // Polling state
    const [isPolling, setIsPolling] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Helper function to extract body content only (for diffing)
    const extractBodyContent = (html) => {
        if (!html) return '';

        // Extract only content between <body> and </body>
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : html;
    };

    // Helper function to normalize whitespace for diffing
    const normalizeWhitespace = (html) => {
        if (!html) return '';

        // Normalize whitespace while preserving HTML structure
        return html
            // Remove whitespace between tags (but preserve content whitespace)
            .replace(/>\s+</g, '><')
            // Normalize multiple spaces/newlines to single space within text content
            .replace(/\s+/g, ' ')
            // Remove leading/trailing whitespace from the entire string
            .trim();
    };

    // Helper function to convert text-based bullets into HTML lists
    const convertBulletsToLists = (html) => {
        if (!html) return '';

        // Process each paragraph that contains bullet lists
        return html.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/gi, (match, openTag, content, closeTag) => {
            // Check if this paragraph contains bullets: <br>- or <br>-&nbsp;
            const hasBullets = /<br\s*\/?>\s*-\s*(&nbsp;)?/i.test(content);

            if (!hasBullets) {
                return match; // No bullets, return unchanged
            }

            // Split content by the bullet pattern to identify list items
            const bulletPattern = /(<br\s*\/?>\s*-\s*(?:&nbsp;)?)/gi;
            const parts = content.split(bulletPattern);

            let result = '';
            let inList = false;
            let listItems = [];

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                // Check if this part is a bullet marker
                if (bulletPattern.test(part)) {
                    if (!inList) {
                        // First bullet item - add <br> to end of preceding text if there is any
                        if (result.trim()) {
                            result += '<br>';
                        }
                        inList = true;
                        listItems = [];
                    }
                    // Skip the bullet marker itself, we'll add proper list tags
                    continue;
                }

                if (inList) {
                    // This is list item content
                    listItems.push(part.trim());
                } else {
                    // This is content before the first bullet
                    result += part;
                }
            }

            // If we found list items, wrap them in <ul>
            if (inList && listItems.length > 0) {
                result += '<ul>';
                listItems.forEach(item => {
                    if (item) {
                        result += `<li>${item}</li>`;
                    }
                });
                result += '</ul>';
            }

            // Return with opening tag and closing paragraph tag
            return openTag + result + closeTag;
        });
    };

    // Helper function to remove unwanted <br /> tags while preserving bullet list breaks
    const removeUnwantedBreaks = (html) => {
        if (!html) return '';

        // Split by <br /> tags to analyze context
        const parts = html.split(/(<br\s*\/?>)/gi);
        let result = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // If this is a <br /> tag, decide whether to keep it
            if (/<br\s*\/?>/i.test(part)) {
                const prevPart = i > 0 ? parts[i - 1] : '';
                const nextPart = i < parts.length - 1 ? parts[i + 1] : '';

                // Extract text content around the break (strip HTML tags)
                const prevText = prevPart.replace(/<[^>]*>/g, '').trim();
                const nextText = nextPart.replace(/<[^>]*>/g, '').trim();

                // Keep the <br /> if:
                // 1. Current line (before break) starts with "- " (has a bullet)
                // 2. OR next line (after break) starts with "- " (next line has a bullet)
                const keepBreak = prevText.startsWith('- ') || nextText.startsWith('- ');

                if (keepBreak) {
                    result += part;
                }
                // Otherwise, skip the <br /> tag (don't add it to result)
            } else {
                // Not a <br /> tag, keep the content
                result += part;
            }
        }

        return result;
    };

    // Polling logic for long-running AI resume rewrite process
    useEffect(() => {
        // Check if we need to poll for process completion
        if (location.state?.isPolling && location.state?.processId) {
            const processId = location.state.processId;
            const jobIdFromState = location.state.jobId;

            setIsPolling(true);
            setLoadingMessage('AI is rewriting your resume based on the job posting... Please wait.');
            setJobId(jobIdFromState);

            // Start polling
            const pollProcess = async () => {
                const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
                let attempts = 0;

                const poll = async () => {
                    attempts++;

                    try {
                        const pollResponse = await apiService.request(`/v1/process/poll/${processId}`, {
                            method: 'GET',
                            timeout: 10000
                        });

                        if (pollResponse.process_state === 'complete' || pollResponse.process_state === 'confirmed') {
                            setLoadingMessage('Resume rewrite complete! Loading results...');

                            // Fetch the completed resume data
                            try {
                                const resumeData = await apiService.request(`/v1/resume/rewrite/${jobIdFromState}`, {
                                    method: 'GET',
                                    timeout: 30000
                                });

                                // Populate the state with the resume data
                                const origHtml = resumeData.resume_html || '';
                                const rewrHtml = resumeData.resume_html_rewrite || '';

                                setOriginalRewriteHtml(rewrHtml);

                                // Generate HTML diff (same logic as existing useEffect)
                                try {
                                    let origBodyContent = extractBodyContent(origHtml);
                                    let rewrBodyContent = extractBodyContent(rewrHtml);

                                    origBodyContent = convertBulletsToLists(origBodyContent);
                                    origBodyContent = removeUnwantedBreaks(origBodyContent);
                                    origBodyContent = normalizeWhitespace(origBodyContent);

                                    rewrBodyContent = convertBulletsToLists(rewrBodyContent);
                                    rewrBodyContent = removeUnwantedBreaks(rewrBodyContent);
                                    rewrBodyContent = normalizeWhitespace(rewrBodyContent);

                                    const diff = HtmlDiff.execute(origBodyContent, rewrBodyContent);
                                    setHtmlDiff(diff);
                                } catch (error) {
                                    console.error('Error generating HTML diff:', error);
                                    setHtmlDiff('');
                                }

                                setBaselineScore(resumeData.baseline_score || 0);
                                setRewriteScore(resumeData.rewrite_score || 0);

                                setIsPolling(false);
                                setLoadingMessage('');
                            } catch (error) {
                                console.error('Error fetching resume data:', error);
                                setIsPolling(false);
                                setLoadingMessage('');
                                alert('Failed to load resume data after completion. Please try again.');
                                navigate(`/job-details/${jobIdFromState}`);
                            }
                            return;
                        } else if (pollResponse.process_state === 'failed') {
                            console.error('Process failed');
                            setIsPolling(false);
                            setLoadingMessage('');
                            alert('Resume rewrite process failed. Please try again.');
                            navigate(`/job-details/${jobIdFromState}`);
                            return;
                        }

                        // Still running, continue polling
                        if (attempts >= maxAttempts) {
                            console.error('Polling timeout');
                            setIsPolling(false);
                            setLoadingMessage('');
                            alert('Resume rewrite is taking longer than expected. Please check back later.');
                            navigate(`/job-details/${jobIdFromState}`);
                            return;
                        }

                        setTimeout(poll, 5000);
                    } catch (error) {
                        console.error('Poll request failed:', error);
                        setIsPolling(false);
                        setLoadingMessage('');
                        alert('Failed to check resume rewrite status. Please try again.');
                        navigate(`/job-details/${jobIdFromState}`);
                    }
                };

                // Start the polling loop
                poll();
            };

            pollProcess();
        }
    }, [location.state, navigate]); // Dependencies

    useEffect(() => {
        if (location.state && !location.state.isPolling) {
            const origHtml = location.state.resumeHtml || '';
            const rewrHtml = location.state.resumeHtmlRewrite || '';

            // Store the original complete rewritten HTML
            setOriginalRewriteHtml(rewrHtml);

            // Generate HTML diff with inline highlights (only for body content)
            try {
                // Extract only body content for diffing (preserves full document structure)
                let origBodyContent = extractBodyContent(origHtml);
                let rewrBodyContent = extractBodyContent(rewrHtml);

                // Process body content for better diff visualization
                origBodyContent = convertBulletsToLists(origBodyContent);
                origBodyContent = removeUnwantedBreaks(origBodyContent);
                origBodyContent = normalizeWhitespace(origBodyContent);

                rewrBodyContent = convertBulletsToLists(rewrBodyContent);
                rewrBodyContent = removeUnwantedBreaks(rewrBodyContent);
                rewrBodyContent = normalizeWhitespace(rewrBodyContent);

                const diff = HtmlDiff.execute(origBodyContent, rewrBodyContent);
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
        if (diffContainerRef.current) {
            const container = diffContainerRef.current;

            // Find all ins and del elements
            const insElements = container.querySelectorAll('ins');
            const delElements = container.querySelectorAll('del');

            // Add unique IDs and click handlers (skip single-character changes)
            insElements.forEach((el, index) => {
                // Skip single-character changes (likely artifacts)
                if (el.textContent.length <= 1) {
                    el.style.display = 'none'; // Hide single-char artifacts
                    return;
                }

                const changeId = `ins-${index}`;
                el.setAttribute('data-change-id', changeId);
                el.style.cursor = 'pointer';
                el.title = 'Click to reject this addition';

                el.onclick = () => toggleChange(changeId, 'ins', el);
            });

            delElements.forEach((el, index) => {
                // Skip single-character changes (likely artifacts)
                if (el.textContent.length <= 1) {
                    el.style.display = 'none'; // Hide single-char artifacts
                    return;
                }

                const changeId = `del-${index}`;
                el.setAttribute('data-change-id', changeId);
                el.style.cursor = 'pointer';
                el.title = 'Click to keep this (reject deletion)';

                el.onclick = () => toggleChange(changeId, 'del', el);
            });
        }
    }, [htmlDiff]);

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
        if (!diffContainerRef.current || !originalRewriteHtml) {
            return originalRewriteHtml || htmlDiff;
        }

        // Clone the diff container to work with
        const diffClone = diffContainerRef.current.cloneNode(true);

        // Find the html-diff-content div and get its content
        const diffContentDiv = diffClone.querySelector('.html-diff-content');
        if (!diffContentDiv) {
            console.error('Could not find .html-diff-content div');
            return originalRewriteHtml;
        }

        // Process all changes based on their state
        const insElements = diffContentDiv.querySelectorAll('ins');
        const delElements = diffContentDiv.querySelectorAll('del');

        insElements.forEach((el) => {
            const changeId = el.getAttribute('data-change-id');
            const state = changeStates[changeId] || 'accepted';

            if (state === 'accepted') {
                // Keep the insertion - unwrap the <ins> tag but keep its content
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.remove();
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
                // Reject the deletion - unwrap the <del> tag but keep its content
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.remove();
            }
        });

        // Clean up any remaining ins/del tags (single-character artifacts)
        diffContentDiv.querySelectorAll('ins, del').forEach(el => {
            if (el.textContent.length <= 1) {
                el.remove();
            } else {
                // Unwrap any remaining tags
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.remove();
            }
        });

        // Get the processed body content (without wrapper divs)
        const processedBodyContent = diffContentDiv.innerHTML;

        // Now reconstruct the full HTML document with the original structure
        // Parse the original HTML to get DOCTYPE, head (including styles), etc.
        const parser = new DOMParser();
        const originalDoc = parser.parseFromString(originalRewriteHtml, 'text/html');

        // Replace the body content with our processed content
        if (originalDoc.body) {
            originalDoc.body.innerHTML = processedBodyContent;
        }

        // Serialize back to string with proper document structure
        const serializer = new XMLSerializer();
        let finalHtml = serializer.serializeToString(originalDoc);

        // Clean up XML artifacts from serializer (it adds xmlns)
        finalHtml = finalHtml.replace(/ xmlns="[^"]*"/g, '');

        return finalHtml;
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

    // Show loading screen while polling
    if (isPolling) {
        return (
            <div className="optimized-resume">
                <div className="resume-header">
                    <h1 className="page-title">Processing Resume</h1>
                </div>
                <div className="loading-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '40px'
                }}>
                    <div className="spinner" style={{
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '20px'
                    }}></div>
                    <p style={{fontSize: '18px', color: '#555', textAlign: 'center'}}>
                        {loadingMessage}
                    </p>
                    <p style={{fontSize: '14px', color: '#888', marginTop: '10px'}}>
                        This may take a few minutes...
                    </p>
                </div>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

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

            <div className="diff-help-text">
                Click on any highlighted change to toggle it. Green = additions, Red with strikethrough = deletions.
                Clicking toggles between accepting and rejecting each change.
            </div>

            <div className="diff-container">
                <div className="rendered-diff-container" ref={diffContainerRef}>
                    <div
                        className="html-diff-content"
                        dangerouslySetInnerHTML={{__html: htmlDiff}}
                    />
                </div>
            </div>

            <div className="button-container">
                <button onClick={handleCancel} className="cancel-button">
                    Cancel
                </button>
                <button onClick={handleAcceptChanges} className="action-button">
                    Accept Changes
                </button>
            </div>
        </div>
    );
};

export default OptimizedResume;
