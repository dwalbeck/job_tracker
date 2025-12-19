import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import './CoverLetter.css';

const CoverLetter = () => {
    const [letters, setLetters] = useState([]);
    const [filteredLetters, setFilteredLetters] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLetters();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = letters.filter(letter =>
                letter.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                letter.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredLetters(filtered);
        } else {
            setFilteredLetters(letters);
        }
    }, [searchTerm, letters]);

    const fetchLetters = async () => {
        try {
            setLoading(true);
            const response = await apiService.getLetterList();
            setLetters(response || []);
        } catch (error) {
            console.error('Error fetching cover letters:', error);
            setLetters([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (coverId) => {
        if (!window.confirm('Are you sure you want to delete this cover letter?')) {
            return;
        }

        try {
            await apiService.deleteLetter(coverId);
            // Remove from local state
            setLetters(letters.filter(letter => letter.cover_id !== coverId));
        } catch (error) {
            console.error('Error deleting cover letter:', error);
            alert('Failed to delete cover letter');
        }
    };

    const handleAddNew = () => {
        navigate('/create-cover-letter');
    };

    const handleDownload = async (coverId) => {
        try {
            // Convert the letter to DOCX
            const convertResponse = await apiService.convertLetter(coverId, 'docx');
            const serverFileName = convertResponse.file_name;

            // Get personal info for custom filename
            const personalInfo = await apiService.getPersonalInfo();
            const firstName = personalInfo.first_name || 'cover';
            const lastName = personalInfo.last_name || 'letter';
            const downloadFileName = `${firstName}_${lastName}-cover_letter.docx`.toLowerCase().replace(/ /g, '_');

            // Download the file with custom filename
            const fileUrl = `${apiService.baseURL}/v1/files/cover_letters/${serverFileName}`;

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = downloadFileName;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading cover letter:', error);
            alert('Failed to download cover letter');
        }
    };

    const handleEditCoverLetter = (jobId, resumeId) => {
        navigate(`/create-cover-letter?job_id=${jobId}&resume_id=${resumeId}`);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const getTimeSinceCreation = (createdDate) => {
        if (!createdDate) return '';

        const created = new Date(createdDate);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 13) {
            return `Created ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        } else if (diffDays <= 15 * 7) { // Up to 15 weeks
            const weeks = Math.floor(diffDays / 7);
            return `Created ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `Created ${months} ${months === 1 ? 'month' : 'months'} ago`;
        }
    };

    if (loading) {
        return <div className="cover-letter-container">Loading...</div>;
    }

    return (
        <div className="cover-letter-container">
            <div className="cover-letter-header">
                <h1 className="cover-letter-title">Cover Letter</h1>
                <div className="cover-letter-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by company or job title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search-btn" onClick={clearSearch}>
                                ✕
                            </button>
                        )}
                    </div>
                    <button className="action-button" onClick={handleAddNew}>
                        Add New
                    </button>
                </div>
            </div>

            <div className="letters-grid">
                {filteredLetters.length === 0 ? (
                    <div className="no-letters">
                        {searchTerm ? 'No matching cover letters found' : 'No cover letters yet'}
                    </div>
                ) : (
                    filteredLetters.map((letter) => (
                        <div key={letter.cover_id} className="letter-card">
                            <div
                                className="letter-card-company clickable"
                                onClick={() => handleEditCoverLetter(letter.job_id, letter.resume_id)}
                            >
                                {letter.company}
                            </div>
                            <div
                                className="letter-card-job-title clickable"
                                onClick={() => handleEditCoverLetter(letter.job_id, letter.resume_id)}
                            >
                                {letter.job_title}
                            </div>
                            <div className="letter-card-date">
                                {getTimeSinceCreation(letter.letter_created)}
                            </div>
                            <div className="letter-card-detail">
                                Length: <span className="detail-value">{letter.letter_length}</span>
                            </div>
                            <div className="letter-card-detail">
                                Tone: <span className="detail-value">{letter.letter_tone}</span>
                            </div>
                            <div className="letter-card-actions">
                                <button
                                    className="letter-action-btn delete-btn"
                                    onClick={() => handleDelete(letter.cover_id)}
                                >
                                    <span className="icon">🗑️</span>
                                    <span>Delete</span>
                                </button>
                                <button
                                    className="letter-action-btn download-btn"
                                    onClick={() => handleDownload(letter.cover_id)}
                                >
                                    <span>Download</span>
                                    <span className="icon">📥</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CoverLetter;