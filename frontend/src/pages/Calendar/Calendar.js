import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import MonthView from '../../components/Calendar/MonthView';
import WeekView from '../../components/Calendar/WeekView';
import DayView from '../../components/Calendar/DayView';
import ReminderModal from '../../components/ReminderModal/ReminderModal';
import apiService from '../../services/api';
import './Calendar.css';

const Calendar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const {selectedJobId} = useJob();
    const navigate = useNavigate();

    const view = searchParams.get('view') || 'month';
    const jobIdParam = searchParams.get('job_id');

    useEffect(() => {
        // Check if we should open the reminder modal on page load
        const shouldOpenReminder = searchParams.get('open_reminder');
        if (shouldOpenReminder === 'true') {
            setShowReminderModal(true);
            // Remove the open_reminder parameter from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('open_reminder');
            setSearchParams(newParams);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleViewChange = (newView) => {
        setSearchParams({view: newView});
    };

    const handleDateChange = (newDate) => {
        setCurrentDate(newDate);
    };

    const handleGoBack = () => {
        if (selectedJobId) {
            navigate(`/job-details/${selectedJobId}`);
        }
    };

    const handleAddReminder = () => {
        setShowReminderModal(true);
    };

    const handleCloseReminderModal = (success) => {
        setShowReminderModal(false);
        setSelectedReminder(null);

        // If coming from job details and reminder was saved, redirect back
        if (success && jobIdParam) {
            navigate(`/job-details/${jobIdParam}`);
        }
    };

    const handleReminderClick = (reminder) => {
        setSelectedReminder(reminder);
        setShowReminderModal(true);
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportCalendar();
            const { calendar_export_dir, calendar_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${calendar_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = calendar_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting calendar:', error);
            alert('Failed to export calendar');
        }
    };

    const renderView = () => {
        switch (view) {
            case 'week':
                return (
                    <WeekView
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onReminderClick={handleReminderClick}
                    />
                );
            case 'day':
                return (
                    <DayView
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onReminderClick={handleReminderClick}
                    />
                );
            default:
                return (
                    <MonthView
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onViewChange={handleViewChange}
                        onReminderClick={handleReminderClick}
                    />
                );
        }
    };

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="header-left">
                    {selectedJobId && (
                        <button onClick={handleGoBack} className="back-button">
                            ←
                        </button>
                    )}
                    <h1>Calendar - {view} view</h1>
                </div>
                <div className="header-controls">
                    <button
                        onClick={handleAddReminder}
                        className="action-button"
                    >
                        + Add Reminder
                    </button>
                    <button
                        onClick={() => navigate('/calendar-form')}
                        className="action-button"
                    >
                        + Add Appointment
                    </button>
                    <ExportMenu label="Export Calendar" onExport={handleExport} />
                </div>
            </div>

            {renderView()}

            <ReminderModal
                isOpen={showReminderModal}
                onClose={handleCloseReminderModal}
                preSelectedJobId={jobIdParam || selectedJobId}
                reminder={selectedReminder}
                redirectJobId={jobIdParam}
            />
        </div>
    );
};

export default Calendar;