const fs = require('node:fs/promises');



/*const getFile = (filename) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            console.log('Error reading file:', err)
            return
        }
        const fileContent = data
        return fileContent
    })
}
 */

async function getFile(filename) {
    try {
        const data = await fs.readFile(filename, { encoding: 'utf8' });
        return data;
    } catch (err) {
        console.error(err);
    }
}


const extractTextContent = (text) => {

    // Normalize whitespace: replace all whitespace (including newlines) with single spaces
    return text.replace(/\s+/g, ' ').trim();
};
const normalizeText = (text) => {
    // Strip markdown first, then normalize text for comparison: lowercase, collapse whitespace
    const withoutMarkdown = stripMarkdown(text);
    return withoutMarkdown.toLowerCase().replace(/\s+/g, ' ').trim();
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

// Split text into sentences with words
const splitIntoSentences = (text) => {
    return text
        .split(/([.!?]+\s+)/)
        .reduce((acc, part, index, array) => {
            if (index % 2 === 0 && part.trim()) {
                const punctuation = array[index + 1] || '';
                const fullSentence = part + punctuation;
                const words = part.split(/\s+/).filter(w => w.trim().length > 0);
                acc.push({
                    text: fullSentence,
                    normalized: normalizeText(part),
                    words: words,
                    normalizedWords: words.map(w => normalizeText(w))
                });
            }
            return acc;
        }, []);
};

const findTextDifferences = (originalHtml, rewrittenHtml) => {
    const originalText = extractTextContent(originalHtml);
    const rewrittenText = extractTextContent(rewrittenHtml);

    console.log('Original text length:', originalText.length);
    console.log('Rewritten text length:', rewrittenText.length);

    const originalSentences = splitIntoSentences(originalText);
    const rewrittenSentences = splitIntoSentences(rewrittenText);

    console.log('Original sentences:', originalSentences.length);
    console.log('Rewritten sentences:', rewrittenSentences.length);

    // Track which words have been matched (sentence index, word index)
    const matchedInOriginal = new Set();
    const matchedInRewritten = new Set();

    const removals = [];
    const additions = [];

    // === PASS 1: Find REMOVALS (Original → Rewritten) ===
    let rewrittenSentenceIndex = 0;

    console.log('cycling through original sentences')
    for (let origIdx = 0; origIdx < originalSentences.length; origIdx++) {
        const origSentence = originalSentences[origIdx];

        // Try to find matching sentence
        let sentenceMatched = false;
        console.log('rewritten index:', rewrittenSentenceIndex, rewrittenSentences.length)
        if (rewrittenSentenceIndex < rewrittenSentences.length) {
            const rewSentence = rewrittenSentences[rewrittenSentenceIndex];
            if (origSentence.normalized === rewSentence.normalized) {
                // Exact sentence match - mark all words as matched
                console.log('exact sentence matched!')
                for (let i = 0; i < origSentence.words.length; i++) {
                    matchedInOriginal.add(`${origIdx}:${i}`);
                }
                for (let i = 0; i < rewSentence.words.length; i++) {
                    matchedInRewritten.add(`${rewrittenSentenceIndex}:${i}`);
                }
                rewrittenSentenceIndex++;
                sentenceMatched = true;
            }
        }

        if (!sentenceMatched) {
            console.log('non-matching sentences - using words')
            // Sentence doesn't match - break down into words
            const origWords = origSentence.words;
            const origNormWords = origSentence.normalizedWords;

            for (let wordIdx = 0; wordIdx < origWords.length; wordIdx++) {
                const wordKey = `${origIdx}:${wordIdx}`;
                if (matchedInOriginal.has(wordKey)) continue;

                const normWord = origNormWords[wordIdx];
                console.log("Checking word: ", normWord, 'wordkey:', wordKey);

                // Search in current and next 2 rewritten sentences
                let matchFound = false;
                const searchEnd = Math.min(rewrittenSentences.length, rewrittenSentenceIndex + 3);

                console.log('cycling through rewritten sentences', rewrittenSentenceIndex, '-', searchEnd);
                for (let rewIdx = rewrittenSentenceIndex; rewIdx < searchEnd && !matchFound; rewIdx++) {
                    const rewSentence = rewrittenSentences[rewIdx];

                    console.log('cycling through words')
                    for (let rewWordIdx = 0; rewWordIdx < rewSentence.words.length; rewWordIdx++) {
                        const rewWordKey = `${rewIdx}:${rewWordIdx}`;
                        if (matchedInRewritten.has(rewWordKey)) continue;

                        console.log('rewritten word:', rewSentence.normalizedWords[rewWordIdx], 'wordKey:', rewWordKey);
                        if (normWord === rewSentence.normalizedWords[rewWordIdx]) {
                            console.log('MATCH FOUND');
                            // Found a match! Now try to match consecutive words
                            matchedInOriginal.add(wordKey);
                            matchedInRewritten.add(rewWordKey);
                            matchFound = true;

                            let origNextIdx = wordIdx + 1;
                            let rewNextIdx = rewWordIdx + 1;

                            console.log('extending word match', origNextIdx, rewNextIdx);
                            while (origNextIdx < origWords.length && rewNextIdx < rewSentence.words.length) {
                                const origNextKey = `${origIdx}:${origNextIdx}`;
                                const rewNextKey = `${rewIdx}:${rewNextIdx}`;

                                console.log('comparing:', origNormWords[origNextIdx], rewSentence.normalizedWords[rewNextIdx])
                                if (matchedInOriginal.has(origNextKey) || matchedInRewritten.has(rewNextKey)) {
                                    console.log('already in matched array');
                                    break;
                                }

                                if (origNormWords[origNextIdx] === rewSentence.normalizedWords[rewNextIdx]) {
                                    console.log('matched', origNormWords[origNextIdx], 'to', rewSentence.normalizedWords[rewNextIdx])
                                    matchedInOriginal.add(origNextKey);
                                    matchedInRewritten.add(rewNextKey);
                                    origNextIdx++;
                                    rewNextIdx++;
                                } else {
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    // Collect removals - words in original that weren't matched
    for (let origIdx = 0; origIdx < originalSentences.length; origIdx++) {
        const origSentence = originalSentences[origIdx];
        let removalPhrase = [];

        for (let wordIdx = 0; wordIdx < origSentence.words.length; wordIdx++) {
            const wordKey = `${origIdx}:${wordIdx}`;
            if (!matchedInOriginal.has(wordKey)) {
                removalPhrase.push(origSentence.words[wordIdx]);
            } else {
                if (removalPhrase.length > 0) {
                    removals.push(removalPhrase.join(' ').trim());
                    removalPhrase = [];
                }
            }
        }

        if (removalPhrase.length > 0) {
            removals.push(removalPhrase.join(' ').trim());
        }
    }

    // === PASS 2: Find ADDITIONS (Rewritten → Original) ===
    let originalSentenceIndex = 0;

    for (let rewIdx = 0; rewIdx < rewrittenSentences.length; rewIdx++) {
        const rewSentence = rewrittenSentences[rewIdx];

        // Try to find matching sentence
        let sentenceMatched = false;
        if (originalSentenceIndex < originalSentences.length) {
            const origSentence = originalSentences[originalSentenceIndex];
            if (rewSentence.normalized === origSentence.normalized) {
                // Already marked in pass 1
                originalSentenceIndex++;
                sentenceMatched = true;
            }
        }

        if (!sentenceMatched) {
            // Sentence doesn't match - break down into words
            const rewWords = rewSentence.words;
            const rewNormWords = rewSentence.normalizedWords;

            for (let wordIdx = 0; wordIdx < rewWords.length; wordIdx++) {
                const wordKey = `${rewIdx}:${wordIdx}`;
                if (matchedInRewritten.has(wordKey)) continue;

                const normWord = rewNormWords[wordIdx];

                // Search in current and next 2 original sentences
                let matchFound = false;
                const searchEnd = Math.min(originalSentences.length, originalSentenceIndex + 3);

                for (let origIdx = originalSentenceIndex; origIdx < searchEnd && !matchFound; origIdx++) {
                    const origSentence = originalSentences[origIdx];

                    for (let origWordIdx = 0; origWordIdx < origSentence.words.length; origWordIdx++) {
                        const origWordKey = `${origIdx}:${origWordIdx}`;
                        if (matchedInOriginal.has(origWordKey)) continue;

                        if (normWord === origSentence.normalizedWords[origWordIdx]) {
                            // Found a match! Now try to match consecutive words
                            matchedInRewritten.add(wordKey);
                            matchedInOriginal.add(origWordKey);
                            matchFound = true;

                            let rewNextIdx = wordIdx + 1;
                            let origNextIdx = origWordIdx + 1;

                            while (rewNextIdx < rewWords.length && origNextIdx < origSentence.words.length) {
                                const rewNextKey = `${rewIdx}:${rewNextIdx}`;
                                const origNextKey = `${origIdx}:${origNextIdx}`;

                                if (matchedInRewritten.has(rewNextKey) || matchedInOriginal.has(origNextKey)) {
                                    break;
                                }

                                if (rewNormWords[rewNextIdx] === origSentence.normalizedWords[origNextIdx]) {
                                    matchedInRewritten.add(rewNextKey);
                                    matchedInOriginal.add(origNextKey);
                                    rewNextIdx++;
                                    origNextIdx++;
                                } else {
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    // Collect additions - words in rewritten that weren't matched
    for (let rewIdx = 0; rewIdx < rewrittenSentences.length; rewIdx++) {
        const rewSentence = rewrittenSentences[rewIdx];
        let additionPhrase = [];

        for (let wordIdx = 0; wordIdx < rewSentence.words.length; wordIdx++) {
            const wordKey = `${rewIdx}:${wordIdx}`;
            if (!matchedInRewritten.has(wordKey)) {
                additionPhrase.push(rewSentence.words[wordIdx]);
            } else {
                if (additionPhrase.length > 0) {
                    additions.push(additionPhrase.join(' ').trim());
                    additionPhrase = [];
                }
            }
        }

        if (additionPhrase.length > 0) {
            additions.push(additionPhrase.join(' ').trim());
        }
    }

    console.log('Total additions found:', additions.length);
    console.log('Total removals found:', removals.length);
    console.log('Sample additions:', additions.slice(0, 10));
    console.log('Sample removals:', removals.slice(0, 10));

    return {additions, removals};
};

const mainRun = async () => {

    const origFile = __dirname + '/original.html'
    const reFile = __dirname + '/rewrite.html'

    const original = await getFile(origFile)
    const rewritten = await getFile(reFile)

    const results = findTextDifferences(original, rewritten);
    console.log('*****************************************************')
    console.log('completed findTextDifferences')

    console.log(results)

}

mainRun()
