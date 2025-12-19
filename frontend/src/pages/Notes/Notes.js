import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import './Notes.css';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredNote, setHoveredNote] = useState(null);
    const {selectedJobId} = useJob();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobId]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = notes.filter(note =>
                note.note_content.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredNotes(filtered);
        } else {
            setFilteredNotes(notes);
        }
    }, [searchTerm, notes]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await apiService.getNotes(selectedJobId);
            setNotes(response || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNoteClick = (note) => {
        navigate(`/notes-form/${note.note_id}`);
    };

    const handleAddNote = () => {
        navigate('/notes-form');
    };

    const handleGoBack = () => {
        if (selectedJobId) {
            navigate(`/job-details/${selectedJobId}`);
        }
    };

    const handleDeleteNote = async (noteId, e) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await apiService.deleteNote(noteId);
                await fetchNotes(); // Refresh the list
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note');
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportNotes();
            const { note_export_dir, note_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${note_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = note_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting notes:', error);
            alert('Failed to export notes');
        }
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="notes-page">
            <div className="notes-header">
                <div className="header-left">
                    {selectedJobId && (
                        <button onClick={handleGoBack} className="back-button">
                            ←
                        </button>
                    )}
                    <h1>Note List</h1>
                </div>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ⊠
                            </button>
                        )}
                    </div>
                    <button onClick={handleAddNote} className="action-button">
                        + Add Note
                    </button>
                    <ExportMenu label="Export Notes" onExport={handleExport} />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading notes...</div>
            ) : (
                <div className="notes-container">
                    {filteredNotes.length === 0 ? (
                        <div className="no-notes">
                            {searchTerm ? 'No notes match your search.' : 'No notes found.'}
                        </div>
                    ) : (
                        <div className="notes-grid">
                            {filteredNotes.map((note) => (
                                <div
                                    key={note.note_id}
                                    className={`note-row ${hoveredNote === note.note_id ? 'expanded' : ''}`}
                                    onClick={() => handleNoteClick(note)}
                                    onMouseEnter={() => setHoveredNote(note.note_id)}
                                    onMouseLeave={() => setHoveredNote(null)}
                                >
                                    <div className="note-company-cell">
                                        <div className="company-name">{note.company}</div>
                                        <div className="job-title">{note.job_title}</div>
                                    </div>

                                    <div className="note-content-cell">
                                        <div className="note-title">{note.note_title}</div>
                                        <div className="note-content">
                                            {hoveredNote === note.note_id ? note.note_content : truncateText(note.note_content)}
                                        </div>
                                    </div>

                                    <div className="note-timestamp-cell">
                                        <div className="note-created">
                                            {new Date(note.note_created).toLocaleDateString()}
                                        </div>
                                        <div className="note-created">
                                            {new Date(note.note_created).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="note-actions-cell">
                                        <button
                                            onClick={(e) => handleDeleteNote(note.note_id, e)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notes;