import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { getMonthCalendarDays, formatMonthForAPI, formatTimeDisplay } from '../../utils/calendarUtils';
import AppointmentModal from './AppointmentModal';
import './MonthView.css';

const MonthView = ({ currentDate, onDateChange, onViewChange, onReminderClick }) => {
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    fetchReminders();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const monthStr = formatMonthForAPI(currentDate);
      const response = await apiService.getCalendarMonth(monthStr);
      setAppointments(response || []);
    } catch (error) {
      console.error('Error fetching month appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      // Get first day of the month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDate = firstDay.toISOString().split('T')[0];

      const response = await apiService.getReminderList({
        duration: 'month',
        start_date: startDate
      });
      setReminders(response || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminders([]);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleDayClick = (day) => {
    if (!day.isCurrentMonth) return;

    const clickedDate = new Date(day.date);
    onDateChange(clickedDate);
    navigate(`/calendar-form?date=${clickedDate.toISOString().split('T')[0]}&view=month`);
  };

  const getAppointmentsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.start_date === dateStr);
  };

  const getRemindersForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reminders.filter(reminder => reminder.reminder_date === dateStr);
  };

  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation();
    setSelectedAppointment(appointment);
  };

  const isAppointmentInPast = (appointment) => {
    const appointmentDate = new Date(appointment.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < today;
  };

  const calendarDays = getMonthCalendarDays(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="month-view">
      <div className="month-navigation">
        <div className="view-buttons">
          <button onClick={() => onViewChange('month')} className="view-btn active">
            Month
          </button>
          <button onClick={() => onViewChange('week')} className="view-btn">
            Week
          </button>
          <button onClick={() => onViewChange('day')} className="view-btn">
            Day
          </button>
        </div>
        <div className="month-navigation-center">
          <button onClick={handlePrevMonth} className="nav-arrow">
            ←
          </button>
          <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={handleNextMonth} className="nav-arrow">
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="month-loading">Loading appointments...</div>
      ) : (
        <div className="calendar-grid">
          <div className="calendar-header-row">
            <div className="day-header">Sun</div>
            <div className="day-header">Mon</div>
            <div className="day-header">Tue</div>
            <div className="day-header">Wed</div>
            <div className="day-header">Thu</div>
            <div className="day-header">Fri</div>
            <div className="day-header">Sat</div>
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day.date);
              const dayReminders = getRemindersForDay(day.date);

              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="day-number">
                    {day.date.getDate()}
                  </div>
                  <div className="day-appointments">
                    {dayAppointments.map((appointment) => (
                      <div
                        key={appointment.calendar_id}
                        className={`month-appointment-box ${isAppointmentInPast(appointment) ? 'past' : ''}`}
                        onClick={(e) => handleAppointmentClick(appointment, e)}
                      >
                        <span className="month-appointment-text">
                          {formatTimeDisplay(appointment.start_time)} {appointment.calendar_type}
                        </span>
                        {appointment.outcome_score && <span className="month-score-indicator"></span>}
                      </div>
                    ))}
                    {dayReminders.map((reminder) => (
                      <div
                        key={`reminder-${reminder.reminder_id}`}
                        className="month-reminder-box"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onReminderClick) onReminderClick(reminder);
                        }}
                      >
                        <span className="month-reminder-text">
                          {reminder.reminder_time ? formatTimeDisplay(reminder.reminder_time) : ''} {reminder.reminder_message}
                        </span>
                        <span className="reminder-icon">⏰</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={(appointment) => {
            navigate(`/calendar-form/${appointment.calendar_id}?view=month&date=${appointment.start_date}`);
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

export default MonthView;