import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import './JobAnalysis.css';

const JobAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = useState(searchParams.get('resume_id'));

  const [qualificationText, setQualificationText] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selection, setSelection] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const qualificationRef = useRef(null);

  useEffect(() => {
    fetchJobData();
  }, [id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);

      console.log('JobAnalysis: job_id =', id, ', resume_id =', resumeId);

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
      setError('Failed to load job description');
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
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      let match;
      const lowerText = text.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();

      let startIndex = 0;
      while ((startIndex = lowerText.indexOf(lowerKeyword, startIndex)) !== -1) {
        const endIndex = startIndex + keyword.length;

        // Check if this position overlaps with existing positions
        const overlaps = positions.some(pos =>
          (startIndex >= pos.start && startIndex < pos.end) ||
          (endIndex > pos.start && endIndex <= pos.end)
        );

        if (!overlaps) {
          positions.push({ start: startIndex, end: endIndex, keyword });
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

  const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const selection = { start: startSpan, spans: [startSpan], text: startSpan.textContent };

    // Highlight first word
    startSpan.className = 'highlight-orange temp';

    const handleMouseMove = (moveEvent) => {
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      if (element && element.className === 'word-selectable' && !selection.spans.includes(element)) {
        // Determine if we're moving forward or backward
        const parent = startSpan.parentNode;
        const allSpans = Array.from(parent.querySelectorAll('.word-selectable'));
        const startIndex = allSpans.indexOf(startSpan);
        const currentIndex = allSpans.indexOf(element);

        if (currentIndex !== -1) {
          // Clear previous temp selections
          selection.spans.forEach(s => {
            if (s !== startSpan) s.className = 'word-selectable';
          });
          selection.spans = [startSpan];
          selection.text = startSpan.textContent;

          // Add new spans
          if (currentIndex > startIndex) {
            for (let i = startIndex + 1; i <= currentIndex; i++) {
              allSpans[i].className = 'highlight-orange temp';
              selection.spans.push(allSpans[i]);
              selection.text += ' ' + allSpans[i].textContent;
            }
          } else if (currentIndex < startIndex) {
            for (let i = currentIndex; i < startIndex; i++) {
              allSpans[i].className = 'highlight-orange temp';
              selection.spans.unshift(allSpans[i]);
            }
            selection.text = selection.spans.map(s => s.textContent).join(' ');
          }
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Finalize selection
      if (selection.spans.length > 0) {
        const parent = selection.spans[0].parentNode;

        // Create a single highlighted span
        const newSpan = document.createElement('span');
        newSpan.className = 'highlight-orange';
        newSpan.textContent = selection.text;
        newSpan.dataset.keyword = selection.text;
        newSpan.addEventListener('click', handleHighlightClick);

        // Insert before first span
        parent.insertBefore(newSpan, selection.spans[0]);

        // Remove all selected word spans (and spaces between them)
        selection.spans.forEach((span, index) => {
          if (index > 0) {
            // Remove space before this span
            const prev = span.previousSibling;
            if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent === ' ') {
              parent.removeChild(prev);
            }
          }
          parent.removeChild(span);
        });

        // Add the keyword
        addKeyword(selection.text, 'keyword');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const addKeyword = (text, type = 'keyword') => {
    // Check if keyword already exists
    const existing = keywords.find(kw => kw.text.toLowerCase() === text.toLowerCase());
    if (!existing) {
      const newKeyword = { text, type, count: 0 };
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
      kw.text === keywordText ? { ...kw, type: newType } : kw
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
      return { ...kw, count };
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

    try {
      const response = await apiService.rewriteResume(id, resumeId, keywordFinal, focusFinal);

      // Navigate to the optimized resume page
      navigate(`/optimized-resume/${response.resume_id}`, {
        state: {
          resumeHtml: response.resume_html,
          resumeHtmlRewrite: response.resume_html_rewrite,
          suggestion: response.suggestion,
          baselineScore: response.baseline_score,
          rewriteScore: response.rewrite_score,
          textChanges: response.text_changes,
          jobId: id
        }
      });
    } catch (error) {
      console.error('Error rewriting resume:', error);
      const errorMessage = error.message || error.detail || 'Failed to optimize resume. Please try again.';
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading job description...</div>;
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
              <div className="loading-message">Examining and Re-writing Resume</div>
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
