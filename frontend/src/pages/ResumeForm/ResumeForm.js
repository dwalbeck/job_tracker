import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import apiService from '../../services/api';
import {API_BASE_URL} from '../../config';
import './ResumeForm.css';

const ResumeForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = location.state?.resumeId ? true : false;
    const resumeId = location.state?.resumeId;

    // Form state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [jobList, setJobList] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [resumeTitle, setResumeTitle] = useState('');
    const [isBaseline, setIsBaseline] = useState(true);
    const [isDefault, setIsDefault] = useState(false);

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingSteps, setProcessingSteps] = useState([]);
    const [currentResumeId, setCurrentResumeId] = useState(resumeId || null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [badList, setBadList] = useState([]);
    const [showJobTitleConfirm, setShowJobTitleConfirm] = useState(false);
    const [currentJobTitle, setCurrentJobTitle] = useState('');
    const [currentLineNumber, setCurrentLineNumber] = useState(0);
    const [keywords, setKeywords] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [originalFormat, setOriginalFormat] = useState('');
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        fetchJobList();
        if (isEdit && resumeId) {
            loadResumeData();
        }
    }, [isEdit, resumeId]);

    const fetchJobList = async () => {
        try {
            const data = await apiService.getJobList();
            setJobList(data || []);
        } catch (error) {
            console.error('Error fetching job list:', error);
        }
    };

    const loadResumeData = async () => {
        try {
            const data = await apiService.getResume(resumeId);

            setResumeTitle(data.resume_title || '');
            setIsBaseline(data.is_baseline || false);
            setIsDefault(data.is_default || false);
            setSelectedJob(data.job_id || '');
            setFileName(data.file_name || '');
            setOriginalFormat(data.original_format || '');
        } catch (error) {
            console.error('Error loading resume:', error);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFilePath(file.name);

            // Extract file extension
            const ext = file.name.split('.').pop().toLowerCase();
            setOriginalFormat(ext);
        }
    };

    const handleJobChange = (e) => {
        const jobId = e.target.value;
        setSelectedJob(jobId);

        // If job is selected, hide resume title and baseline
        if (jobId) {
            setIsBaseline(false);
            setResumeTitle('');
        } else {
            setIsBaseline(true);
        }
    };

    const handleBaselineChange = (e) => {
        const checked = e.target.checked;
        setIsBaseline(checked);

        // If unchecking baseline, also uncheck default
        if (!checked) {
            setIsDefault(false);
        }
    };

    const addProcessingStep = (text, status = 'pending', subtext = null) => {
        setProcessingSteps(prev => [...prev, {text, status, subtext}]);
    };

    const updateProcessingStep = (index, status) => {
        setProcessingSteps(prev => prev.map((step, i) =>
            i === index ? {...step, status} : step
        ));
    };

    const handleSubmit = async () => {
        if (!selectedFile && !isEdit) {
            alert('Please select a file to upload');
            return;
        }

        if (!selectedJob && !resumeTitle) {
            alert('Please provide a resume title or select a job');
            return;
        }

        setIsProcessing(true);
        setProcessingSteps([]);

        try {
            // Step 1: Create/Update Resume Record
            const formData = new FormData();
            if (selectedFile) {
                formData.append('upload_file', selectedFile);
            }
            formData.append('resume_title', resumeTitle || 'Job Resume');
            formData.append('is_baseline', selectedJob ? 'false' : String(isBaseline));
            formData.append('is_default', String(isDefault));

            if (selectedJob) {
                formData.append('job_id', selectedJob);
            }

            if (isEdit && resumeId) {
                formData.append('resume_id', resumeId);
            }

            //const resumeResponse = await apiService.updateResume(formData);
            const resumeResponse = await fetch(`${API_BASE_URL}/v1/resume`, {
                method: 'POST',
                body: formData,
            });
            if (!resumeResponse.ok) {
                const errorText = await resumeResponse.text();
                let errorMessage = `HTTP error ${resumeResponse.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.detail || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const resumeResult = await resumeResponse.json();
            const newResumeId = resumeResult.resume_id;
            setCurrentResumeId(newResumeId);

            // Fetch the resume record to get file details
            const resumeDetails = await apiService.getResume(newResumeId);

            const fileFormat = resumeDetails.original_format;
            const resumeFileName = resumeDetails.file_name;

            setFileName(resumeFileName);
            setOriginalFormat(fileFormat);

            // Step 2: Start Processing
            addProcessingStep('Creating a Markdown version...', 'pending');

            // Convert to Markdown
            const mdResult = await apiService.convertXxxToMarkdown(fileFormat, resumeFileName);
            setMarkdownContent(mdResult.file_content);
            updateProcessingStep(0, 'done');

            // Step 3: Convert to HTML
            addProcessingStep('Creating an HTML version...', 'pending');

            const htmlResult = await apiService.convertXxxToHtml(fileFormat, resumeFileName);
            setHtmlContent(htmlResult.file_content);
            updateProcessingStep(1, 'done');

            // Step 4: Save partial resume_detail
            await apiService.updateResumeDetail({
                    resume_id: newResumeId,
                    resume_markdown: mdResult.file_content,
                    resume_html: htmlResult.file_content,
                })

            // Step 5: Extract job title and keywords
            addProcessingStep('Extracting job title and keywords...', 'pending', 'This process could take up to a couple minutes.');

            await extractJobTitleAndKeywords(newResumeId);

        } catch (error) {
            console.error('Error processing resume:', error);
            alert('Error processing resume: ' + error.message);
            setIsProcessing(false);
        }
    };

    const extractJobTitleAndKeywords = async (resumeId, badTitles = []) => {
        try {
            const extractResult = await apiService.extractResume({
                resume_id: resumeId,
                bad_list: badTitles,
            });

            setExtractedData(extractResult);
            setCurrentJobTitle(extractResult.job_title.job_title);
            setCurrentLineNumber(extractResult.job_title.line_number);
            setKeywords(extractResult.keywords);
            setSuggestions(extractResult.suggestions);

            // Show confirmation
            setShowJobTitleConfirm(true);

        } catch (error) {
            console.error('Error extracting data:', error);
            alert('Error extracting resume data: ' + error.message);
        }
    };

    const handleJobTitleNo = async () => {
        // Add current job title to bad list
        const newBadList = [...badList, currentJobTitle];
        setBadList(newBadList);

        // Re-extract with updated bad list
        await extractJobTitleAndKeywords(currentResumeId, newBadList);
    };

    const handleJobTitleYes = async () => {
        // Hide confirmation
        setShowJobTitleConfirm(false);

        // Save final data to database
        try {
            await apiService.updateResumeDetail({
                resume_id: currentResumeId,
                position_title: currentJobTitle,
                title_line_no: currentLineNumber,
                resume_keyword: keywords,
                keyword_count: keywords.length,
                suggestion: suggestions,
            });

            // Mark extraction step as done
            updateProcessingStep(2, 'done');

            // Show suggestions
            setShowSuggestions(true);

        } catch (error) {
            console.error('Error saving resume details:', error);
            alert('Error saving resume details: ' + error.message);
        }
    };

    const handleDone = () => {
        navigate('/resume');
    };

    const handleCancel = () => {
        navigate('/resume');
    };

    return (
        <div className="resume-form-page">
            <h1>{isEdit ? 'Modify Resume' : 'Add New Resume'}</h1>

            <div className="resume-form-container">
                {/* Left Side - Form */}
                <div className="resume-form-left">
                    <div className="form-row">
                        <label className="form-label">File Upload</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="text"
                                className="file-path-input"
                                value={filePath}
                                readOnly
                                placeholder="No file selected"
                            />
                            <label className="browse-button">
                                Browse
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    style={{display: 'none'}}
                                    accept=".pdf,.docx,.odt"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <label className="form-label">For Job</label>
                        <select
                            className="form-select"
                            value={selectedJob}
                            onChange={handleJobChange}
                            disabled={isProcessing}
                        >
                            <option value="">-- Select Job (Optional) --</option>
                            {jobList.map((job) => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.company} - {job.job_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedJob && (
                        <>
                            <div className="form-row">
                                <label className="form-label">Resume Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeTitle}
                                    onChange={(e) => setResumeTitle(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="form-row">
                                <label className="form-label">Baseline</label>
                                <input
                                    type="checkbox"
                                    checked={isBaseline}
                                    onChange={handleBaselineChange}
                                    disabled={isProcessing}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-row">
                        <label className="form-label">Default</label>
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            disabled={!isBaseline || isProcessing}
                        />
                    </div>

                    <div className="form-buttons">
                        <button className="cancel-button" onClick={handleCancel} disabled={isProcessing}>
                            Cancel
                        </button>
                        <button
                            className="submit-button"
                            onClick={handleSubmit}
                            disabled={isProcessing}
                        >
                            {isEdit ? 'Update Resume' : 'Add Resume'}
                        </button>
                    </div>
                </div>

                {/* Right Side - Processing Display */}
                <div className="resume-form-right">
                    {isProcessing && (
                        <>
                            <h2 className="processing-header">Processing uploaded resume file</h2>

                            <div className="processing-steps">
                                {processingSteps.map((step, index) => (
                                    <div key={index} className="processing-step">
                                        <span className="step-text">{step.text}</span>
                                        {step.status === 'done' && <span className="step-done">Done</span>}
                                        {step.subtext && step.status !== 'done' && (
                                            <div className="step-subtext">{step.subtext}</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {showJobTitleConfirm && (
                                <div className="job-title-confirmation">
                                    <div className="confirm-question">Is this correct?</div>
                                    <div className="job-title-display">{currentJobTitle}</div>
                                    <div className="confirm-buttons">
                                        <button className="confirm-no-button" onClick={handleJobTitleNo}>
                                            No
                                        </button>
                                        <button className="confirm-yes-button" onClick={handleJobTitleYes}>
                                            Yes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {showSuggestions && (
                                <div className="suggestions-section">
                                    <h3 className="suggestions-header">Suggestions for Improvement</h3>
                                    <ul className="suggestions-list">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={index} className="suggestion-item">{suggestion}</li>
                                        ))}
                                    </ul>
                                    <div className="done-button-container">
                                        <button className="done-button" onClick={handleDone}>
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeForm;
