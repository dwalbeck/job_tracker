import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const ReminderContext = createContext();

export const useReminder = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminder must be used within a ReminderProvider');
  }
  return context;
};

export const ReminderProvider = ({ children }) => {
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch today's reminders
  const fetchTodayReminders = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const response = await apiService.getReminderList({
        duration: 'day',
        start_date: today
      });

      setReminders(response || []);
    } catch (error) {
      console.error('Error fetching today\'s reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for due reminders
  const checkDueReminders = useCallback(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

    // Find the first reminder that is due and not dismissed
    const dueReminder = reminders.find(reminder => {
      if (!reminder.reminder_time) {
        // If no time specified, show at beginning of day (already past)
        return true;
      }

      const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
      const reminderTime = hours * 60 + minutes;

      // Reminder is due if current time is >= reminder time
      return currentTime >= reminderTime;
    });

    if (dueReminder && !activeReminder) {
      setActiveReminder(dueReminder);
    }
  }, [reminders, activeReminder]);

  // Remove reminder from memory after dismissal
  const dismissReminder = useCallback((reminderId) => {
    setReminders(prev => prev.filter(r => r.reminder_id !== reminderId));
    setActiveReminder(null);
  }, []);

  // Fetch reminders on mount
  useEffect(() => {
    fetchTodayReminders();
  }, [fetchTodayReminders]);

  // Check for due reminders every minute
  useEffect(() => {
    // Check immediately
    checkDueReminders();

    // Then check every minute
    const intervalId = setInterval(checkDueReminders, 60000);

    return () => clearInterval(intervalId);
  }, [checkDueReminders]);

  const value = {
    reminders,
    activeReminder,
    loading,
    fetchTodayReminders,
    checkDueReminders,
    dismissReminder
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
