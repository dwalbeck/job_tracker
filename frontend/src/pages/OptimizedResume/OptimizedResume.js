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
    const [jobId, setJobId] = useState(null);
    const [editedRewrittenHtml, setEditedRewrittenHtml] = useState('');
    const [removedAdditions, setRemovedAdditions] = useState([]);
    const [restoredRemovals, setRestoredRemovals] = useState([]);
    const [fromViewResume, setFromViewResume] = useState(false);

    useEffect(() => {
        console.log('=== OptimizedResume: Received location.state ===');
        console.log('Has location.state:', !!location.state);
        if (location.state) {
            console.log('resumeHtml length:', (location.state.resumeHtml || '').length);
            console.log('resumeHtmlRewrite length:', (location.state.resumeHtmlRewrite || '').length);
            console.log('baselineScore:', location.state.baselineScore);
            console.log('rewriteScore:', location.state.rewriteScore);
            console.log('fromViewResume:', location.state.fromViewResume);

            setOriginalHtml(location.state.resumeHtml || '');
            setEditedRewrittenHtml(location.state.resumeHtmlRewrite || '');
            setBaselineScore(location.state.baselineScore || 0);
            setRewriteScore(location.state.rewriteScore || 0);
            setJobId(location.state.jobId || null);
            setFromViewResume(location.state.fromViewResume || false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedRewrittenHtml, originalHtml]);

    // Synchronized scrolling effect
    useEffect(() => {
        if (!baselineIframeRef.current || !rewriteIframeRef.current) return;
        if (!originalHtml || !editedRewrittenHtml) return;

        // Wait for iframes to fully load
        const setupSyncScroll = () => {
            try {
                const baselineDoc = baselineIframeRef.current?.contentDocument;
                const rewriteDoc = rewriteIframeRef.current?.contentDocument;

                if (!baselineDoc?.body || !rewriteDoc?.body) {
                    console.log('Documents not ready yet, retrying...');
                    setTimeout(setupSyncScroll, 100);
                    return;
                }

                console.log('Setting up synchronized scrolling...');

                // Extract anchor points (headings) from both documents
                const getAnchorPoints = (doc) => {
                    const anchors = [];
                    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

                    // Get all headings
                    headingTags.forEach(tag => {
                        const elements = doc.getElementsByTagName(tag);
                        for (let elem of elements) {
                            const text = elem.textContent.trim().toLowerCase();
                            const rect = elem.getBoundingClientRect();
                            const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;

                            anchors.push({
                                text: text,
                                offset: rect.top + scrollTop,
                                element: elem
                            });
                        }
                    });

                    // Sort by offset
                    anchors.sort((a, b) => a.offset - b.offset);

                    return anchors;
                };

                const baselineAnchors = getAnchorPoints(baselineDoc);
                const rewriteAnchors = getAnchorPoints(rewriteDoc);

                console.log('Baseline anchors found:', baselineAnchors.length);
                console.log('Rewrite anchors found:', rewriteAnchors.length);

                // Match anchors between documents
                const matchedAnchors = [];
                baselineAnchors.forEach(baseAnchor => {
                    // Find matching anchor in rewrite document
                    const match = rewriteAnchors.find(rewAnchor => {
                        // Match by text similarity
                        return rewAnchor.text === baseAnchor.text ||
                               rewAnchor.text.includes(baseAnchor.text) ||
                               baseAnchor.text.includes(rewAnchor.text);
                    });

                    if (match) {
                        matchedAnchors.push({
                            baseline: baseAnchor,
                            rewrite: match
                        });
                    }
                });

                console.log('Matched anchors:', matchedAnchors.length);

                // Calculate synchronized scroll position
                const getSyncedScrollPosition = (sourceScrollTop, sourceAnchors, targetAnchors, sourceMaxScroll, targetMaxScroll) => {
                    if (matchedAnchors.length === 0) {
                        // No anchors, use proportional scrolling
                        const ratio = sourceScrollTop / sourceMaxScroll;
                        return ratio * targetMaxScroll;
                    }

                    // Find which anchor section we're in
                    let anchorIndex = 0;
                    for (let i = 0; i < matchedAnchors.length; i++) {
                        if (sourceScrollTop >= sourceAnchors[i].offset) {
                            anchorIndex = i;
                        } else {
                            break;
                        }
                    }

                    // Calculate position within this section
                    if (anchorIndex < matchedAnchors.length - 1) {
                        // Between two anchors
                        const currentAnchor = sourceAnchors[anchorIndex];
                        const nextAnchor = sourceAnchors[anchorIndex + 1];
                        const sectionHeight = nextAnchor.offset - currentAnchor.offset;
                        const positionInSection = sourceScrollTop - currentAnchor.offset;
                        const ratio = sectionHeight > 0 ? positionInSection / sectionHeight : 0;

                        // Apply same ratio to target section
                        const targetCurrentAnchor = targetAnchors[anchorIndex];
                        const targetNextAnchor = targetAnchors[anchorIndex + 1];
                        const targetSectionHeight = targetNextAnchor.offset - targetCurrentAnchor.offset;

                        return targetCurrentAnchor.offset + (ratio * targetSectionHeight);
                    } else {
                        // After last anchor, use proportional scrolling
                        const lastSourceAnchor = sourceAnchors[anchorIndex];
                        const lastTargetAnchor = targetAnchors[anchorIndex];
                        const remainingSource = sourceMaxScroll - lastSourceAnchor.offset;
                        const remainingTarget = targetMaxScroll - lastTargetAnchor.offset;
                        const positionAfterAnchor = sourceScrollTop - lastSourceAnchor.offset;
                        const ratio = remainingSource > 0 ? positionAfterAnchor / remainingSource : 0;

                        return lastTargetAnchor.offset + (ratio * remainingTarget);
                    }
                };

                let isScrolling = false;

                // Baseline iframe scroll handler
                const handleBaselineScroll = () => {
                    if (isScrolling) return;

                    const scrollTop = baselineDoc.documentElement.scrollTop || baselineDoc.body.scrollTop;
                    const baselineMaxScroll = baselineDoc.documentElement.scrollHeight - baselineDoc.documentElement.clientHeight;
                    const rewriteMaxScroll = rewriteDoc.documentElement.scrollHeight - rewriteDoc.documentElement.clientHeight;

                    const baselineAnchorOffsets = matchedAnchors.map(a => a.baseline);
                    const rewriteAnchorOffsets = matchedAnchors.map(a => a.rewrite);

                    const syncedPosition = getSyncedScrollPosition(
                        scrollTop,
                        baselineAnchorOffsets,
                        rewriteAnchorOffsets,
                        baselineMaxScroll,
                        rewriteMaxScroll
                    );

                    isScrolling = true;
                    rewriteDoc.documentElement.scrollTop = syncedPosition;
                    rewriteDoc.body.scrollTop = syncedPosition;

                    setTimeout(() => { isScrolling = false; }, 50);
                };

                // Rewrite iframe scroll handler
                const handleRewriteScroll = () => {
                    if (isScrolling) return;

                    const scrollTop = rewriteDoc.documentElement.scrollTop || rewriteDoc.body.scrollTop;
                    const rewriteMaxScroll = rewriteDoc.documentElement.scrollHeight - rewriteDoc.documentElement.clientHeight;
                    const baselineMaxScroll = baselineDoc.documentElement.scrollHeight - baselineDoc.documentElement.clientHeight;

                    const baselineAnchorOffsets = matchedAnchors.map(a => a.baseline);
                    const rewriteAnchorOffsets = matchedAnchors.map(a => a.rewrite);

                    const syncedPosition = getSyncedScrollPosition(
                        scrollTop,
                        rewriteAnchorOffsets,
                        baselineAnchorOffsets,
                        rewriteMaxScroll,
                        baselineMaxScroll
                    );

                    isScrolling = true;
                    baselineDoc.documentElement.scrollTop = syncedPosition;
                    baselineDoc.body.scrollTop = syncedPosition;

                    setTimeout(() => { isScrolling = false; }, 50);
                };

                // Add scroll listeners
                baselineDoc.addEventListener('scroll', handleBaselineScroll);
                rewriteDoc.addEventListener('scroll', handleRewriteScroll);

                // Cleanup
                return () => {
                    baselineDoc.removeEventListener('scroll', handleBaselineScroll);
                    rewriteDoc.removeEventListener('scroll', handleRewriteScroll);
                };
            } catch (error) {
                console.error('Error setting up synchronized scrolling:', error);
            }
        };

        // Start setup after a short delay to ensure iframes are fully loaded
        const timeoutId = setTimeout(setupSyncScroll, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [originalHtml, editedRewrittenHtml]);

    const handleRemoveAddition = (text) => {
        console.log('Removing addition:', text);

        // Find the text in editedRewrittenHtml and remove it, replacing with original version
        const parser = new DOMParser();
        const doc = parser.parseFromString(editedRewrittenHtml, 'text/html');

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

    // Extract words from text, preserving original form and position
    const extractWords = (text) => {
        // Split by whitespace and punctuation, but keep everything
        return text.split(/(\s+)/).filter(part => part.trim().length > 0);
    };

    // Longest Common Subsequence algorithm for finding matching sequences
    const computeLCS = (arr1, arr2, compareFunc) => {
        const m = arr1.length;
        const n = arr2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        // Build LCS matrix
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (compareFunc(arr1[i - 1], arr2[j - 1])) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // Backtrack to find the actual LCS and positions
        const lcs = [];
        const positions1 = [];
        const positions2 = [];
        let i = m, j = n;

        while (i > 0 && j > 0) {
            if (compareFunc(arr1[i - 1], arr2[j - 1])) {
                lcs.unshift(arr1[i - 1]);
                positions1.unshift(i - 1);
                positions2.unshift(j - 1);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }

        return {lcs, positions1, positions2};
    };

    const findTextDifferences = (originalHtml, rewrittenHtml) => {
        // Extract text content from both HTML documents
        const originalText = extractTextContent(originalHtml);
        const rewrittenText = extractTextContent(rewrittenHtml);

        console.log('Original text length:', originalText.length);
        console.log('Rewritten text length:', rewrittenText.length);

        // Extract all words from both documents
        const originalWords = extractWords(originalText);
        const rewrittenWords = extractWords(rewrittenText);

        console.log('Original words:', originalWords.length);
        console.log('Rewritten words:', rewrittenWords.length);

        // Compare function - words match if normalized versions are equal
        const wordsMatch = (word1, word2) => {
            const norm1 = normalizeText(word1);
            const norm2 = normalizeText(word2);
            // Only match if both are substantial words (length > 2)
            if (norm1.length < 3 || norm2.length < 3) {
                // For short words, require exact match
                return word1.toLowerCase() === word2.toLowerCase();
            }
            return norm1 === norm2;
        };

        // Find longest common subsequence
        const {positions1, positions2} = computeLCS(originalWords, rewrittenWords, wordsMatch);

        console.log('LCS length:', positions1.length);

        // Create sets of matched positions for quick lookup
        const matchedInOriginal = new Set(positions1);
        const matchedInRewritten = new Set(positions2);

        // Find removals - words in original that aren't matched
        const removals = [];
        let currentRemovalPhrase = [];

        originalWords.forEach((word, index) => {
            if (!matchedInOriginal.has(index)) {
                // This word was removed
                currentRemovalPhrase.push(word);
            } else {
                // This word was kept - flush any accumulated removals
                if (currentRemovalPhrase.length > 0) {
                    const phrase = currentRemovalPhrase.join(' ').trim();
                    if (phrase.length > 0) {
                        removals.push(phrase);
                    }
                    currentRemovalPhrase = [];
                }
            }
        });

        // Don't forget the last phrase
        if (currentRemovalPhrase.length > 0) {
            const phrase = currentRemovalPhrase.join(' ').trim();
            if (phrase.length > 0) {
                removals.push(phrase);
            }
        }

        // Find additions - words in rewritten that aren't matched
        const additions = [];
        let currentAdditionPhrase = [];

        rewrittenWords.forEach((word, index) => {
            if (!matchedInRewritten.has(index)) {
                // This word was added
                currentAdditionPhrase.push(word);
            } else {
                // This word existed - flush any accumulated additions
                if (currentAdditionPhrase.length > 0) {
                    const phrase = currentAdditionPhrase.join(' ').trim();
                    if (phrase.length > 0) {
                        additions.push(phrase);
                    }
                    currentAdditionPhrase = [];
                }
            }
        });

        // Don't forget the last phrase
        if (currentAdditionPhrase.length > 0) {
            const phrase = currentAdditionPhrase.join(' ').trim();
            if (phrase.length > 0) {
                additions.push(phrase);
            }
        }

        console.log('Total additions found:', additions.length);
        console.log('Total removals found:', removals.length);
        console.log('Sample additions:', additions.slice(0, 10));
        console.log('Sample removals:', removals.slice(0, 10));

        return {additions, removals};
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

            // Remove duplicates and sort by length (longest first to prevent partial matches)
            const sortedAdditions = [...new Set(additions)]
                .filter(phrase => phrase && phrase.trim().length > 2)
                .sort((a, b) => b.length - a.length);

            let highlightCount = 0;
            const highlightedRanges = new Set(); // Track what we've already highlighted

            // Walk through all text nodes and highlight matching phrases
            const walkTextNodes = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    let replacements = [];

                    // Check each addition phrase
                    for (const phrase of sortedAdditions) {
                        // Create a case-insensitive regex to find the phrase
                        // Escape special regex characters
                        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(escapedPhrase, 'gi');

                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            const start = match.index;
                            const end = start + match[0].length;
                            const rangeKey = `${start}-${end}`;

                            // Check if this range overlaps with existing highlights
                            let overlaps = false;
                            for (const existing of highlightedRanges) {
                                const [existStart, existEnd] = existing.split('-').map(Number);
                                if ((start >= existStart && start < existEnd) ||
                                    (end > existStart && end <= existEnd) ||
                                    (start <= existStart && end >= existEnd)) {
                                    overlaps = true;
                                    break;
                                }
                            }

                            if (!overlaps) {
                                replacements.push({
                                    start: start,
                                    end: end,
                                    text: match[0]
                                });
                                highlightedRanges.add(rangeKey);
                            }
                        }
                    }

                    if (replacements.length > 0) {
                        // Sort by start position
                        replacements.sort((a, b) => a.start - b.start);

                        // Build the new content with highlights
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;

                        replacements.forEach(replacement => {
                            // Add text before the match
                            if (replacement.start > lastIndex) {
                                fragment.appendChild(
                                    document.createTextNode(text.substring(lastIndex, replacement.start))
                                );
                            }

                            // Add highlighted match
                            const highlightSpan = document.createElement('span');
                            highlightSpan.className = 'change-highlight-add';
                            highlightSpan.textContent = replacement.text;
                            fragment.appendChild(highlightSpan);
                            highlightCount++;

                            lastIndex = replacement.end;
                        });

                        // Add remaining text
                        if (lastIndex < text.length) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                        }

                        node.parentNode.replaceChild(fragment, node);
                        return true; // Indicate we modified this node
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Don't highlight inside script or style tags
                    if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                        // Process children in reverse to avoid issues with DOM modification
                        const children = Array.from(node.childNodes);
                        children.forEach(child => walkTextNodes(child));
                    }
                }
                return false;
            };

            walkTextNodes(doc.body);
            console.log('Total addition highlights applied:', highlightCount);
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

            // Remove duplicates and sort by length (longest first to prevent partial matches)
            const sortedRemovals = [...new Set(removals)]
                .filter(phrase => phrase && phrase.trim().length > 2)
                .sort((a, b) => b.length - a.length);

            let highlightCount = 0;
            const highlightedRanges = new Set(); // Track what we've already highlighted

            // Walk through all text nodes and highlight matching phrases
            const walkTextNodes = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    let replacements = [];

                    // Check each removal phrase
                    for (const phrase of sortedRemovals) {
                        // Create a case-insensitive regex to find the phrase
                        // Escape special regex characters
                        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(escapedPhrase, 'gi');

                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            const start = match.index;
                            const end = start + match[0].length;
                            const rangeKey = `${start}-${end}`;

                            // Check if this range overlaps with existing highlights
                            let overlaps = false;
                            for (const existing of highlightedRanges) {
                                const [existStart, existEnd] = existing.split('-').map(Number);
                                if ((start >= existStart && start < existEnd) ||
                                    (end > existStart && end <= existEnd) ||
                                    (start <= existStart && end >= existEnd)) {
                                    overlaps = true;
                                    break;
                                }
                            }

                            if (!overlaps) {
                                replacements.push({
                                    start: start,
                                    end: end,
                                    text: match[0]
                                });
                                highlightedRanges.add(rangeKey);
                            }
                        }
                    }

                    if (replacements.length > 0) {
                        // Sort by start position
                        replacements.sort((a, b) => a.start - b.start);

                        // Build the new content with highlights
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;

                        replacements.forEach(replacement => {
                            // Add text before the match
                            if (replacement.start > lastIndex) {
                                fragment.appendChild(
                                    document.createTextNode(text.substring(lastIndex, replacement.start))
                                );
                            }

                            // Add highlighted match
                            const highlightSpan = document.createElement('span');
                            highlightSpan.className = 'change-highlight-remove';
                            highlightSpan.textContent = replacement.text;
                            fragment.appendChild(highlightSpan);
                            highlightCount++;

                            lastIndex = replacement.end;
                        });

                        // Add remaining text
                        if (lastIndex < text.length) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                        }

                        node.parentNode.replaceChild(fragment, node);
                        return true; // Indicate we modified this node
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Don't highlight inside script or style tags
                    if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                        // Process children in reverse to avoid issues with DOM modification
                        const children = Array.from(node.childNodes);
                        children.forEach(child => walkTextNodes(child));
                    }
                }
                return false;
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
        if (fromViewResume) {
            // Return to ViewResume page
            navigate(`/view-resume?resume_id=${resumeId}&job_id=${jobId || ''}`);
        } else if (jobId) {
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
            if (fromViewResume) {
                // Return to ViewResume page
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
