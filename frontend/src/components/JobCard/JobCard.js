import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { calculateDateSpan, calculateLastContact } from '../../utils/dateUtils';
import './JobCard.css';

const JobCard = ({ job, index, onClick }) => {
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
          <div className="job-title">{job.job_title}</div>
          <div className="company-name">{job.company}</div>
          <div className="last-contact">{calculateLastContact(job.last_contact)}</div>
          <div className="date-span">{calculateDateSpan(job.date_applied)}</div>
        </div>
      )}
    </Draggable>
  );
};

export default JobCard;