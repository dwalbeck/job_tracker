import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import apiService from '../../services/api';
import './JobAnalysis.css';

const JobAnalysis = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resume_id');

    const [qualificationText, setQualificationText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Analyzing job description...');
    const qualificationRef = useRef(null);

    useEffect(() => {
        fetchJobData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchJobData = async () => {
        try {
            setLoading(true);
            setLoadingMessage('Analyzing job description with AI...');

            // Validate job_id
            if (!id || id === 'undefined' || id === 'null') {
                throw new Error('Invalid job ID');
            }

            const data = await apiService.extractJobData(id);
            setQualificationText(data.job_qualification || '');

            // Check if this is a repeat run by fetching job details
            const jobDetails = await apiService.getJob(id);
            let keywordFinalList = [];
            let focusFinalList = [];

            if (jobDetails.resume_id) {
                // This is a repeat run - fetch existing resume details
                try {
                    const resumeDetail = await apiService.getResumeDetail(jobDetails.resume_id);
                    keywordFinalList = resumeDetail.keyword_final || [];
                    focusFinalList = resumeDetail.focus_final || [];
                } catch (error) {
                    console.warn('Could not fetch resume details:', error);
                }
            }

            // Initialize keywords with counts
            // Mark keywords that exist in keyword_final or focus_final
            const initialKeywords = (data.keywords || []).map(kw => {
                let type = 'keyword';
                if (focusFinalList.includes(kw)) {
                    type = 'focus';
                } else if (!keywordFinalList.includes(kw)) {
                    // This keyword is new (not in either list), default to keyword
                    type = 'keyword';
                }

                return {
                    text: kw,
                    type: type,
                    count: 0
                };
            });

            setKeywords(initialKeywords);

            // Perform initial highlighting after state is set
            setTimeout(() => highlightInitialKeywords(data.job_qualification, data.keywords, focusFinalList), 100);
        } catch (error) {
            console.error('Error fetching job data:', error);
            if (error.isTimeout) {
                setError('Request timed out. The AI analysis is taking longer than expected. Please try reloading the page in a moment - the analysis may have completed in the background.');
            } else {
                setError('Failed to load job description. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const highlightInitialKeywords = (text, keywordList, focusList = []) => {
        if (!qualificationRef.current || !text || !keywordList) return;

        const container = qualificationRef.current;
        container.innerHTML = '';

        // Create a map to track keyword positions to avoid overlaps
        const positions = [];

        // Find all keyword matches
        keywordList.forEach(keyword => {
            const lowerText = text.toLowerCase();
            const lowerKeyword = keyword.toLowerCase();

            let startIndex = 0;
            while ((startIndex = lowerText.indexOf(lowerKeyword, startIndex)) !== -1) {
                const endIndex = startIndex + keyword.length;

                // Check if this position overlaps with existing positions
                // eslint-disable-next-line no-loop-func
                const overlaps = positions.some(pos =>
                    (startIndex >= pos.start && startIndex < pos.end) ||
                    (endIndex > pos.start && endIndex <= pos.end)
                );

                if (!overlaps) {
                    positions.push({start: startIndex, end: endIndex, keyword});
                }

                startIndex = endIndex;
            }
        });

        // Sort positions by start index
        positions.sort((a, b) => a.start - b.start);

        // Build the HTML with highlighted sections and selectable non-highlighted text
        let currentIndex = 0;
        positions.forEach(pos => {
            // Add text before highlight as selectable word spans
            if (currentIndex < pos.start) {
                const textBefore = text.substring(currentIndex, pos.start);
                const words = textBefore.split(/\s+/).filter(w => w.length > 0);
                const spaces = textBefore.match(/\s+/g) || [];

                let spaceIndex = 0;
                words.forEach((word, index) => {
                    if (index > 0 && spaceIndex < spaces.length) {
                        container.appendChild(document.createTextNode(spaces[spaceIndex]));
                        spaceIndex++;
                    } else if (index === 0 && textBefore.match(/^\s/)) {
                        container.appendChild(document.createTextNode(textBefore.match(/^\s+/)[0]));
                    }

                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word-selectable';
                    wordSpan.textContent = word;
                    wordSpan.addEventListener('mousedown', handleWordMouseDown);
                    container.appendChild(wordSpan);
                });

                // Add trailing spaces if any
                if (spaceIndex < spaces.length) {
                    container.appendChild(document.createTextNode(spaces.slice(spaceIndex).join('')));
                } else if (textBefore.match(/\s+$/)) {
                    container.appendChild(document.createTextNode(textBefore.match(/\s+$/)[0]));
                }
            }

            // Add highlighted span (green if in focus list, orange otherwise)
            const span = document.createElement('span');
            span.className = focusList.includes(pos.keyword) ? 'highlight-green' : 'highlight-orange';
            span.textContent = text.substring(pos.start, pos.end);
            span.dataset.keyword = pos.keyword;
            span.addEventListener('click', handleHighlightClick);
            container.appendChild(span);

            currentIndex = pos.end;
        });

        // Add remaining text as selectable word spans
        if (currentIndex < text.length) {
            const textAfter = text.substring(currentIndex);
            const words = textAfter.split(/\s+/).filter(w => w.length > 0);
            const spaces = textAfter.match(/\s+/g) || [];

            let spaceIndex = 0;
            words.forEach((word, index) => {
                if (index > 0 && spaceIndex < spaces.length) {
                    container.appendChild(document.createTextNode(spaces[spaceIndex]));
                    spaceIndex++;
                } else if (index === 0 && textAfter.match(/^\s/)) {
                    container.appendChild(document.createTextNode(textAfter.match(/^\s+/)[0]));
                }

                const wordSpan = document.createElement('span');
                wordSpan.className = 'word-selectable';
                wordSpan.textContent = word;
                wordSpan.addEventListener('mousedown', handleWordMouseDown);
                container.appendChild(wordSpan);
            });

            // Add trailing spaces if any
            if (spaceIndex < spaces.length) {
                container.appendChild(document.createTextNode(spaces.slice(spaceIndex).join('')));
            } else if (textAfter.match(/\s+$/)) {
                container.appendChild(document.createTextNode(textAfter.match(/\s+$/)[0]));
            }
        }

        // Update keyword counts
        updateKeywordCounts();
    };

    const handleHighlightClick = (e) => {
        const span = e.target;
        const currentClass = span.className;
        const keywordText = span.dataset.keyword;

        if (currentClass === 'highlight-orange') {
            // Change all instances to green
            const allHighlights = qualificationRef.current.querySelectorAll(`[data-keyword="${keywordText}"]`);
            allHighlights.forEach(highlight => {
                highlight.className = 'highlight-green';
            });
            updateKeywordType(keywordText, 'focus');
        } else if (currentClass === 'highlight-green') {
            // Remove all highlights for this keyword
            handleDeleteKeyword(keywordText);
        }
    };

    const handleWordMouseDown = (e) => {
        if (e.target.className !== 'word-selectable') return;

        e.preventDefault();
        const startSpan = e.target;
        const startTop = startSpan.getBoundingClientRect().top;
        const parent = startSpan.parentNode;

        // Get all word-selectable spans on the same line as start
        const allSpans = Array.from(parent.querySelectorAll('.word-selectable'));
        const sameLineSpans = allSpans.filter(span => {
            const spanTop = span.getBoundingClientRect().top;
            return Math.abs(spanTop - startTop) < 5; // Within 5px tolerance for same line
        });

        const startIndex = sameLineSpans.indexOf(startSpan);
        if (startIndex === -1) return;

        // Track currently highlighted spans
        let currentSelection = [startSpan];
        startSpan.classList.add('temp-highlight');

        const handleMouseMove = (moveEvent) => {
            const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);

            // Check if element is a word-selectable span on the same line
            if (!element || !sameLineSpans.includes(element)) return;

            // Check if we've hit an already-highlighted keyword - stop selection here
            if (element.classList.contains('highlight-orange') || element.classList.contains('highlight-green')) {
                return;
            }

            const currentIndex = sameLineSpans.indexOf(element);
            if (currentIndex === -1) return;

            // Determine range of spans to highlight
            const minIndex = Math.min(startIndex, currentIndex);
            const maxIndex = Math.max(startIndex, currentIndex);

            // Check if any span in the range is already highlighted - stop before it
            let actualMaxIndex = maxIndex;
            for (let i = minIndex; i <= maxIndex; i++) {
                if (sameLineSpans[i].classList.contains('highlight-orange') ||
                    sameLineSpans[i].classList.contains('highlight-green')) {
                    actualMaxIndex = i - 1;
                    break;
                }
            }

            // Clear all temp highlights
            currentSelection.forEach(span => span.classList.remove('temp-highlight'));

            // Add temp highlight to spans in range
            currentSelection = [];
            for (let i = minIndex; i <= actualMaxIndex; i++) {
                sameLineSpans[i].classList.add('temp-highlight');
                currentSelection.push(sameLineSpans[i]);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Remove temp highlight class
            currentSelection.forEach(span => span.classList.remove('temp-highlight'));

            // Only create keyword if we have a selection
            if (currentSelection.length > 0) {
                // Build the keyword text
                const keywordText = currentSelection.map(s => s.textContent).join(' ');

                // Create a single highlighted span
                const newSpan = document.createElement('span');
                newSpan.className = 'highlight-orange';
                newSpan.textContent = keywordText;
                newSpan.dataset.keyword = keywordText;
                newSpan.addEventListener('click', handleHighlightClick);

                // Insert before first span
                parent.insertBefore(newSpan, currentSelection[0]);

                // Remove selected word spans and spaces between them
                currentSelection.forEach((span, index) => {
                    if (index > 0) {
                        // Remove space before this span
                        const prev = span.previousSibling;
                        if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent.trim() === '') {
                            parent.removeChild(prev);
                        }
                    }
                    parent.removeChild(span);
                });

                // Add the keyword
                addKeyword(keywordText, 'keyword');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const addKeyword = (text, type = 'keyword') => {
        // Check if keyword already exists
        const existing = keywords.find(kw => kw.text.toLowerCase() === text.toLowerCase());
        if (!existing) {
            const newKeyword = {text, type, count: 0};
            setKeywords(prev => [...prev, newKeyword]);

            // Count occurrences in the qualification text
            setTimeout(() => updateKeywordCounts(), 50);
        }
    };

    const removeKeyword = (keywordText) => {
        setKeywords(prev => prev.filter(kw => kw.text !== keywordText));
    };

    const updateKeywordType = (keywordText, newType) => {
        setKeywords(prev => prev.map(kw =>
            kw.text === keywordText ? {...kw, type: newType} : kw
        ));
    };

    const handleDeleteKeyword = (keywordText) => {
        // Remove all highlights for this keyword
        if (qualificationRef.current) {
            const highlights = qualificationRef.current.querySelectorAll(`[data-keyword="${keywordText}"]`);
            highlights.forEach(span => {
                const text = span.textContent;
                const words = text.split(/\s+/);
                const parent = span.parentNode;

                // Replace with selectable words
                words.forEach((word, index) => {
                    if (index > 0) {
                        parent.insertBefore(document.createTextNode(' '), span);
                    }
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word-selectable';
                    wordSpan.textContent = word;
                    wordSpan.addEventListener('mousedown', handleWordMouseDown);
                    parent.insertBefore(wordSpan, span);
                });

                parent.removeChild(span);
            });
        }

        removeKeyword(keywordText);
    };

    const updateKeywordCounts = () => {
        if (!qualificationRef.current) return;

        setKeywords(prev => prev.map(kw => {
            const count = qualificationRef.current.querySelectorAll(`[data-keyword="${kw.text}"]`).length;
            return {...kw, count};
        }));
    };

    const handleCancel = () => {
        navigate(`/job-details/${id}`);
    };

    const handleFinalize = async () => {
        // Compile keyword lists
        const keywordFinal = keywords
            .filter(kw => kw.type === 'keyword')
            .map(kw => kw.text);

        const focusFinal = keywords
            .filter(kw => kw.type === 'focus')
            .map(kw => kw.text);

        if (keywordFinal.length === 0 && focusFinal.length === 0) {
            alert('Please select at least one keyword or focus area');
            return;
        }

        setIsProcessing(true);
        setLoadingMessage('Create resume for Job posting based on the selected baseline resume...');

        try {
            // Step 1: Create the resume record with baseline data
            const fullResponse = await apiService.resumeFull(id, resumeId, keywordFinal, focusFinal);
            const newResumeId = fullResponse.resume_id;

            setLoadingMessage('Running AI rewrite of resume (polling for completion)...');

            // Step 2: Initiate AI rewrite (returns immediately with process_id)
            const rewriteResponse = await apiService.request('/v1/resume/rewrite', {
                method: 'POST',
                body: JSON.stringify({ job_id: id }),
                timeout: 30000
            });

            // Step 3: Navigate immediately to OptimizedResume page with process_id
            // The OptimizedResume page will handle polling in a clean execution context

            navigate(`/optimized-resume/${newResumeId}`, {
                state: {
                    processId: rewriteResponse.process_id,
                    jobId: id,
                    isPolling: true  // Flag to tell OptimizedResume to poll
                }
            });
        } catch (error) {
            console.error('Error optimizing resume:', error);
            let errorMessage;
            if (error.isTimeout) {
                errorMessage = 'Request timed out. The AI optimization is taking longer than expected. Please try reloading the page in a moment - the optimization may have completed in the background.';
            } else {
                errorMessage = error.message || error.detail || 'Failed to optimize resume. Please try again.';
            }
            alert(errorMessage);
            setIsProcessing(false);
        }
    };

    if (loading) {
        return <div className="loading">{loadingMessage}</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    // Separate keywords by type
    const focusKeywords = keywords.filter(kw => kw.type === 'focus');
    const regularKeywords = keywords.filter(kw => kw.type === 'keyword');

    return (
        <div className="job-analysis">
            <h1 className="page-title">Job Description Analysis</h1>

            <div className="analysis-container">
                <div className="qualifications-section">
                    <h2 className="section-heading">Qualifications</h2>
                    <div
                        ref={qualificationRef}
                        className="qualifications-content"
                    >
                        {qualificationText}
                    </div>

                    <div className="button-container">
                        <button onClick={handleCancel} className="cancel-button" disabled={isProcessing}>
                            Cancel
                        </button>
                        <button onClick={handleFinalize} className="finalize-button" disabled={isProcessing}>
                            Finalize
                        </button>
                    </div>

                    {isProcessing && (
                        <div className="loading-container">
                            <div className="loading-message">{loadingMessage}</div>
                            <div className="loading-spinner"></div>
                        </div>
                    )}
                </div>

                <div className="keywords-section">
                    <h2 className="section-heading">Keywords</h2>
                    <div className="keywords-content">
                        {focusKeywords.length > 0 && (
                            <div className="focus-keywords-group">
                                {focusKeywords.map((kw, index) => (
                                    <div key={index} className="keyword-item">
                                        <span className="keyword-text">{kw.text} ({kw.count})</span>
                                        <button
                                            onClick={() => handleDeleteKeyword(kw.text)}
                                            className="delete-keyword-button"
                                            title="Delete keyword"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {focusKeywords.length > 0 && regularKeywords.length > 0 && (
                            <div className="keyword-separator"></div>
                        )}

                        {regularKeywords.map((kw, index) => (
                            <div key={index} className="keyword-item">
                                <span className="keyword-text">{kw.text} ({kw.count})</span>
                                <button
                                    onClick={() => handleDeleteKeyword(kw.text)}
                                    className="delete-keyword-button"
                                    title="Delete keyword"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobAnalysis;
