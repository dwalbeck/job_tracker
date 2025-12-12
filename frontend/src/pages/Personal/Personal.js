import React, {useState, useEffect} from 'react';
import apiService from '../../services/api';
import './Personal.css';

const Personal = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [personalData, setPersonalData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        portfolio_url: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        no_response_week: 4,
        resume_extract_llm: 'gpt-4.1-mini',
        job_extract_llm: 'gpt-4.1-mini',
        rewrite_llm: 'gpt-4.1-mini',
        cover_llm: 'gpt-4.1-mini',
        openai_api_key: '',
        tinymce_api_key: '',
        convertapi_key: '',
        docx2html: 'docx-parser-converter',
        odt2html: 'pandoc',
        pdf2html: 'markitdown',
        html2docx: 'html4docx',
        html2odt: 'pandoc',
        html2pdf: 'weasyprint'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Available LLM models
    const llmModels = [
        "gpt-5.2",
        "gpt-5.2-2025-12-11",
        "gpt-5.2-chat-latest",
        "gpt-5.2-pro",
        "gpt-5.2-pro-2025-12-11",
        "gpt-5.1",
        "gpt-5.1-codex",
        "gpt-5.1-codex-max",
        "gpt-5.1-codex-mini",
        "gpt-5.1-mini",
        "gpt-5.1-nano",
        "gpt-5.1-chat-latest",
        "gpt-5.1-2025-11-13",
        "gpt-5-mini",
        "gpt-5-mini-2025-08-07",
        "gpt-5-nano",
        "gpt-5-nano-2025-08-07",
        "gpt-5-codex",
        "gpt-5",
        "gpt-5-2025-08-07",
        "gpt-5-chat-latest",
        "gpt-5-pro",
        "gpt-5-search-api",
        "gpt-5-search-api-2025-10-14",
        "gpt-5-pro-2025-10-06",
        "gpt-4.1",
        "gpt-4-1106-preview",
        "gpt-4.1-2025-04-14",
        "gpt-4.1-nano-2025-04-14",
        "gpt-4.1-mini",
        "gpt-4.1-mini-2025-04-14",
        "gpt-4.1-nano",
        "gpt-4",
        "gpt-4-0125-preview",
        "gpt-4-turbo",
        "gpt-4-turbo-preview",
        "gpt-4-turbo-2024-04-09",
        "gpt-4-0613",
        "gpt-4o-2024-08-06",
        "chatgpt-4o-latest",
        "gpt-4o",
        "gpt-4o-realtime-preview",
        "gpt-4o-2024-11-20",
        "gpt-4o-2024-05-13",
        "gpt-4o-audio-preview",
        "gpt-4o-audio-preview-2025-06-03",
        "gpt-4o-audio-preview-2024-12-17",
        "gpt-4o-audio-preview-2024-10-01",
        "gpt-4o-mini",
        "o4-mini",
        "gpt-4o-mini-2024-07-18",
        "o4-mini-2025-04-16",
        "gpt-4o-mini-audio-preview",
        "gpt-4o-mini-audio-preview-2024-12-17",
        "o4-mini-deep-research-2025-06-26",
        "o4-mini-deep-research",
        "gpt-4o-mini-realtime-preview",
        "gpt-4o-mini-realtime-preview-2024-12-17",
        "gpt-4o-mini-search-preview",
        "gpt-4o-mini-search-preview-2025-03-11",
        "gpt-4o-mini-transcribe",
        "gpt-4o-mini-tts",
        "gpt-realtime-mini",
        "gpt-realtime-mini-2025-10-06",
        "gpt-4o-realtime-preview-2025-06-03",
        "gpt-4o-realtime-preview-2024-12-17",
        "gpt-4o-realtime-preview-2024-10-01",
        "gpt-4o-search-preview",
        "gpt-4o-search-preview-2025-03-11",
        "gpt-4o-transcribe",
        "gpt-4o-transcribe-diarize",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-0125",
        "gpt-3.5-turbo-1106",
        "gpt-3.5-turbo-instruct",
        "gpt-3.5-turbo-instruct-0914",
        "gpt-3.5-turbo-16k",
        "o3",
        "o3-2025-04-16",
        "o3-mini",
        "o3-mini-2025-01-31",
        "o1",
        "o1-2024-12-17",
        "o1-pro",
        "o1-pro-2025-03-19",
        "gpt-audio",
        "gpt-audio-2025-08-28",
        "gpt-audio-mini",
        "gpt-audio-mini-2025-10-06",
        "gpt-image-1",
        "gpt-image-1-mini",
        "gpt-realtime",
        "gpt-realtime-2025-08-28",
        "babbage-002",
        "codex-mini-latest",
        "davinci-002",
        "dall-e-3",
        "dall-e-2",
        "omni-moderation-latest",
        "omni-moderation-2024-09-26",
        "sora-2",
        "sora-2-pro",
        "text-embedding-3-small",
        "text-embedding-3-large",
        "tts-1",
        "tts-1-hd-1106",
        "tts-1-hd",
        "tts-1-1106",
        "whisper-1"
    ];

    // Personal Information fields (left column)
    const personalFields = {
        first_name: 'First Name',
        last_name: 'Last Name',
        email: 'Email',
        phone: 'Phone Number',
        linkedin_url: 'LinkedIn URL',
        github_url: 'Github URL',
        website_url: 'Personal Website',
        portfolio_url: 'Portfolio URL',
        address_1: 'Street Address',
        address_2: 'Street Address 2',
        city: 'City',
        state: 'State/Province',
        zip: 'Zip Code',
        country: 'Country'
    };

    // Settings fields (right column)
    const settingsFields = {
        no_response_week: 'Auto Status Change',
        resume_extract_llm: 'Resume Extract LLM',
        job_extract_llm: 'Job Extraction LLM',
        rewrite_llm: 'Resume Rewrite LLM',
        cover_llm: 'Cover Letter LLM',
        openai_api_key: 'OpenAI API Key',
        tinymce_api_key: 'TinyMCE API Key',
        convertapi_key: 'ConvertAPI Key',
        docx2html: 'Docx To HTML',
        odt2html: 'Odt To HTML',
        pdf2html: 'PDF To HTML',
        html2docx: 'HTML To Docx',
        html2odt: 'HTML To Odt',
        html2pdf: 'HTML To PDF'
    };

    // Conversion method options
    const conversionOptions = {
        docx2html: [
            { value: 'docx-parser-converter', label: 'docx-parser-converter' },
            { value: 'convertapi', label: 'convertapi' },
            { value: 'docx2html', label: 'Docx2Html' }
        ],
        odt2html: [
            { value: 'pandoc', label: 'pandoc' }
        ],
        pdf2html: [
            { value: 'markitdown', label: 'markitdown' }
        ],
        html2docx: [
            { value: 'html4docx', label: 'html4docx' },
            { value: 'convertapi', label: 'convertapi' },
            { value: 'python-docx', label: 'Python-Docx' }
        ],
        html2odt: [
            { value: 'pandoc', label: 'pandoc' },
            { value: 'convertapi', label: 'convertapi' }
        ],
        html2pdf: [
            { value: 'weasyprint', label: 'weasyprint' },
            { value: 'convertapi', label: 'convertapi' }
        ]
    };

    useEffect(() => {
        fetchPersonalInfo();
    }, []);

    const fetchPersonalInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getPersonalInfo();
            // Apply defaults for fields that may be null/empty
            setPersonalData({
                ...data,
                no_response_week: data.no_response_week || 4,
                resume_extract_llm: data.resume_extract_llm || 'gpt-4.1-mini',
                job_extract_llm: data.job_extract_llm || 'gpt-4.1-mini',
                rewrite_llm: data.rewrite_llm || 'gpt-4.1-mini',
                cover_llm: data.cover_llm || 'gpt-4.1-mini',
                openai_api_key: data.openai_api_key || '',
                tinymce_api_key: data.tinymce_api_key || '',
                convertapi_key: data.convertapi_key || '',
                docx2html: data.docx2html || 'docx-parser-converter',
                odt2html: data.odt2html || 'pandoc',
                pdf2html: data.pdf2html || 'markitdown',
                html2docx: data.html2docx || 'html4docx',
                html2odt: data.html2odt || 'pandoc',
                html2pdf: data.html2pdf || 'weasyprint'
            });
        } catch (err) {
            setError(err.message);
            console.error('Error fetching personal info:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchPersonalInfo(); // Reset to original data
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setPersonalData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setError(null);
        try {
            await apiService.savePersonalInfo(personalData);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
            console.error('Error saving personal info:', err);
        }
    };

    if (loading) {
        return <div className="personal-container">Loading...</div>;
    }

    const isLlmField = (fieldName) => {
        return ['resume_extract_llm', 'job_extract_llm', 'rewrite_llm', 'cover_llm'].includes(fieldName);
    };

    const isApiKeyField = (fieldName) => {
        return ['openai_api_key', 'tinymce_api_key', 'convertapi_key'].includes(fieldName);
    };

    const isConversionField = (fieldName) => {
        return ['docx2html', 'odt2html', 'pdf2html', 'html2docx', 'html2odt', 'html2pdf'].includes(fieldName);
    };

    const isWideField = (fieldName) => {
        return ['email', 'linkedin_url', 'github_url', 'website_url', 'portfolio_url', 'address_1', 'openai_api_key', 'tinymce_api_key', 'convertapi_key'].includes(fieldName);
    };

    const renderField = (fieldName, label) => {
        return (
            <div key={fieldName} className="personal-field-row">
                <label className="personal-label">
                    {label}
                </label>
                {isEditing ? (
                    <div className="personal-input-wrapper">
                        {isLlmField(fieldName) ? (
                            <select
                                name={fieldName}
                                value={personalData[fieldName] || ''}
                                onChange={handleChange}
                                className="personal-input"
                            >
                                <option value="">Select a model...</option>
                                {llmModels.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        ) : isConversionField(fieldName) ? (
                            <select
                                name={fieldName}
                                value={personalData[fieldName] || ''}
                                onChange={handleChange}
                                className="personal-input"
                            >
                                {conversionOptions[fieldName].map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.value === 'convertapi' && !personalData.convertapi_key}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <>
                                <input
                                    type={isApiKeyField(fieldName) ? 'password' : (fieldName === 'no_response_week' ? 'number' : 'text')}
                                    name={fieldName}
                                    value={personalData[fieldName] || ''}
                                    onChange={handleChange}
                                    className={isWideField(fieldName) ? 'personal-input personal-input-wide' : 'personal-input'}
                                    min={fieldName === 'no_response_week' ? '1' : undefined}
                                    max={fieldName === 'no_response_week' ? '52' : undefined}
                                />
                                {fieldName === 'no_response_week' && (
                                    <span className="personal-input-suffix">weeks of no contact</span>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <span className="personal-value">
                        {personalData[fieldName]
                            ? (isApiKeyField(fieldName)
                                ? '••••••••'
                                : (fieldName === 'no_response_week'
                                    ? `${personalData[fieldName]} weeks of no contact`
                                    : personalData[fieldName]))
                            : '-'}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="personal-container">
            <div className="personal-header">
                <h1 className="personal-title">Personal Information / Settings</h1>
                {!isEditing && (
                    <button className="edit-button" onClick={handleEdit}>
                        Edit
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="personal-columns">
                <div className="personal-column">
                    <h2 className="column-title">Personal</h2>
                    <div className="personal-content">
                        {Object.keys(personalFields).map((fieldName) =>
                            renderField(fieldName, personalFields[fieldName])
                        )}
                    </div>
                </div>

                <div className="personal-column">
                    <h2 className="column-title">Settings</h2>
                    <div className="personal-content">
                        {Object.keys(settingsFields).map((fieldName) =>
                            renderField(fieldName, settingsFields[fieldName])
                        )}
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="personal-actions">
                    <button className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="save-button" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default Personal;
