import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import apiService from '../../services/api';
import {getWeekStart, formatDateForAPI, formatTimeDisplay, getHours, isBusinessHour} from '../../utils/calendarUtils';
import AppointmentModal from './AppointmentModal';
import './WeekView.css';

const WeekView = ({currentDate, onDateChange, onReminderClick}) => {
    const [appointments, setAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const navigate = useNavigate();

    const weekStart = getWeekStart(currentDate);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        weekDays.push(day);
    }

    const hours = getHours();

    useEffect(() => {
        fetchAppointments();
        fetchReminders();
    }, [currentDate]);

    // Auto-scroll to 8am on component mount and when date changes
    useEffect(() => {
        const scrollToEightAM = () => {
            const gridContainer = document.querySelector('.week-grid-scrollable');
            if (gridContainer) {
                // Each hour slot is 60px, 8am is index 8 (0-based from midnight)
                const eightAMPosition = 8 * 60;
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
            const weekStartStr = formatDateForAPI(weekStart);
            const response = await apiService.getCalendarWeek(weekStartStr);
            setAppointments(response || []);
        } catch (error) {
            console.error('Error fetching week appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReminders = async () => {
        try {
            const startDate = formatDateForAPI(weekStart);
            const response = await apiService.getReminderList({
                duration: 'week',
                start_date: startDate
            });
            setReminders(response || []);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            setReminders([]);
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        onDateChange(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        onDateChange(newDate);
    };

    const handleTimeSlotClick = (day, hour) => {
        const clickedDateTime = new Date(day);
        clickedDateTime.setHours(hour, 0, 0, 0);

        const dateStr = formatDateForAPI(clickedDateTime);
        const timeStr = clickedDateTime.toTimeString().slice(0, 5);

        navigate(`/calendar-form?date=${dateStr}&time=${timeStr}&view=week`);
    };

    const getAppointmentsForSlot = (date, hour) => {
        const dateStr = formatDateForAPI(date);
        return appointments.filter(apt => {
            if (apt.start_date !== dateStr) return false;

            const startHour = parseInt(apt.start_time.split(':')[0]);
            const duration = parseFloat(apt.duration_hour) || 1;
            const endHour = startHour + duration;

            return hour >= startHour && hour < endHour;
        });
    };

    const getRemindersForSlot = (date, hour) => {
        const dateStr = formatDateForAPI(date);
        return reminders.filter(reminder => {
            if (reminder.reminder_date !== dateStr) return false;
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

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="week-view">
            <div className="week-navigation">
                <div className="view-buttons">
                    <button onClick={() => navigate('/calendar?view=month')} className="view-btn">
                        Month
                    </button>
                    <button className="view-btn active">
                        Week
                    </button>
                    <button onClick={() => navigate('/calendar?view=day')} className="view-btn">
                        Day
                    </button>
                </div>
                <div className="week-navigation-center">
                    <button onClick={handlePrevWeek} className="nav-arrow">
                        ←
                    </button>
                    <h2>
                        {weekStart.toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                    </h2>
                    <button onClick={handleNextWeek} className="nav-arrow">
                        →
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading appointments...</div>
            ) : (
                <div className="week-grid-container">
                    {/* Fixed header row with day names */}
                    <div className="week-header-fixed">
                        <div className="time-header-fixed"></div>
                        {weekDays.map((day, dayIndex) => (
                            <div key={dayIndex} className="day-header-fixed">
                                <div className="week-day-name">{dayNames[day.getDay()]}</div>
                                <div className="week-day-date">{day.getDate()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable content */}
                    <div className="week-grid-scrollable">
                        <div className="week-grid">
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

                            {weekDays.map((day, dayIndex) => (
                                <div key={dayIndex} className="day-column">
                                    {hours.map((hour) => {
                                        const slotAppointments = getAppointmentsForSlot(day, hour.value);
                                        const slotReminders = getRemindersForSlot(day, hour.value);

                                        return (
                                            <div
                                                key={hour.value}
                                                className={`hour-slot ${!isBusinessHour(hour.value) ? 'non-business' : ''}`}
                                                onClick={() => handleTimeSlotClick(day, hour.value)}
                                            >
                                                {slotAppointments.map((appointment) => (
                                                    <div
                                                        key={appointment.calendar_id}
                                                        className="week-appointment-box"
                                                        style={{height: getAppointmentHeight(appointment)}}
                                                        onClick={(e) => handleAppointmentClick(appointment, e)}
                                                    >
                                                        <div className="week-appointment-content">
                                                            <div>
                                                                <div className="week-appointment-time">
                                                                    {formatTimeDisplay(appointment.start_time)}
                                                                </div>
                                                                <div className="week-appointment-type">
                                                                    {appointment.calendar_type}
                                                                </div>
                                                                <div className="week-appointment-company">
                                                                    {appointment.company}
                                                                </div>
                                                            </div>
                                                            {appointment.outcome_score &&
                                                                <span className="week-score-indicator"></span>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {slotReminders.map((reminder) => (
                                                    <div
                                                        key={`reminder-${reminder.reminder_id}`}
                                                        className="week-reminder-box"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onReminderClick) onReminderClick(reminder);
                                                        }}
                                                    >
                                                        <div className="week-reminder-time">
                                                            {reminder.reminder_time ? formatTimeDisplay(reminder.reminder_time) : ''}
                                                        </div>
                                                        <div className="week-reminder-message">
                                                            {reminder.reminder_message}
                                                        </div>
                                                        <span className="week-reminder-icon">⏰</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedAppointment && (
                <AppointmentModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onEdit={(appointment) => {
                        navigate(`/calendar-form/${appointment.calendar_id}?view=week&date=${appointment.start_date}`);
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

export default WeekView;