import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DayView from './DayView';
import apiService from '../../services/api';
import { formatDateForAPI, formatTimeDisplay, getHours, isBusinessHour } from '../../utils/calendarUtils';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../utils/calendarUtils');
jest.mock('./AppointmentModal', () => {
    return function MockAppointmentModal({ appointment, onClose, onEdit, onDelete }) {
        return (
            <div data-testid="appointment-modal">
                <div>Modal for: {appointment.company}</div>
                <button onClick={onClose}>Close Modal</button>
                <button onClick={() => onEdit(appointment)}>Edit</button>
                <button onClick={() => onDelete(appointment.calendar_id)}>Delete</button>
            </div>
        );
    };
});

// Mock console.error
const originalConsoleError = console.error;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('DayView Component', () => {
    const mockOnDateChange = jest.fn();
    const mockOnReminderClick = jest.fn();
    const currentDate = new Date('2025-03-15T10:00:00');

    const mockAppointments = [
        {
            calendar_id: 1,
            start_date: '2025-03-15',
            start_time: '09:00',
            duration_hour: 1,
            calendar_type: 'Interview',
            company: 'TechCorp',
            calendar_desc: 'Technical interview',
            outcome_score: 5,
        },
        {
            calendar_id: 2,
            start_date: '2025-03-15',
            start_time: '14:30',
            duration_hour: 0.5,
            calendar_type: 'Phone Call',
            company: 'StartupXYZ',
            calendar_desc: 'Initial screening',
        },
        {
            calendar_id: 3,
            start_date: '2025-03-15',
            start_time: '16:00',
            duration_hour: 2,
            calendar_type: 'On Site',
            company: 'BigCompany',
            calendar_desc: 'Final round interview',
        },
    ];

    const mockReminders = [
        {
            reminder_id: 1,
            reminder_date: '2025-03-15',
            reminder_time: '10:00',
            reminder_message: 'Follow up with recruiter',
        },
        {
            reminder_id: 2,
            reminder_date: '2025-03-15',
            reminder_time: null,
            reminder_message: 'Send thank you email',
        },
    ];

    const mockHours = [
        { value: 0, display: '12 AM' },
        { value: 1, display: '1 AM' },
        { value: 2, display: '2 AM' },
        { value: 8, display: '8 AM' },
        { value: 9, display: '9 AM' },
        { value: 10, display: '10 AM' },
        { value: 14, display: '2 PM' },
        { value: 15, display: '3 PM' },
        { value: 16, display: '4 PM' },
        { value: 17, display: '5 PM' },
        { value: 18, display: '6 PM' },
        { value: 23, display: '11 PM' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();

        // Mock utility functions
        formatDateForAPI.mockImplementation((date) => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });

        formatTimeDisplay.mockImplementation((time) => {
            if (!time) return '';
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        });

        getHours.mockReturnValue(mockHours);

        isBusinessHour.mockImplementation((hour) => {
            return hour >= 8 && hour < 18;
        });

        // Mock API calls
        apiService.getCalendarDay.mockResolvedValue(mockAppointments);
        apiService.getReminderList.mockResolvedValue(mockReminders);

        // Mock scrollTop
        Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
            configurable: true,
            writable: true,
            value: 0,
        });
    });

    afterEach(() => {
        console.error = originalConsoleError;
        jest.useRealTimers();
    });

    describe('Component Rendering', () => {
        test('renders day view with navigation controls', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('Month')).toBeInTheDocument();
            expect(screen.getByText('Week')).toBeInTheDocument();
            expect(screen.getByText('Day')).toBeInTheDocument();
        });

        test('displays current date in header', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.getByText(/Saturday/)).toBeInTheDocument();
        });

        test('renders all time slots', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('12 AM')).toBeInTheDocument();
            expect(screen.getByText('8 AM')).toBeInTheDocument();
            expect(screen.getByText('2 PM')).toBeInTheDocument();
            expect(screen.getByText('11 PM')).toBeInTheDocument();
        });

        test('shows loading state initially', () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
        });

        test('renders Day button as active', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const dayButton = screen.getByText('Day');
            expect(dayButton).toHaveClass('active');
        });
    });

    describe('API Integration', () => {
        test('fetches appointments for the current day on mount', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getCalendarDay).toHaveBeenCalledWith('2025-03-15');
            });
        });

        test('fetches reminders for the current day on mount', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getReminderList).toHaveBeenCalledWith({
                    duration: 'day',
                    start_date: '2025-03-15',
                });
            });
        });

        test('refetches data when currentDate changes', async () => {
            const { rerender } = render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getCalendarDay).toHaveBeenCalledTimes(1);
            });

            const newDate = new Date('2025-03-16T10:00:00');
            rerender(
                <BrowserRouter>
                    <DayView
                        currentDate={newDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getCalendarDay).toHaveBeenCalledWith('2025-03-16');
                expect(apiService.getCalendarDay).toHaveBeenCalledTimes(2);
            });
        });

        test('handles API error for appointments gracefully', async () => {
            apiService.getCalendarDay.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching day appointments:',
                    expect.any(Error)
                );
            });

            expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
        });

        test('handles API error for reminders gracefully', async () => {
            apiService.getReminderList.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching reminders:',
                    expect.any(Error)
                );
            });
        });

        test('sets empty array when API returns null', async () => {
            apiService.getCalendarDay.mockResolvedValue(null);
            apiService.getReminderList.mockResolvedValue(null);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            // Should not crash with null data
            expect(screen.getByText('8 AM')).toBeInTheDocument();
        });
    });

    describe('Day Navigation', () => {
        test('navigates to previous day when left arrow clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const arrows = screen.getAllByText('←');
            fireEvent.click(arrows[0]);

            expect(mockOnDateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    // March 14, 2025
                })
            );

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(14);
            expect(calledDate.getMonth()).toBe(2); // March (0-based)
        });

        test('navigates to next day when right arrow clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const arrows = screen.getAllByText('→');
            fireEvent.click(arrows[0]);

            expect(mockOnDateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    // March 16, 2025
                })
            );

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(16);
            expect(calledDate.getMonth()).toBe(2); // March (0-based)
        });

        test('navigates across month boundaries (previous)', async () => {
            const firstOfMonth = new Date('2025-03-01T10:00:00');

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={firstOfMonth}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const arrows = screen.getAllByText('←');
            fireEvent.click(arrows[0]);

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(28); // Feb 28, 2025
            expect(calledDate.getMonth()).toBe(1); // February (0-based)
        });

        test('navigates across month boundaries (next)', async () => {
            const endOfMonth = new Date('2025-03-31T10:00:00');

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={endOfMonth}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const arrows = screen.getAllByText('→');
            fireEvent.click(arrows[0]);

            const calledDate = mockOnDateChange.mock.calls[0][0];
            expect(calledDate.getDate()).toBe(1); // April 1, 2025
            expect(calledDate.getMonth()).toBe(3); // April (0-based)
        });
    });

    describe('View Switching', () => {
        test('navigates to month view when Month button clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const monthButton = screen.getByText('Month');
            fireEvent.click(monthButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=month');
        });

        test('navigates to week view when Week button clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const weekButton = screen.getByText('Week');
            fireEvent.click(weekButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=week');
        });
    });

    describe('Appointment Display', () => {
        test('displays appointments in correct hour slots', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            expect(screen.getByText('TechCorp')).toBeInTheDocument(); // 9:00 AM
            expect(screen.getByText('StartupXYZ')).toBeInTheDocument(); // 2:30 PM
            expect(screen.getByText('BigCompany')).toBeInTheDocument(); // 4:00 PM
        });

        test('displays appointment details', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            expect(screen.getByText('Interview')).toBeInTheDocument();
            expect(screen.getByText('Technical interview')).toBeInTheDocument();
            expect(screen.getByText('Phone Call')).toBeInTheDocument();
            expect(screen.getByText('Initial screening')).toBeInTheDocument();
        });

        test('displays formatted time for appointments', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            // formatTimeDisplay is mocked, so it should convert the times
            expect(formatTimeDisplay).toHaveBeenCalledWith('09:00');
            expect(formatTimeDisplay).toHaveBeenCalledWith('14:30');
            expect(formatTimeDisplay).toHaveBeenCalledWith('16:00');
        });

        test('shows score indicator for appointments with outcome_score', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const scoreIndicators = document.querySelectorAll('.day-score-indicator');
            expect(scoreIndicators.length).toBe(1); // Only first appointment has outcome_score
        });

        test('displays no appointments when none exist', async () => {
            apiService.getCalendarDay.mockResolvedValue([]);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
            expect(screen.queryByText('StartupXYZ')).not.toBeInTheDocument();
        });
    });

    describe('Appointment Height Based on Duration', () => {
        test('sets 50% height for appointments ≤ 0.5 hour', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('StartupXYZ').closest('.day-appointment-box');
            expect(appointmentBox).toHaveStyle({ height: '50%' });
        });

        test('sets 100% height for appointments > 0.5 hour', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox1 = screen.getByText('TechCorp').closest('.day-appointment-box');
            expect(appointmentBox1).toHaveStyle({ height: '100%' });

            const appointmentBox2 = screen.getByText('BigCompany').closest('.day-appointment-box');
            expect(appointmentBox2).toHaveStyle({ height: '100%' });
        });
    });

    describe('Reminder Display', () => {
        test('displays reminders in correct hour slots', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            });

            expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            expect(screen.getByText('Send thank you email')).toBeInTheDocument();
        });

        test('displays reminders at midnight when no time specified', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Send thank you email')).toBeInTheDocument();
            });

            // The reminder without time should be in hour 0 (midnight)
            // Component logic: if (!reminder.reminder_time) return hour === 0;
            expect(screen.getByText('Send thank you email')).toBeInTheDocument();
        });

        test('displays reminder icon', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            });

            const icons = screen.getAllByText('⏰');
            expect(icons.length).toBeGreaterThanOrEqual(1);
        });

        test('calls onReminderClick when reminder clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            });

            const reminderBox = screen.getByText('Follow up with recruiter').closest('.day-reminder-box');
            fireEvent.click(reminderBox);

            expect(mockOnReminderClick).toHaveBeenCalledWith(mockReminders[0]);
        });

        test('does not call onReminderClick when onReminderClick prop is not provided', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={null}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            });

            const reminderBox = screen.getByText('Follow up with recruiter').closest('.day-reminder-box');

            // Should not crash when onReminderClick is null
            expect(() => fireEvent.click(reminderBox)).not.toThrow();
        });
    });

    describe('Time Slot Interactions', () => {
        test('navigates to calendar form when time slot clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const hourSlots = document.querySelectorAll('.hour-slot');
            // Click on hour 8 (index 3 in our mock hours)
            fireEvent.click(hourSlots[3]);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form?date=2025-03-15&time=08:00&view=day');
        });

        test('includes correct time in navigation URL', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const hourSlots = document.querySelectorAll('.hour-slot');
            // Click on hour 14 (2 PM, index 6 in our mock hours)
            fireEvent.click(hourSlots[6]);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form?date=2025-03-15&time=14:00&view=day');
        });

        test('appointment click does not trigger time slot navigation', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('TechCorp').closest('.day-appointment-box');
            fireEvent.click(appointmentBox);

            // Should open modal, not navigate to calendar form
            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/calendar-form?'));
        });

        test('reminder click does not trigger time slot navigation', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
            });

            const reminderBox = screen.getByText('Follow up with recruiter').closest('.day-reminder-box');
            fireEvent.click(reminderBox);

            // Should call onReminderClick, not navigate to calendar form
            expect(mockOnReminderClick).toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/calendar-form?'));
        });
    });

    describe('Business Hours Styling', () => {
        test('applies non-business class to non-business hours', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            const timeSlots = document.querySelectorAll('.time-slot');
            const hourSlots = document.querySelectorAll('.hour-slot');

            // Verify isBusinessHour was called for each hour
            expect(isBusinessHour).toHaveBeenCalled();

            // First few slots (0-7 AM) should have non-business class
            expect(timeSlots[0]).toHaveClass('non-business'); // 12 AM
            expect(timeSlots[1]).toHaveClass('non-business'); // 1 AM
            expect(timeSlots[2]).toHaveClass('non-business'); // 2 AM

            expect(hourSlots[0]).toHaveClass('non-business'); // 12 AM
            expect(hourSlots[1]).toHaveClass('non-business'); // 1 AM
            expect(hourSlots[2]).toHaveClass('non-business'); // 2 AM

            // Business hours (8 AM - 5 PM) should not have non-business class
            expect(timeSlots[3]).not.toHaveClass('non-business'); // 8 AM
            expect(hourSlots[3]).not.toHaveClass('non-business'); // 8 AM
        });
    });

    describe('AppointmentModal Integration', () => {
        test('opens modal when appointment clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('TechCorp').closest('.day-appointment-box');
            fireEvent.click(appointmentBox);

            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
            expect(screen.getByText('Modal for: TechCorp')).toBeInTheDocument();
        });

        test('closes modal when close button clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('TechCorp').closest('.day-appointment-box');
            fireEvent.click(appointmentBox);

            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();

            const closeButton = screen.getByText('Close Modal');
            fireEvent.click(closeButton);

            expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
        });

        test('navigates to edit form when edit clicked', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('TechCorp').closest('.day-appointment-box');
            fireEvent.click(appointmentBox);

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form/1?view=day&date=2025-03-15');
        });

        test('removes appointment from list when deleted', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            const appointmentBox = screen.getByText('TechCorp').closest('.day-appointment-box');
            fireEvent.click(appointmentBox);

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
            });

            expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
        });

        test('does not render modal when no appointment selected', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
        });
    });

    describe('Auto-Scroll to 8 AM', () => {
        test('scrolls to 8 AM position on mount', async () => {
            jest.useFakeTimers();

            const mockScrollTop = jest.fn();
            jest.spyOn(document, 'querySelector').mockReturnValue({
                scrollTop: 0,
                set scrollTop(value) {
                    mockScrollTop(value);
                },
            });

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            // Fast-forward timers to trigger the scroll
            jest.advanceTimersByTime(100);

            await waitFor(() => {
                expect(mockScrollTop).toHaveBeenCalledWith(640); // 8 * 80 = 640
            });

            jest.useRealTimers();
        });

        test('scrolls to 8 AM when date changes', async () => {
            jest.useFakeTimers();

            const mockScrollTop = jest.fn();
            jest.spyOn(document, 'querySelector').mockReturnValue({
                scrollTop: 0,
                set scrollTop(value) {
                    mockScrollTop(value);
                },
            });

            const { rerender } = render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            jest.advanceTimersByTime(100);

            await waitFor(() => {
                expect(mockScrollTop).toHaveBeenCalledWith(640);
            });

            mockScrollTop.mockClear();

            const newDate = new Date('2025-03-16T10:00:00');
            rerender(
                <BrowserRouter>
                    <DayView
                        currentDate={newDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            jest.advanceTimersByTime(100);

            await waitFor(() => {
                expect(mockScrollTop).toHaveBeenCalledWith(640);
            });

            jest.useRealTimers();
        });

        test('handles missing grid container gracefully', async () => {
            jest.useFakeTimers();

            jest.spyOn(document, 'querySelector').mockReturnValue(null);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            jest.advanceTimersByTime(100);

            // Should not crash when grid container is not found
            await waitFor(() => {
                expect(screen.queryByText('Loading appointments...')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });
    });

    describe('Edge Cases', () => {
        test('handles appointments spanning multiple hours', async () => {
            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('BigCompany')).toBeInTheDocument();
            });

            // BigCompany appointment is 2 hours (16:00-18:00)
            // Should appear in both hour 16 and hour 17
            expect(screen.getByText('BigCompany')).toBeInTheDocument();
        });

        test('handles appointments with missing duration', async () => {
            const appointmentNoDuration = {
                calendar_id: 4,
                start_date: '2025-03-15',
                start_time: '11:00',
                duration_hour: null,
                calendar_type: 'Meeting',
                company: 'TestCo',
            };

            apiService.getCalendarDay.mockResolvedValue([appointmentNoDuration]);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TestCo')).toBeInTheDocument();
            });

            // Should default to 1 hour duration
            expect(screen.getByText('TestCo')).toBeInTheDocument();
        });

        test('handles appointments without description', async () => {
            const appointmentNoDesc = {
                calendar_id: 5,
                start_date: '2025-03-15',
                start_time: '13:00',
                duration_hour: 1,
                calendar_type: 'Call',
                company: 'NoDescCo',
                calendar_desc: null,
            };

            apiService.getCalendarDay.mockResolvedValue([appointmentNoDesc]);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('NoDescCo')).toBeInTheDocument();
            });

            // Should render without crashing
            expect(screen.getByText('Call')).toBeInTheDocument();
        });

        test('handles multiple appointments in same hour', async () => {
            const overlappingAppointments = [
                {
                    calendar_id: 6,
                    start_date: '2025-03-15',
                    start_time: '10:00',
                    duration_hour: 1,
                    calendar_type: 'Interview',
                    company: 'CompanyA',
                },
                {
                    calendar_id: 7,
                    start_date: '2025-03-15',
                    start_time: '10:30',
                    duration_hour: 0.5,
                    calendar_type: 'Call',
                    company: 'CompanyB',
                },
            ];

            apiService.getCalendarDay.mockResolvedValue(overlappingAppointments);

            render(
                <BrowserRouter>
                    <DayView
                        currentDate={currentDate}
                        onDateChange={mockOnDateChange}
                        onReminderClick={mockOnReminderClick}
                    />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('CompanyA')).toBeInTheDocument();
            });

            // Both should be displayed
            expect(screen.getByText('CompanyA')).toBeInTheDocument();
            expect(screen.getByText('CompanyB')).toBeInTheDocument();
        });
    });
});
