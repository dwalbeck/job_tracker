import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import {formatDateForAPI, formatTimeDisplay, getHours, isBusinessHour} from '../../utils/calendarUtils';
import AppointmentModal from './AppointmentModal';
import './DayView.css';

const DayView = ({currentDate, onDateChange, onReminderClick}) => {
    const [appointments, setAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const navigate = useNavigate();

    const hours = getHours();

    useEffect(() => {
        fetchAppointments();
        fetchReminders();
    }, [currentDate]);

    // Auto-scroll to 8am on component mount and when date changes
    useEffect(() => {
        const scrollToEightAM = () => {
            const gridContainer = document.querySelector('.day-grid');
            if (gridContainer) {
                // Each hour slot is 80px in day view, 8am is index 8 (0-based from midnight)
                const eightAMPosition = 8 * 80;
                gridContainer.scrollTop = eightAMPosition;
            }
        };

        // Delay scroll to ensure DOM is fully rendered
        const timeoutId = setTimeout(scrollToEightAM, 100);
        return () => clearTimeout(timeoutId);
    }, [currentDate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const dateStr = formatDateForAPI(currentDate);
            const response = await apiService.getCalendarDay(dateStr);
            setAppointments(response || []);
        } catch (error) {
            console.error('Error fetching day appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReminders = async () => {
        try {
            const dateStr = formatDateForAPI(currentDate);
            const response = await apiService.getReminderList({
                duration: 'day',
                start_date: dateStr
            });
            setReminders(response || []);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            setReminders([]);
        }
    };

    const handlePrevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        onDateChange(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        onDateChange(newDate);
    };

    const handleTimeSlotClick = (hour) => {
        const clickedDateTime = new Date(currentDate);
        clickedDateTime.setHours(hour, 0, 0, 0);

        const dateStr = formatDateForAPI(clickedDateTime);
        const timeStr = clickedDateTime.toTimeString().slice(0, 5);

        navigate(`/calendar-form?date=${dateStr}&time=${timeStr}&view=day`);
    };

    const getAppointmentsForHour = (hour) => {
        return appointments.filter(apt => {
            const startHour = parseInt(apt.start_time.split(':')[0]);
            const duration = parseFloat(apt.duration_hour) || 1;
            const endHour = startHour + duration;

            return hour >= startHour && hour < endHour;
        });
    };

    const getRemindersForHour = (hour) => {
        return reminders.filter(reminder => {
            if (!reminder.reminder_time) return hour === 0; // Show at midnight if no time

            const startHour = parseInt(reminder.reminder_time.split(':')[0]);
            return hour === startHour;
        });
    };

    const getAppointmentHeight = (appointment) => {
        const duration = parseFloat(appointment.duration_hour) || 1;
        if (duration <= 0.5) return '50%';
        return '100%';
    };

    const handleAppointmentClick = (appointment, e) => {
        e.stopPropagation();
        setSelectedAppointment(appointment);
    };

    const dayName = currentDate.toLocaleDateString('en-US', {weekday: 'long'});

    return (
        <div className="day-view">
            <div className="day-navigation">
                <div className="view-buttons">
                    <button onClick={() => navigate('/calendar?view=month')} className="view-btn">
                        Month
                    </button>
                    <button onClick={() => navigate('/calendar?view=week')} className="view-btn">
                        Week
                    </button>
                    <button className="view-btn active">
                        Day
                    </button>
                </div>
                <div className="day-navigation-center">
                    <button onClick={handlePrevDay} className="nav-arrow">
                        ←
                    </button>
                    <h2>
                        {dayName}, {currentDate.toLocaleDateString()}
                    </h2>
                    <button onClick={handleNextDay} className="nav-arrow">
                        →
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading appointments...</div>
            ) : (
                <div className="day-grid-container">
                    <div className="day-grid">
                        <div className="time-column">
                            {hours.map((hour) => (
                                <div
                                    key={hour.value}
                                    className={`time-slot ${!isBusinessHour(hour.value) ? 'non-business' : ''}`}
                                >
                                    {hour.display}
                                </div>
                            ))}
                        </div>

                        <div className="schedule-column">
                            {hours.map((hour) => {
                                const hourAppointments = getAppointmentsForHour(hour.value);
                                const hourReminders = getRemindersForHour(hour.value);

                                return (
                                    <div
                                        key={hour.value}
                                        className={`hour-slot ${!isBusinessHour(hour.value) ? 'non-business' : ''}`}
                                        onClick={() => handleTimeSlotClick(hour.value)}
                                    >
                                        {hourAppointments.map((appointment) => (
                                            <div
                                                key={appointment.calendar_id}
                                                className="day-appointment-box"
                                                style={{height: getAppointmentHeight(appointment)}}
                                                onClick={(e) => handleAppointmentClick(appointment, e)}
                                            >
                                                <div className="day-appointment-content">
                                                    <div className="day-appointment-details">
                                                        <div className="day-appointment-header">
                                                            <div className="day-appointment-time">
                                                                {formatTimeDisplay(appointment.start_time)}
                                                            </div>
                                                            <div className="day-appointment-type">
                                                                {appointment.calendar_type}
                                                            </div>
                                                        </div>
                                                        <div className="day-appointment-company">
                                                            {appointment.company}
                                                        </div>
                                                        {appointment.calendar_desc && (
                                                            <div className="day-appointment-desc">
                                                                {appointment.calendar_desc}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {appointment.outcome_score &&
                                                        <span className="day-score-indicator"></span>}
                                                </div>
                                            </div>
                                        ))}
                                        {hourReminders.map((reminder) => (
                                            <div
                                                key={`reminder-${reminder.reminder_id}`}
                                                className="day-reminder-box"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onReminderClick) onReminderClick(reminder);
                                                }}
                                            >
                                                <div className="day-reminder-header">
                                                    <div className="day-reminder-time">
                                                        {reminder.reminder_time ? formatTimeDisplay(reminder.reminder_time) : ''}
                                                    </div>
                                                    <span className="day-reminder-icon">⏰</span>
                                                </div>
                                                <div className="day-reminder-message">
                                                    {reminder.reminder_message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {selectedAppointment && (
                <AppointmentModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onEdit={(appointment) => {
                        navigate(`/calendar-form/${appointment.calendar_id}?view=day&date=${appointment.start_date}`);
                    }}
                    onDelete={(deletedId) => {
                        // Remove the deleted appointment from state
                        setAppointments(appointments.filter(apt => apt.calendar_id !== deletedId));
                        setSelectedAppointment(null);
                    }}
                />
            )}
        </div>
    );
};

export default DayView;