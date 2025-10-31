import React, { useState } from 'react';
import apiService from '../../services/api';
import './ReminderAlert.css';

const ReminderAlert = ({ reminder, onDismiss }) => {
  const [dismissing, setDismissing] = useState(false);

  if (!reminder) return null;

  const handleDismiss = async () => {
    try {
      setDismissing(true);

      // Update reminder to mark as dismissed
      await apiService.saveReminder({
        reminder_id: reminder.reminder_id,
        reminder_date: reminder.reminder_date,
        reminder_time: reminder.reminder_time,
        reminder_message: reminder.reminder_message,
        reminder_dismissed: true,
        job_id: reminder.job_id || null
      });

      // Call parent's onDismiss to remove from display and memory
      onDismiss(reminder.reminder_id);
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      alert('Failed to dismiss reminder. Please try again.');
      setDismissing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'No time specified';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="reminder-alert-overlay">
      <div className="reminder-alert-content">
        <h2 className="reminder-alert-title">
          <span className="reminder-alert-icon">⏰</span>
          Reminder Alert
        </h2>

        <div className="reminder-alert-details">
          <div className="reminder-alert-row">
            <div className="reminder-alert-label">Date:</div>
            <div className="reminder-alert-value">{formatDate(reminder.reminder_date)}</div>
          </div>

          <div className="reminder-alert-row">
            <div className="reminder-alert-label">Time:</div>
            <div className="reminder-alert-value">{formatTime(reminder.reminder_time)}</div>
          </div>

          <div className="reminder-alert-row">
            <div className="reminder-alert-label">Message:</div>
            <div className="reminder-alert-value">{reminder.reminder_message}</div>
          </div>
        </div>

        <div className="reminder-alert-actions">
          <button
            onClick={handleDismiss}
            className="reminder-dismiss-button"
            disabled={dismissing}
          >
            {dismissing ? 'Dismissing...' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderAlert;
