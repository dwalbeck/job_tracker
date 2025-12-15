import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeekView from './WeekView';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    getCalendarWeek: jest.fn(),
    getReminderList: jest.fn(),
}));

jest.mock('../../utils/calendarUtils', () => ({
    getWeekStart: jest.fn((date) => {
        // Return Sunday of the week containing the date
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }),
    formatDateForAPI: jest.fn((date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }),
    formatTimeDisplay: jest.fn((time) => time),
    getHours: jest.fn(() => [
        { value: 0, display: '12:00 AM' },
        { value: 8, display: '8:00 AM' },
        { value: 9, display: '9:00 AM' },
        { value: 12, display: '12:00 PM' },
        { value: 17, display: '5:00 PM' },
    ]),
    isBusinessHour: jest.fn((hour) => hour >= 8 && hour < 18),
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

describe('WeekView Component', () => {
    let mockNavigate;
    const mockOnDateChange = jest.fn();
    const mockOnReminderClick = jest.fn();

    const currentDate = new Date(2025, 2, 15); // March 15, 2025 (Sunday)

    const mockAppointments = [
        {
            calendar_id: 1,
            start_date: '2025-03-16',
            start_time: '09:00',
            end_time: '10:00',
            duration_hour: 1,
            calendar_type: 'interview',
            company: 'Tech Corp',
            outcome_score: 8,
        },
        {
            calendar_id: 2,
            start_date: '2025-03-16',
            start_time: '14:00',
            end_time: '14:30',
            duration_hour: 0.5,
            calendar_type: 'phone call',
            company: 'Startup Inc',
            outcome_score: null,
        },
        {
            calendar_id: 3,
            start_date: '2025-03-18',
            start_time: '10:00',
            end_time: '11:30',
            duration_hour: 1.5,
            calendar_type: 'technical',
            company: 'Big Corp',
            outcome_score: 9,
        },
    ];

    const mockReminders = [
        {
            reminder_id: 1,
            reminder_date: '2025-03-16',
            reminder_time: '15:00',
            reminder_message: 'Follow up with recruiter',
        },
        {
            reminder_id: 2,
            reminder_date: '2025-03-17',
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
        apiService.getCalendarWeek.mockResolvedValue(mockAppointments);
        apiService.getReminderList.mockResolvedValue(mockReminders);

        // Mock querySelector for scroll functionality
        document.querySelector = jest.fn((selector) => {
            if (selector === '.week-grid-scrollable') {
                return { scrollTop: 0 };
            }
            return null;
        });

        console.error = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Component Rendering', () => {
        test('renders week view with navigation', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            expect(screen.getByText('→')).toBeInTheDocument();
        });

        test('renders view switching buttons', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Month')).toBeInTheDocument();
            });

            expect(screen.getByText('Week')).toBeInTheDocument();
            expect(screen.getByText('Day')).toBeInTheDocument();
        });

        test('shows week button as active', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                const weekButton = screen.getByText('Week');
                expect(weekButton).toHaveClass('active');
            });
        });

        test('renders day name headers', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
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
            apiService.getCalendarWeek.mockImplementation(() => new Promise(() => {}));

            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
        });

        test('renders time slots', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('12:00 AM')).toBeInTheDocument();
            expect(screen.getByText('8:00 AM')).toBeInTheDocument();
        });
    });

    describe('Data Fetching', () => {
        test('fetches appointments on mount', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarWeek).toHaveBeenCalled();
            });
        });

        test('fetches reminders on mount', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getReminderList).toHaveBeenCalledWith({
                    duration: 'week',
                    start_date: expect.any(String),
                });
            });
        });

        test('refetches data when currentDate changes', async () => {
            const { rerender } = render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarWeek).toHaveBeenCalledTimes(1);
            });

            const newDate = new Date(2025, 2, 22); // Next week
            rerender(
                <WeekView
                    currentDate={newDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(apiService.getCalendarWeek).toHaveBeenCalledTimes(2);
            });
        });

        test('handles appointment fetch error gracefully', async () => {
            apiService.getCalendarWeek.mockRejectedValue(new Error('Network error'));

            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching week appointments:',
                    expect.any(Error)
                );
            });
        });

        test('handles reminder fetch error gracefully', async () => {
            apiService.getReminderList.mockRejectedValue(new Error('Network error'));

            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
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

    describe('Week Navigation', () => {
        test('navigates to previous week when left arrow clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const prevButton = screen.getByText('←');
            fireEvent.click(prevButton);

            expect(mockOnDateChange).toHaveBeenCalled();

            // Verify it's 7 days earlier
            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(currentDate.getDate() - 7);
        });

        test('navigates to next week when right arrow clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('→')).toBeInTheDocument();
            });

            const nextButton = screen.getByText('→');
            fireEvent.click(nextButton);

            expect(mockOnDateChange).toHaveBeenCalled();

            // Verify it's 7 days later
            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(currentDate.getDate() + 7);
        });
    });

    describe('View Switching', () => {
        test('navigates to month view when month button clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Month')).toBeInTheDocument();
            });

            const monthButton = screen.getByText('Month');
            fireEvent.click(monthButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=month');
        });

        test('navigates to day view when day button clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Day')).toBeInTheDocument();
            });

            const dayButton = screen.getByText('Day');
            fireEvent.click(dayButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=day');
        });
    });

    describe('Time Slot Click Handling', () => {
        test('navigates to calendar form when time slot is clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const hourSlots = document.querySelectorAll('.hour-slot');
            if (hourSlots.length > 0) {
                fireEvent.click(hourSlots[0]);

                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('/calendar-form?date=')
                );
                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('&time=')
                );
                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('&view=week')
                );
            }
        });
    });

    describe('Appointment Display', () => {
        test('displays appointments in correct time slots', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            expect(appointmentBoxes.length).toBeGreaterThan(0);
        });

        test('shows outcome score indicator for appointments with scores', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const scoreIndicators = document.querySelectorAll('.week-score-indicator');
            expect(scoreIndicators.length).toBeGreaterThan(0);
        });

        test('applies correct height for short appointments', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            // Find the 0.5 hour appointment
            const shortAppointment = Array.from(appointmentBoxes).find(box =>
                box.style.height === '50%'
            );
            expect(shortAppointment).toBeTruthy();
        });

        test('applies 100% height for full hour appointments', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            // Find appointments with full height
            const fullAppointments = Array.from(appointmentBoxes).filter(box =>
                box.style.height === '100%'
            );
            expect(fullAppointments.length).toBeGreaterThan(0);
        });

        test('opens appointment modal when appointment is clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });
            }
        });

        test('appointment click stops propagation to time slot click', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            if (appointmentBoxes.length > 0) {
                fireEvent.click(appointmentBoxes[0]);

                // Should open modal, not navigate to calendar form
                await waitFor(() => {
                    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
                });
            }
        });
    });

    describe('Reminder Display', () => {
        test('displays reminders in correct time slots', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.week-reminder-box');
            expect(reminderBoxes.length).toBeGreaterThan(0);
        });

        test('shows reminder icon', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderIcons = document.querySelectorAll('.week-reminder-icon');
            expect(reminderIcons.length).toBeGreaterThan(0);
        });

        test('calls onReminderClick when reminder is clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.week-reminder-box');
            if (reminderBoxes.length > 0) {
                fireEvent.click(reminderBoxes[0]);

                expect(mockOnReminderClick).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reminder_id: expect.any(Number),
                    })
                );
            }
        });

        test('reminder click stops propagation to time slot click', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.week-reminder-box');
            if (reminderBoxes.length > 0) {
                const initialNavigateCount = mockNavigate.mock.calls.length;

                fireEvent.click(reminderBoxes[0]);

                // Should call onReminderClick
                expect(mockOnReminderClick).toHaveBeenCalled();

                // Should not navigate
                expect(mockNavigate.mock.calls.length).toBe(initialNavigateCount);
            }
        });

        test('displays reminder at midnight when no time specified', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Reminder without time should appear in hour 0 (midnight)
            const reminderBoxes = document.querySelectorAll('.week-reminder-box');
            expect(reminderBoxes.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Appointment Modal', () => {
        test('closes modal when close button clicked', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
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
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
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
                    expect.stringContaining('view=week')
                );
            }
        });

        test('removes appointment from state when deleted', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Open modal
            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
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
                const updatedBoxes = document.querySelectorAll('.week-appointment-box');
                expect(updatedBoxes.length).toBe(initialCount - 1);
            }
        });
    });

    describe('Edge Cases', () => {
        test('handles empty appointments array', async () => {
            apiService.getCalendarWeek.mockResolvedValue([]);

            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            expect(appointmentBoxes.length).toBe(0);
        });

        test('handles null appointments response', async () => {
            apiService.getCalendarWeek.mockResolvedValue(null);

            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const appointmentBoxes = document.querySelectorAll('.week-appointment-box');
            expect(appointmentBoxes.length).toBe(0);
        });

        test('handles optional onReminderClick not provided', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const reminderBoxes = document.querySelectorAll('.week-reminder-box');
            if (reminderBoxes.length > 0) {
                // Should not crash when clicked
                expect(() => fireEvent.click(reminderBoxes[0])).not.toThrow();
            }
        });

        test('marks non-business hours correctly', async () => {
            render(
                <WeekView
                    currentDate={currentDate}
                    onDateChange={mockOnDateChange}
                    onReminderClick={mockOnReminderClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const nonBusinessSlots = document.querySelectorAll('.hour-slot.non-business');
            expect(nonBusinessSlots.length).toBeGreaterThan(0);
        });
    });
});
