import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthView from './MonthView';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    getCalendarMonth: jest.fn(),
    getReminderList: jest.fn(),
}));

jest.mock('../../utils/calendarUtils', () => ({
    getMonthCalendarDays: jest.fn((date) => {
        // Return a simplified calendar grid for testing
        const days = [];
        for (let i = 1; i <= 35; i++) {
            days.push({
                date: new Date(2025, 2, i - 5), // March 2025
                isCurrentMonth: i > 5 && i <= 36,
                isToday: i === 20,
            });
        }
        return days;
    }),
    formatMonthForAPI: jest.fn(() => '2025-03'),
    formatTimeDisplay: jest.fn((time) => time),
}));

jest.mock('./AppointmentModal', () => {
    return function MockAppointmentModal({ appointment, onClose, onEdit, onDelete }) {
        if (!appointment) return null;
        return (
            <div data-testid="appointment-modal">
                <div>Appointment: {appointment.calendar_id}</div>
                <button onClick={onClose}>Close</button>
                <button onClick={() => onEdit(appointment)}>Edit</button>
                <button onClick={() => onDelete(appointment.calendar_id)}>Delete</button>
            </div>
        );
    };
});

// Mock console
const originalConsoleError = console.error;

describe('MonthView Component', () => {
    let mockNavigate;
    const mockOnDateChange = jest.fn();
    const mockOnViewChange = jest.fn();
    const mockOnReminderClick = jest.fn();

    const currentDate = new Date(2025, 2, 15); // March 15, 2025

    const mockAppointments = [
        {
            calendar_id: 1,
            start_date: '2025-03-10',
            start_time: '10:00',
            calendar_type: 'interview',
            outcome_score: 8,
        },
        {
            calendar_id: 2,
            start_date: '2025-03-10',
            start_time: '14:00',
            calendar_type: 'phone call',
            outcome_score: null,
        },
        {
            calendar_id: 3,
            start_date: '2025-03-20',
            start_time: '09:00',
            calendar_type: 'technical',
            outcome_score: 9,
        },
    ];

    const mockReminders = [
        {
            reminder_id: 1,
            reminder_date: '2025-03-10',
            reminder_time: '15:00',
            reminder_message: 'Follow up with recruiter',
        },
        {
            reminder_id: 2,
            reminder_date: '2025-03-15',
            reminder_time: null,
            reminder_message: 'Send thank you email',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Default API mocks
        apiService.getCalendarMonth.mockResolvedValue(mockAppointments);
        apiService.getReminderList.mockResolvedValue(mockReminders);

        console.error = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Component Rendering', () => {
        test('renders month view with navigation', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('March 2025')).toBeInTheDocument();
            });

            expect(screen.getByText('←')).toBeInTheDocument();
            expect(screen.getByText('→')).toBeInTheDocument();
        });

        test('renders view switching buttons', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Month')).toBeInTheDocument();
            });

            expect(screen.getByText('Week')).toBeInTheDocument();
            expect(screen.getByText('Day')).toBeInTheDocument();
        });

        test('shows month button as active', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                const monthButton = screen.getByText('Month');
                expect(monthButton).toHaveClass('active');
            });
        });

        test('renders day headers', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Sun')).toBeInTheDocument();
            });

            expect(screen.getByText('Mon')).toBeInTheDocument();
            expect(screen.getByText('Tue')).toBeInTheDocument();
            expect(screen.getByText('Wed')).toBeInTheDocument();
            expect(screen.getByText('Thu')).toBeInTheDocument();
            expect(screen.getByText('Fri')).toBeInTheDocument();
            expect(screen.getByText('Sat')).toBeInTheDocument();
        });

        test('shows loading state initially', () => {
            apiService.getCalendarMonth.mockImplementation(() => new Promise(() => {}));

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
        });

        test('renders calendar grid after loading', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const calendarDays = document.querySelectorAll('.calendar-day');
            expect(calendarDays.length).toBeGreaterThan(0);
        });
    });

    describe('Data Fetching', () => {
        test('fetches appointments on mount', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarMonth).toHaveBeenCalledWith('2025-03');
            });
        });

        test('fetches reminders on mount', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getReminderList).toHaveBeenCalledWith({
                    duration: 'month',
                    start_date: expect.stringContaining('2025-03-01'),
                });
            });
        });

        test('refetches data when currentDate changes', async () => {
            const { rerender } = render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarMonth).toHaveBeenCalledTimes(1);
            });

            const newDate = new Date(2025, 3, 15); // April 2025
            rerender(
                <MonthView
                    currentDate={newDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarMonth).toHaveBeenCalledTimes(2);
            });
        });

        test('handles appointment fetch error gracefully', async () => {
            apiService.getCalendarMonth.mockRejectedValue(new Error('Network error'));

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching month appointments:',
                    expect.any(Error)
                );
            });
        });

        test('handles reminder fetch error gracefully', async () => {
            apiService.getReminderList.mockRejectedValue(new Error('Network error'));

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching reminders:',
                    expect.any(Error)
                );
            });
        });
    });

    describe('Month Navigation', () => {
        test('navigates to previous month when left arrow clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('March 2025')).toBeInTheDocument();
            });

            const prevButton = screen.getAllByText('←')[0];
            fireEvent.click(prevButton);

            expect(mockOnDateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    getMonth: expect.any(Function),
                })
            );

            // Verify it's February
            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getMonth()).toBe(1); // February
            expect(calledDate.getFullYear()).toBe(2025);
        });

        test('navigates to next month when right arrow clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('March 2025')).toBeInTheDocument();
            });

            const nextButton = screen.getAllByText('→')[0];
            fireEvent.click(nextButton);

            expect(mockOnDateChange).toHaveBeenCalled();

            // Verify it's April
            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getMonth()).toBe(3); // April
            expect(calledDate.getFullYear()).toBe(2025);
        });

        test('handles year rollover when navigating backward', async () => {
            const januaryDate = new Date(2025, 0, 15); // January 2025

            render(
                <MonthView
                    currentDate={januaryDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarMonth).toHaveBeenCalled();
            });

            const prevButton = screen.getAllByText('←')[0];
            fireEvent.click(prevButton);

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getMonth()).toBe(11); // December
            expect(calledDate.getFullYear()).toBe(2024);
        });

        test('handles year rollover when navigating forward', async () => {
            const decemberDate = new Date(2025, 11, 15); // December 2025

            render(
                <MonthView
                    currentDate={decemberDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarMonth).toHaveBeenCalled();
            });

            const nextButton = screen.getAllByText('→')[0];
            fireEvent.click(nextButton);

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getMonth()).toBe(0); // January
            expect(calledDate.getFullYear()).toBe(2026);
        });
    });

    describe('View Switching', () => {
        test('calls onViewChange with week when week button clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Week')).toBeInTheDocument();
            });

            const weekButton = screen.getByText('Week');
            fireEvent.click(weekButton);

            expect(mockOnViewChange).toHaveBeenCalledWith('week');
        });

        test('calls onViewChange with day when day button clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Day')).toBeInTheDocument();
            });

            const dayButton = screen.getByText('Day');
            fireEvent.click(dayButton);

            expect(mockOnViewChange).toHaveBeenCalledWith('day');
        });

        test('calls onViewChange with month when month button clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Month')).toBeInTheDocument();
            });

            const monthButton = screen.getByText('Month');
            fireEvent.click(monthButton);

            expect(mockOnViewChange).toHaveBeenCalledWith('month');
        });
    });

    describe('Day Click Handling', () => {
        test('navigates to calendar form when current month day is clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Find a day in the current month and click it
            const currentMonthDays = document.querySelectorAll('.calendar-day:not(.other-month)');
            if (currentMonthDays.length > 0) {
                fireEvent.click(currentMonthDays[0]);

                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('/calendar-form?date=')
                );
                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('&view=month')
                );
            }
        });

        test('does not navigate when other month day is clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const otherMonthDays = document.querySelectorAll('.calendar-day.other-month');
            if (otherMonthDays.length > 0) {
                fireEvent.click(otherMonthDays[0]);

                expect(mockNavigate).not.toHaveBeenCalled();
            }
        });

        test('calls onDateChange when current month day is clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const currentMonthDays = document.querySelectorAll('.calendar-day:not(.other-month)');
            if (currentMonthDays.length > 0) {
                fireEvent.click(currentMonthDays[0]);

                expect(mockOnDateChange).toHaveBeenCalled();
            }
        });
    });

    describe('Appointment Display', () => {
        test('displays appointments on correct dates', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Appointments should be rendered
            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            expect(appointmentBoxes.length).toBeGreaterThan(0);
        });

        test('shows outcome score indicator for appointments with scores', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const scoreIndicators = document.querySelectorAll('.month-score-indicator');
            expect(scoreIndicators.length).toBeGreaterThan(0);
        });

        test('opens appointment modal when appointment is clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });
            }
        });

        test('appointment click stops propagation to day click', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                // Should open modal, not navigate to calendar form
                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });

                // Check navigate was NOT called for calendar form
                const navigateCalls = mockNavigate.mock.calls;
                const calendarFormCalls = navigateCalls.filter(call =>
                    call[0].includes('/calendar-form')
                );
                expect(calendarFormCalls.length).toBe(0);
            }
        });
    });

    describe('Reminder Display', () => {
        test('displays reminders on correct dates', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.month-reminder-box');
            expect(reminderBoxes.length).toBeGreaterThan(0);
        });

        test('shows reminder icon', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderIcons = document.querySelectorAll('.reminder-icon');
            expect(reminderIcons.length).toBeGreaterThan(0);
        });

        test('calls onReminderClick when reminder is clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.month-reminder-box');
            if (reminderBoxes.length > 0) {
                fireEvent.click(reminderBoxes[0]);

                expect(mockOnReminderClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reminder_id: expect.any(Number),
                    })
                );
            }
        });

        test('reminder click stops propagation to day click', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.month-reminder-box');
            if (reminderBoxes.length > 0) {
                fireEvent.click(reminderBoxes[0]);

                // Should call onReminderClick, not navigate
                expect(mockOnReminderClick).toHaveBeenCalled();

                // Should not navigate to calendar form
                const navigateCalls = mockNavigate.mock.calls;
                const calendarFormCalls = navigateCalls.filter(call =>
                    call[0].includes('/calendar-form')
                );
                expect(calendarFormCalls.length).toBe(0);
            }
        });
    });

    describe('Appointment Modal', () => {
        test('closes modal when close button clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });

                // Close modal
                const closeButton = screen.getByText('Close');
                fireEvent.click(closeButton);

                await waitFor(() => {
                    expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
                });
            }
        });

        test('navigates to calendar form when edit button clicked', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });

                // Click edit
                const editButton = screen.getByText('Edit');
                fireEvent.click(editButton);

                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('/calendar-form/')
                );
                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('view=month')
                );
            }
        });

        test('removes appointment from state when deleted', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            const initialCount = appointmentBoxes.length;

            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });

                // Delete appointment
                const deleteButton = screen.getByText('Delete');
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
                });

                // Check appointment count decreased
                const updatedBoxes = document.querySelectorAll('.month-appointment-box');
                expect(updatedBoxes.length).toBe(initialCount - 1);
            }
        });
    });

    describe('Edge Cases', () => {
        test('handles empty appointments array', async () => {
            apiService.getCalendarMonth.mockResolvedValue([]);

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            expect(appointmentBoxes.length).toBe(0);
        });

        test('handles null appointments response', async () => {
            apiService.getCalendarMonth.mockResolvedValue(null);

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.month-appointment-box');
            expect(appointmentBoxes.length).toBe(0);
        });

        test('handles null reminders response', async () => {
            apiService.getReminderList.mockResolvedValue(null);

            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.month-reminder-box');
            expect(reminderBoxes.length).toBe(0);
        });

        test('handles optional onReminderClick not provided', async () => {
            render(
                <MonthView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onViewChange={mockOnViewChange}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.month-reminder-box');
            if (reminderBoxes.length > 0) {
                // Should not crash when clicked
                expect(() => fireEvent.click(reminderBoxes[0])).not.toThrow();
            }
        });
    });
});
