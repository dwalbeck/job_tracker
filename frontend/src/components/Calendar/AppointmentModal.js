import React, { useEffect, useRef, useState } from 'react';
import { formatTimeDisplay } from '../../utils/calendarUtils';
import apiService from '../../services/api';
import './AppointmentModal.css';

const AppointmentModal = ({ appointment, onClose, onEdit, onDelete }) => {
  const modalRef = useRef();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const formatParticipants = (participants) => {
    if (!participants || participants.length === 0) return 'None';
    return Array.isArray(participants) ? participants.join(', ') : participants;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteCalendarAppointment(appointment.calendar_id);

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(appointment.calendar_id);
      }

      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="appointment-modal-overlay">
      <div className="appointment-modal" ref={modalRef}>
        <div className="appt-modal-header">
          <div className="appt-modal-actions">
            <button onClick={() => onEdit(appointment)} className="edit-icon" disabled={isDeleting}>
              ✏️
            </button>
            <button onClick={handleDelete} className="delete-icon" disabled={isDeleting}>
              🗑️
            </button>
          </div>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        <div className="appt-modal-content">
          <div className="appt-modal-field">
            <span className="appt-field-label">Company:</span>
            <span className="appt-field-value">{appointment.company || 'Not specified'}</span>
          </div>

          <div className="appt-modal-field">
            <span className="appt-field-label">Type:</span>
            <span className="appt-field-value">{appointment.calendar_type}</span>
          </div>

          <div className="appt-modal-field">
            <span className="appt-field-label">Start:</span>
            <span className="appt-field-value">
              {formatDate(appointment.start_date)} at {formatTimeDisplay(appointment.start_time)}
            </span>
          </div>

          {appointment.end_date && (
            <div className="appt-modal-field">
              <span className="appt-field-label">End:</span>
              <span className="appt-field-value">
                {formatDate(appointment.end_date)} at {formatTimeDisplay(appointment.end_time)}
              </span>
            </div>
          )}

          {appointment.duration_hour && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Duration:</span>
              <span className="appt-field-value">{appointment.duration_hour} hours</span>
            </div>
          )}

          {appointment.participant && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Participants:</span>
              <span className="appt-field-value">{formatParticipants(appointment.participant)}</span>
            </div>
          )}

          {appointment.calendar_desc && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Description:</span>
              <span className="appt-field-value">{appointment.calendar_desc}</span>
            </div>
          )}

          {appointment.calendar_note && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Notes:</span>
              <span className="appt-field-value">{appointment.calendar_note}</span>
            </div>
          )}

          {appointment.outcome_score && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Outcome Score:</span>
              <span className="appt-field-value">{appointment.outcome_score}/10</span>
            </div>
          )}

          {appointment.outcome_note && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Outcome Note:</span>
              <span className="appt-field-value">{appointment.outcome_note}</span>
            </div>
          )}

          {appointment.video_link && (
            <div className="appt-modal-field">
              <span className="appt-field-label">Video Link:</span>
              <span className="appt-field-value">
                <a href={appointment.video_link} target="_blank" rel="noopener noreferrer">
                  {appointment.video_link}
                </a>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;