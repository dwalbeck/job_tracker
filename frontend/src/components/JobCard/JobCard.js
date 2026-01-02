import React from 'react';
import {Draggable} from 'react-beautiful-dnd';
import {calculateDateSpan, calculateLastContact} from '../../utils/dateUtils';
import './JobCard.css';

const JobCard = ({job, index, onClick}) => {
    /**
     * Determines if the appointment is upcoming and formats the display text
     * @returns {string|null} Formatted appointment text or null if no upcoming appointment
     */
    const getAppointmentReminder = () => {
        if (!job.start_date) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for date comparison

        const appointmentDate = new Date(job.start_date);
        appointmentDate.setHours(0, 0, 0, 0);

        // Check if appointment is in the past
        if (appointmentDate < today) {
            return null;
        }

        // Check if appointment is today
        if (appointmentDate.getTime() === today.getTime()) {
            // Check if the time has passed
            if (job.start_time) {
                const now = new Date();
                const [hours, minutes] = job.start_time.split(':');
                const appointmentDateTime = new Date();
                appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                if (appointmentDateTime <= now) {
                    return null; // Time has passed
                }

                // Format time as HH:MM
                return `appt at ${hours}:${minutes}`;
            }
            return null;
        }

        // Appointment is in the future
        const month = appointmentDate.getMonth() + 1; // Months are 0-indexed
        const day = appointmentDate.getDate();
        return `appt ${month}/${day}`;
    };

    const appointmentText = getAppointmentReminder();

    return (
        <Draggable draggableId={job.job_id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`job-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    onClick={onClick}
                >
                    <div className="title-row">
                        <div className="job-title">{job.job_title}</div>
                        {appointmentText && (
                            <div className="appointment-reminder">{appointmentText}</div>
                        )}
                    </div>
                    <div className="company-name">{job.company}</div>
                    <div className="last-contact">{calculateLastContact(job.last_activity)}</div>
                    <div className="bottom-row">
                        <div className="score-average">
                            {job.average_score !== null && job.average_score !== undefined
                                ? `Avg Score: ${job.average_score}`
                                : ''}
                        </div>
                        <div className="date-span">{calculateDateSpan(job.date_applied)}</div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default JobCard;