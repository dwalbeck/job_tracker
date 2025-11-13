import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import apiService from '../../services/api';
import './OptimizedResume.css';

const OptimizedResume = () => {
    const {id: resumeId} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const baselineIframeRef = useRef(null);
    const rewriteIframeRef = useRef(null);

    const [baselineScore, setBaselineScore] = useState(0);
    const [rewriteScore, setRewriteScore] = useState(0);
    const [originalHtml, setOriginalHtml] = useState('');
    const [rewrittenHtml, setRewrittenHtml] = useState('');
    const [textChanges, setTextChanges] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [editedRewrittenHtml, setEditedRewrittenHtml] = useState('');
    const [removedAdditions, setRemovedAdditions] = useState([]);
    const [restoredRemovals, setRestoredRemovals] = useState([]);

    useEffect(() => {
        console.log('=== OptimizedResume: Received location.state ===');
        console.log('Has location.state:', !!location.state);
        if (location.state) {
            console.log('resumeHtml length:', (location.state.resumeHtml || '').length);
            console.log('resumeHtmlRewrite length:', (location.state.resumeHtmlRewrite || '').length);
            console.log('baselineScore:', location.state.baselineScore);
            console.log('rewriteScore:', location.state.rewriteScore);

            setOriginalHtml(location.state.resumeHtml || '');
            setRewrittenHtml(location.state.resumeHtmlRewrite || '');
            setEditedRewrittenHtml(location.state.resumeHtmlRewrite || '');
            setBaselineScore(location.state.baselineScore || 0);
            setRewriteScore(location.state.rewriteScore || 0);
            setTextChanges(location.state.textChanges || []);
            setJobId(location.state.jobId || null);
        } else {
            console.log('No location.state received!');
        }
    }, [location.state]);

    useEffect(() => {
        console.log('=== OptimizedResume: Loading iframes ===');
        console.log('originalHtml length:', originalHtml.length);
        console.log('editedRewrittenHtml length:', editedRewrittenHtml.length);
        console.log('Has baselineIframeRef:', !!baselineIframeRef.current);
        console.log('Has rewriteIframeRef:', !!rewriteIframeRef.current);

        // Load HTML content into iframes after state is set
        if (originalHtml && editedRewrittenHtml && baselineIframeRef.current) {
            console.log('Loading baseline iframe with removal highlighting...');
            const iframeDoc = baselineIframeRef.current.contentDocument;
            iframeDoc.open();
            iframeDoc.write(highlightRemovals(originalHtml, editedRewrittenHtml));
            iframeDoc.close();
        }

        if (editedRewrittenHtml && rewriteIframeRef.current) {
            console.log('Loading rewrite iframe with addition highlighting...');
            const iframeDoc = rewriteIframeRef.current.contentDocument;
            iframeDoc.open();
            iframeDoc.write(highlightAdditions(originalHtml, editedRewrittenHtml));
            iframeDoc.close();
        }
    }, [originalHtml, editedRewrittenHtml, removedAdditions, restoredRemovals]);

    useEffect(() => {
        // Listen for messages from iframes
        const handleMessage = (event) => {
            if (event.data.type === 'removeAddition') {
                handleRemoveAddition(event.data.text);
            } else if (event.data.type === 'restoreRemoval') {
                handleRestoreRemoval(event.data.text);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [editedRewrittenHtml, originalHtml]);

    const handleRemoveAddition = (text) => {
        console.log('Removing addition:', text);

        // Find the text in editedRewrittenHtml and remove it, replacing with original version
        const parser = new DOMParser();
        const doc = parser.parseFromString(editedRewrittenHtml, 'text/html');
        const originalDoc = parser.parseFromString(originalHtml, 'text/html');

        // Get text content from both
        const editedText = extractTextContent(editedRewrittenHtml);
        const originalText = extractTextContent(originalHtml);

        // Simple approach: replace the addition text with empty string or find corresponding original text
        const normalizedRemovalText = normalizeText(text);

        // Remove the text from the edited HTML by finding and removing spans with that text
        const removeTextFromNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeText = node.textContent;
                const normalizedNodeText = normalizeText(nodeText);

                if (normalizedNodeText.includes(normalizedRemovalText)) {
                    // Remove this text
                    const newText = nodeText.replace(new RegExp(text, 'gi'), '');
                    if (newText.trim().length === 0) {
                        // Remove the entire text node
                        node.parentNode.removeChild(node);
                    } else {
                        node.textContent = newText;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(removeTextFromNode);
            }
        };

        removeTextFromNode(doc.body);

        const newHtml = doc.documentElement.outerHTML;
        setEditedRewrittenHtml(newHtml);
        setRemovedAdditions(prev => [...prev, text]);
    };

    const handleRestoreRemoval = (text) => {
        console.log('Restoring removal:', text);

        // Find where this text was removed and add it back to editedRewrittenHtml
        // This is complex - we need to find the position in the original and insert it into the edited version
        // For now, we'll track that this removal should be restored
        setRestoredRemovals(prev => [...prev, text]);

        // Find the text in original HTML and insert it into edited HTML
        // This is a simplified approach - just append it for now
        // A more sophisticated approach would find the exact location
        const parser = new DOMParser();
        const doc = parser.parseFromString(editedRewrittenHtml, 'text/html');

        // Find a suitable place to insert - for now just add to end of body
        const textNode = document.createTextNode(' ' + text);
        doc.body.appendChild(textNode);

        const newHtml = doc.documentElement.outerHTML;
        setEditedRewrittenHtml(newHtml);
    };

    const extractTextContent = (html) => {
        // Create a temporary div to parse HTML and extract text
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';

        // Normalize whitespace: replace all whitespace (including newlines) with single spaces
        return text.replace(/\s+/g, ' ').trim();
    };

    const stripMarkdown = (text) => {
        // Remove common markdown syntax
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold: **text** -> text
            .replace(/\*([^*]+)\*/g, '$1')      // Italic: *text* -> text
            .replace(/__([^_]+)__/g, '$1')      // Bold: __text__ -> text
            .replace(/_([^_]+)_/g, '$1')        // Italic: _text_ -> text
            .replace(/~~([^~]+)~~/g, '$1')      // Strikethrough: ~~text~~ -> text
            .replace(/`([^`]+)`/g, '$1')        // Inline code: `text` -> text
            .replace(/>\s*/g, '')               // Blockquote: > text -> text
            .replace(/[-*+]\s+/g, '')           // List markers: - text -> text
            .replace(/\d+\.\s+/g, '')           // Numbered lists: 1. text -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links: [text](url) -> text
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images: ![alt](url) -> alt
            .replace(/#{1,6}\s+/g, '');         // Headers: # text -> text
    };

    const normalizeText = (text) => {
        // Strip markdown first, then normalize text for comparison: lowercase, collapse whitespace
        const withoutMarkdown = stripMarkdown(text);
        return withoutMarkdown.toLowerCase().replace(/\s+/g, ' ').trim();
    };

    const splitIntoSentences = (text) => {
        // Split text into sentences and clean them
        return text
            .split(/[.!?]+/)
            .map(s => normalizeText(s))
            .filter(s => s.length > 20); // Filter out very short fragments
    };

    const findTextDifferences = (originalHtml, rewrittenHtml) => {
        // Extract and normalize text content from both HTML documents
        const originalText = extractTextContent(originalHtml);
        const rewrittenText = extractTextContent(rewrittenHtml);

        console.log('Original text length:', originalText.length);
        console.log('Rewritten text length:', rewrittenText.length);

        // Normalize for comparison
        const originalNormalized = normalizeText(originalText);
        const rewrittenNormalized = normalizeText(rewrittenText);

        // Split into sentences for better comparison
        const originalSentences = splitIntoSentences(originalText);
        const rewrittenSentences = splitIntoSentences(rewrittenText);

        console.log('Original sentences:', originalSentences.length);
        console.log('Rewritten sentences:', rewrittenSentences.length);

        // Find phrases/sentences that appear in rewritten but not in original
        const additions = [];
        const removals = [];

        // Find additions - sentences in rewritten that don't exist in original
        rewrittenSentences.forEach(sentence => {
            // Check if this sentence exists in original
            const existsInOriginal = originalSentences.some(orig => {
                // Use similarity check - sentences are similar if one contains most of the other
                const similarity = calculateSimilarity(orig, sentence);
                return similarity > 0.8; // 80% similar
            });

            if (!existsInOriginal) {
                // This is a genuinely new sentence
                // Split into phrases for more granular highlighting
                const phrases = sentence.split(/[,;]+/).map(p => p.trim()).filter(p => p.length > 15);
                phrases.forEach(phrase => {
                    // Check if phrase exists in original (normalized)
                    if (!originalNormalized.includes(phrase)) {
                        additions.push(phrase);
                    }
                });
            }
        });

        // Find removals - sentences in original that don't exist in rewritten
        originalSentences.forEach(sentence => {
            const existsInRewritten = rewrittenSentences.some(rew => {
                const similarity = calculateSimilarity(rew, sentence);
                return similarity > 0.8;
            });

            if (!existsInRewritten) {
                removals.push(sentence);
            }
        });

        console.log('Total additions found:', additions.length);
        console.log('Total removals found:', removals.length);
        console.log('Sample additions:', additions.slice(0, 5));
        console.log('Sample removals:', removals.slice(0, 5));

        return {additions, removals};
    };

    const calculateSimilarity = (text1, text2) => {
        // Calculate word-based similarity between two texts
        const words1 = text1.split(' ').filter(w => w.length > 3);
        const words2 = text2.split(' ').filter(w => w.length > 3);

        if (words1.length === 0 || words2.length === 0) return 0;

        // Count matching words
        const matches = words1.filter(w => words2.includes(w)).length;
        const maxLength = Math.max(words1.length, words2.length);

        return matches / maxLength;
    };

    const highlightAdditions = (originalHtml, rewrittenHtml) => {
        if (!originalHtml || !rewrittenHtml) {
            console.log('Missing HTML content for diff');
            return rewrittenHtml;
        }

        // Find differences between original and rewritten
        const {additions} = findTextDifferences(originalHtml, rewrittenHtml);

        console.log('Found additions to highlight:', additions.length);

        // Create a temporary DOM to manipulate
        const parser = new DOMParser();
        const doc = parser.parseFromString(rewrittenHtml, 'text/html');

        // Add style for highlighting
        const styleTag = doc.createElement('style');
        styleTag.textContent = `
      .change-highlight-add {
        background-color: #90EE90 !important;
        padding: 2px 4px;
        border-radius: 2px;
        cursor: pointer;
      }
      .change-highlight-add:hover {
        background-color: #7FDD7F !important;
      }
    `;
        if (doc.head) {
            doc.head.appendChild(styleTag);
        } else {
            doc.body.insertBefore(styleTag, doc.body.firstChild);
        }

        if (additions && additions.length > 0) {
            console.log('Applying highlighting for', additions.length, 'additions');

            // Remove duplicates and sort by length (longest first)
            const sortedAdditions = [...new Set(additions)]
                .filter(phrase => phrase && phrase.trim().length > 10)
                .sort((a, b) => b.length - a.length);

            let highlightCount = 0;

            // Walk through all text nodes and highlight matching phrases
            const walkTextNodes = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const normalizedText = normalizeText(text);

                    // Check each addition phrase
                    for (const phrase of sortedAdditions) {
                        if (normalizedText.includes(phrase)) {
                            // Found a match - need to highlight it
                            // Create a case-insensitive search for the original text
                            const words = phrase.split(' ').filter(w => w.length > 3);
                            if (words.length === 0) continue;

                            // Build regex to find the phrase in original casing
                            const pattern = words.map(w => {
                                // Escape special chars and match word boundaries
                                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                return `\\b${escaped}\\w*`;
                            }).join('\\s+');

                            const regex = new RegExp(`(${pattern})`, 'gi');
                            const match = text.match(regex);

                            if (match) {
                                // Replace text node with highlighted version
                                const span = document.createElement('span');
                                span.className = 'change-highlight-add';

                                // Split the text and wrap matched portion
                                const parts = text.split(regex);
                                const fragment = document.createDocumentFragment();

                                parts.forEach((part, index) => {
                                    if (index % 2 === 0) {
                                        // Regular text
                                        if (part) fragment.appendChild(document.createTextNode(part));
                                    } else {
                                        // Matched text - highlight it
                                        const highlightSpan = document.createElement('span');
                                        highlightSpan.className = 'change-highlight-add';
                                        highlightSpan.textContent = part;
                                        fragment.appendChild(highlightSpan);
                                        highlightCount++;
                                    }
                                });

                                node.parentNode.replaceChild(fragment, node);
                                break; // Move to next text node
                            }
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Don't highlight inside script or style tags
                    if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                        Array.from(node.childNodes).forEach(walkTextNodes);
                    }
                }
            };

            walkTextNodes(doc.body);
            console.log('Total highlights applied:', highlightCount);
        } else {
            console.log('No additions found to highlight');
        }

        // Add click handler script for additions
        const scriptTag = doc.createElement('script');
        scriptTag.textContent = `
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('change-highlight-add')) {
          const text = e.target.textContent;
          window.parent.postMessage({ type: 'removeAddition', text: text }, '*');
        }
      });
    `;
        doc.body.appendChild(scriptTag);

        return doc.documentElement.outerHTML;
    };

    const highlightRemovals = (originalHtml, rewrittenHtml) => {
        if (!originalHtml || !rewrittenHtml) {
            console.log('Missing HTML content for diff');
            return originalHtml;
        }

        // Find differences between original and rewritten
        const {removals} = findTextDifferences(originalHtml, rewrittenHtml);

        console.log('Found removals to highlight:', removals.length);

        // Create a temporary DOM to manipulate
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');

        // Add style for highlighting removals
        const styleTag = doc.createElement('style');
        styleTag.textContent = `
      .change-highlight-remove {
        background-color: #FFB84D !important;
        padding: 2px 4px;
        border-radius: 2px;
        cursor: pointer;
      }
      .change-highlight-remove:hover {
        background-color: #FFA733 !important;
      }
    `;
        if (doc.head) {
            doc.head.appendChild(styleTag);
        } else {
            doc.body.insertBefore(styleTag, doc.body.firstChild);
        }

        if (removals && removals.length > 0) {
            console.log('Applying highlighting for', removals.length, 'removals');

            // Remove duplicates and sort by length (longest first)
            const sortedRemovals = [...new Set(removals)]
                .filter(phrase => phrase && phrase.trim().length > 10)
                .sort((a, b) => b.length - a.length);

            let highlightCount = 0;

            // Walk through all text nodes and highlight matching phrases
            const walkTextNodes = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const normalizedText = normalizeText(text);

                    // Check each removal phrase
                    for (const phrase of sortedRemovals) {
                        if (normalizedText.includes(phrase)) {
                            // Found a match - need to highlight it
                            // Create a case-insensitive search for the original text
                            const words = phrase.split(' ').filter(w => w.length > 3);
                            if (words.length === 0) continue;

                            // Build regex to find the phrase in original casing
                            const pattern = words.map(w => {
                                // Escape special chars and match word boundaries
                                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                return `\\b${escaped}\\w*`;
                            }).join('\\s+');

                            const regex = new RegExp(`(${pattern})`, 'gi');
                            const match = text.match(regex);

                            if (match) {
                                // Replace text node with highlighted version
                                const parts = text.split(regex);
                                const fragment = document.createDocumentFragment();

                                parts.forEach((part, index) => {
                                    if (index % 2 === 0) {
                                        // Regular text
                                        if (part) fragment.appendChild(document.createTextNode(part));
                                    } else {
                                        // Matched text - highlight it
                                        const highlightSpan = document.createElement('span');
                                        highlightSpan.className = 'change-highlight-remove';
                                        highlightSpan.textContent = part;
                                        fragment.appendChild(highlightSpan);
                                        highlightCount++;
                                    }
                                });

                                node.parentNode.replaceChild(fragment, node);
                                break; // Move to next text node
                            }
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Don't highlight inside script or style tags
                    if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                        Array.from(node.childNodes).forEach(walkTextNodes);
                    }
                }
            };

            walkTextNodes(doc.body);
            console.log('Total removal highlights applied:', highlightCount);
        } else {
            console.log('No removals found to highlight');
        }

        // Add click handler script for removals
        const scriptTag = doc.createElement('script');
        scriptTag.textContent = `
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('change-highlight-remove')) {
          const text = e.target.textContent;
          window.parent.postMessage({ type: 'restoreRemoval', text: text }, '*');
        }
      });
    `;
        doc.body.appendChild(scriptTag);

        return doc.documentElement.outerHTML;
    };

    const handleCancel = () => {
        if (jobId) {
            navigate(`/job-details/${jobId}`);
        } else {
            navigate('/job-tracker');
        }
    };

    const handleAcceptChanges = async () => {
        try {
            // Use the edited rewritten HTML (with user's modifications)
            await apiService.updateResumeDetail({
                resume_id: parseInt(resumeId),
                resume_html_rewrite: editedRewrittenHtml
            });

            // Redirect without alert
            if (jobId) {
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
                <h1 className="page-title">Optimized Resume</h1>
                <div className="score-display">
                    <div className="score-item">
                        <span className="score-label">baseline:</span>
                        <span className="score-value">{baselineScore}%</span>
                    </div>
                    <div className="score-item">
                        <span className="score-label">rewrite:</span>
                        <span className="score-value">{rewriteScore}%</span>
                    </div>
                </div>
            </div>

            <div className="resume-comparison">
                <div className="resume-section">
                    <h2 className="section-title">Baseline Resume</h2>
                    <div className="iframe-container">
                        <iframe
                            ref={baselineIframeRef}
                            title="Baseline Resume"
                            className="resume-iframe"
                        />
                    </div>
                </div>

                <div className="resume-section">
                    <h2 className="section-title">Optimized Resume (Changes Highlighted)</h2>
                    <div className="iframe-container">
                        <iframe
                            ref={rewriteIframeRef}
                            title="Optimized Resume"
                            className="resume-iframe"
                        />
                    </div>
                </div>
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
