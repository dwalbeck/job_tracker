import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import './NotesForm.css';

const NotesForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    note_id: '',
    job_id: '',
    note_title: '',
    note_content: ''
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
    if (isEdit) {
      fetchNoteData();
    } else {
      // Pre-select job if job_id is in query params
      const jobIdParam = searchParams.get('job_id');
      if (jobIdParam) {
        setFormData(prev => ({ ...prev, job_id: jobIdParam }));
      }
    }
  }, [id, searchParams]);

  const fetchJobs = async () => {
    try {
      const response = await apiService.getJobList();
      setJobs(response || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  const fetchNoteData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes();
      const note = response.find(n => n.note_id === parseInt(id));
      if (note) {
        setFormData({
          note_id: note.note_id,
          job_id: note.job_id,
          note_title: note.note_title,
          note_content: note.note_content
        });
      } else {
        setError('Note not found');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      setError('Failed to load note data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        job_id: parseInt(formData.job_id)
      };

      if (isEdit) {
        await apiService.updateNote(submitData);
      } else {
        await apiService.createNote(submitData);
      }

      // Navigate back to Job Details if job_id is in query params
      const jobIdParam = searchParams.get('job_id');
      if (jobIdParam) {
        navigate(`/job-details/${jobIdParam}`);
      } else {
        navigate('/notes');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to Job Details if job_id is in query params
    const jobIdParam = searchParams.get('job_id');
    if (jobIdParam) {
      navigate(`/job-details/${jobIdParam}`);
    } else {
      navigate('/notes');
    }
  };

  if (loading && isEdit) {
    return <div className="loading">Loading note data...</div>;
  }

  return (
    <div className="notes-form-container">
      <div className="notes-form-header">
        <h1>{isEdit ? 'Edit Note' : 'Add New Note'}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="notes-form">
        <input type="hidden" name="note_id" value={formData.note_id} />

        <div className="form-group">
          <label htmlFor="job_id">Job *</label>
          <select
            id="job_id"
            name="job_id"
            value={formData.job_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a job</option>
            {jobs.map(job => (
              <option key={job.job_id} value={job.job_id}>
                {job.company}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="note_title">Note Title *</label>
          <input
            type="text"
            id="note_title"
            name="note_title"
            value={formData.note_title}
            onChange={handleChange}
            required
            placeholder="Enter a title for your note"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note_content">Note Content *</label>
          <textarea
            id="note_content"
            name="note_content"
            value={formData.note_content}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Enter your note content here..."
            className="auto-expand"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Note' : 'Add Note')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotesForm;