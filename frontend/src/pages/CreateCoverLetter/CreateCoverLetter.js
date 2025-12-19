import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Editor} from '@tinymce/tinymce-react';
import apiService from '../../services/api';
import './CreateCoverLetter.css';

const CreateCoverLetter = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editorRef = useRef(null);
    const [jobListings, setJobListings] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [resumeId, setResumeId] = useState('');
    const [coverId, setCoverId] = useState(null);
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [instruction, setInstruction] = useState('');
    const [letterContent, setLetterContent] = useState('');
    const [originalLetterContent, setOriginalLetterContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPreSelected, setIsPreSelected] = useState(false);

    useEffect(() => {
        // Check for URL parameters
        const jobIdParam = searchParams.get('job_id');
        const resumeIdParam = searchParams.get('resume_id');

        if (jobIdParam && resumeIdParam) {
            setSelectedJobId(jobIdParam);
            setResumeId(resumeIdParam);
            setIsPreSelected(true);

            // Load existing cover letter if it exists
            loadExistingCoverLetter(jobIdParam);
        }

        fetchJobListings();
    }, [searchParams]);

    const loadExistingCoverLetter = async (jobId) => {
        try {
            // Get job details to check if cover_id exists
            const jobData = await apiService.getJob(jobId);

            if (jobData.cover_id) {
                // Load the existing cover letter
                const letterData = await apiService.getLetter(jobData.cover_id);

                if (letterData.letter_content) {
                    setCoverId(jobData.cover_id);
                    setLetterContent(letterData.letter_content);
                    setTone(letterData.letter_tone);
                    setLength(letterData.letter_length);
                    setInstruction(letterData.instruction || '');
                }
            }
        } catch (error) {
            console.error('Error loading existing cover letter:', error);
            // Not a critical error, just means no existing cover letter
        }
    };

    const fetchJobListings = async () => {
        try {
            setLoading(true);
            const response = await apiService.getJobList();
            setJobListings(response || []);
        } catch (error) {
            console.error('Error fetching job listings:', error);
            setJobListings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelection = async (jobId) => {
        setSelectedJobId(jobId);
        if (!jobId) {
            setResumeId('');
            return;
        }

        try {
            const response = await apiService.getJob(jobId);
            setResumeId(response.resume_id || '');
        } catch (error) {
            console.error('Error fetching job details:', error);
            setResumeId('');
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!selectedJobId || !resumeId) {
            alert('Please select a job listing first');
            return;
        }

        try {
            setIsGenerating(true);

            // First, save the cover letter data (include cover_id if it exists)
            const letterData = {
                resume_id: resumeId,
                job_id: selectedJobId,
                letter_length: length,
                letter_tone: tone,
                instruction: instruction,
                letter_content: ''
            };

            // Include cover_id if we already have one (update instead of insert)
            if (coverId) {
                letterData.cover_id = coverId;
            }

            const saveResponse = await apiService.saveLetter(letterData);

            const newCoverId = saveResponse.cover_id;
            setCoverId(newCoverId);

            // Then, generate the cover letter content
            const generateResponse = await apiService.writeLetter(newCoverId);
            setLetterContent(generateResponse.letter_content || '');
        } catch (error) {
            console.error('Error generating cover letter:', error);
            if (error.isTimeout) {
                alert('Request timed out. The AI generation is taking longer than expected. Please try again in a moment.');
            } else {
                alert('Failed to generate cover letter. Please try again.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEditClick = () => {
        setOriginalLetterContent(letterContent);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setLetterContent(originalLetterContent);
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!coverId) {
            alert('No cover letter to save');
            return;
        }

        // Get content from TinyMCE editor
        const content = editorRef.current ? editorRef.current.getContent() : letterContent;

        try {
            await apiService.saveLetter({
                cover_id: coverId,
                resume_id: resumeId,
                job_id: selectedJobId,
                letter_length: length,
                letter_tone: tone,
                instruction: instruction,
                letter_content: content
            });

            setLetterContent(content);
            setIsEditing(false);
            setOriginalLetterContent(content);
        } catch (error) {
            console.error('Error saving cover letter:', error);
            alert('Failed to save cover letter. Please try again.');
        }
    };

    const handleDownload = async () => {
        if (!coverId) {
            alert('Please generate a cover letter first');
            return;
        }

        try {
            // Convert the letter to DOCX
            const convertResponse = await apiService.convertLetter(coverId, 'docx');
            const serverFileName = convertResponse.file_name;

            // Download the file using standardized naming endpoint
            const fileUrl = `${apiService.baseURL}/v1/files/cover_letters/${serverFileName}`;

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = fileUrl;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading cover letter:', error);
            alert('Failed to download cover letter. Please try again.');
        }
    };

    const handleBack = () => {
        // Check for URL parameters
        const jobIdParam = searchParams.get('job_id');

        if (jobIdParam) {
            navigate(`/job-details/${jobIdParam}`);
        } else {
            navigate('/cover-letter');
        }
    };

    if (loading) {
        return <div className="create-cover-letter-container">Loading...</div>;
    }

    return (
        <div className="create-cover-letter-container">
            <div className="create-cover-letter-header">
                <button className="back-arrow" onClick={handleBack}>←</button>
                <h1 className="create-cover-letter-title">Create Cover Letter</h1>
            </div>

            <div className="create-cover-letter-content">
                {/* Left Side - Form */}
                <div className="form-section">
                    <h2 className="section-heading">Creation Details</h2>

                    <div className="cover-letter-form-row">
                        <label className="form-label">Job Listing</label>
                        <select
                            className="form-select"
                            value={selectedJobId}
                            onChange={(e) => handleJobSelection(e.target.value)}
                            disabled={isPreSelected}
                        >
                            <option value="">Select a job...</option>
                            {jobListings.map((job) => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.company} - {job.job_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <input type="hidden" value={resumeId}/>

                    <div className="cover-letter-form-row">
                        <label className="form-label">Tone</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="tone"
                                    value="professional"
                                    checked={tone === 'professional'}
                                    onChange={(e) => setTone(e.target.value)}
                                />
                                <span>Professional</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="tone"
                                    value="casual"
                                    checked={tone === 'casual'}
                                    onChange={(e) => setTone(e.target.value)}
                                />
                                <span>Casual</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="tone"
                                    value="enthusiastic"
                                    checked={tone === 'enthusiastic'}
                                    onChange={(e) => setTone(e.target.value)}
                                />
                                <span>Enthusiastic</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="tone"
                                    value="informational"
                                    checked={tone === 'informational'}
                                    onChange={(e) => setTone(e.target.value)}
                                />
                                <span>Informational</span>
                            </label>
                        </div>
                    </div>

                    <div className="cover-letter-form-row">
                        <label className="form-label">Length</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="length"
                                    value="short"
                                    checked={length === 'short'}
                                    onChange={(e) => setLength(e.target.value)}
                                />
                                <span>Short</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="length"
                                    value="medium"
                                    checked={length === 'medium'}
                                    onChange={(e) => setLength(e.target.value)}
                                />
                                <span>Medium</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="length"
                                    value="long"
                                    checked={length === 'long'}
                                    onChange={(e) => setLength(e.target.value)}
                                />
                                <span>Long</span>
                            </label>
                        </div>
                    </div>

                    <div className="cover-letter-form-row">
                        <label className="form-label form-label-stacked">
                            <div>Additional</div>
                            <div>Instruction</div>
                        </label>
                        <textarea
                            className="form-textarea"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            rows="5"
                            placeholder="Enter any additional instructions..."
                        />
                    </div>

                    <div className="cover-letter-form-row">
                        <div className="form-label"></div>
                        <button
                            className="action-button"
                            onClick={handleGenerateCoverLetter}
                            disabled={isGenerating || !selectedJobId}
                        >
                            {isGenerating ? 'Generating with AI (up to 4 minutes)...' : 'Generate Cover Letter'}
                        </button>
                    </div>
                </div>

                {/* Right Side - Preview */}
                <div className="preview-section">
                    <div className="preview-header">
                        <h2 className="section-heading">Cover Letter Preview</h2>
                        {letterContent && (
                            <div className="preview-header-buttons">
                                {isEditing ? (
                                    <>
                                        <button
                                            className="cancel-button"
                                            onClick={handleCancelEdit}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="action-button"
                                            onClick={handleSaveEdit}
                                        >
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="action-button"
                                        onClick={handleEditClick}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="preview-container">
                        {isEditing ? (
                            <div className="editor-wrapper">
                                <Editor
                                    apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                                    onInit={(_evt, editor) => editorRef.current = editor}
                                    initialValue={letterContent}
                                    init={{
                                        height: 500,
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
                        ) : letterContent ? (
                            <iframe
                                className="preview-iframe"
                                srcDoc={letterContent}
                                title="Cover Letter Preview"
                                sandbox="allow-same-origin"
                            />
                        ) : (
                            <div className="preview-content">
                                Your cover letter will appear here after generation...
                            </div>
                        )}
                    </div>

                    {letterContent && (
                        <div className="preview-actions">
                            <button className="action-button" onClick={handleDownload}>
                                Download
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateCoverLetter;
