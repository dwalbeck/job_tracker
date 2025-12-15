import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReminderAlert from './ReminderAlert';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    saveReminder: jest.fn(),
}));

// Mock console and alert
const originalConsoleError = console.error;
const originalAlert = window.alert;

describe('ReminderAlert Component', () => {
    const mockReminder = {
        reminder_id: 1,
        reminder_date: '2025-03-15',
        reminder_time: '14:30',
        reminder_message: 'Follow up with recruiter about the senior developer position',
        job_id: 123,
    };

    const mockOnDismiss = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
        window.alert = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        window.alert = originalAlert;
    });

    describe('Component Rendering', () => {
        test('renders reminder alert with all details', () => {
            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('Reminder Alert')).toBeInTheDocument();
            expect(screen.getByText(/Follow up with recruiter about the senior developer position/)).toBeInTheDocument();
            expect(screen.getByText('Dismiss')).toBeInTheDocument();
        });

        test('renders formatted date correctly', () => {
            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            // The date should be formatted as a long date
            expect(screen.getByText(/Saturday, March 15, 2025/)).toBeInTheDocument();
        });

        test('renders formatted time correctly', () => {
            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('2:30 PM')).toBeInTheDocument();
        });

        test('renders alarm clock icon', () => {
            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('⏰')).toBeInTheDocument();
        });

        test('displays "No time specified" when time is missing', () => {
            const reminderWithoutTime = { ...mockReminder, reminder_time: null };

            render(<ReminderAlert reminder={reminderWithoutTime} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('No time specified')).toBeInTheDocument();
        });

        test('returns null when no reminder provided', () => {
            const { container } = render(<ReminderAlert reminder={null} onDismiss={mockOnDismiss} />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('Time Formatting', () => {
        test('formats morning time correctly', () => {
            const morningReminder = { ...mockReminder, reminder_time: '09:15' };

            render(<ReminderAlert reminder={morningReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('9:15 AM')).toBeInTheDocument();
        });

        test('formats afternoon time correctly', () => {
            const afternoonReminder = { ...mockReminder, reminder_time: '15:45' };

            render(<ReminderAlert reminder={afternoonReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('3:45 PM')).toBeInTheDocument();
        });

        test('formats midnight correctly', () => {
            const midnightReminder = { ...mockReminder, reminder_time: '00:00' };

            render(<ReminderAlert reminder={midnightReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('12:00 AM')).toBeInTheDocument();
        });

        test('formats noon correctly', () => {
            const noonReminder = { ...mockReminder, reminder_time: '12:00' };

            render(<ReminderAlert reminder={noonReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('12:00 PM')).toBeInTheDocument();
        });

        test('handles invalid time format gracefully', () => {
            const invalidTimeReminder = { ...mockReminder, reminder_time: '' };

            render(<ReminderAlert reminder={invalidTimeReminder} onDismiss={mockOnDismiss} />);

            expect(screen.getByText('No time specified')).toBeInTheDocument();
        });
    });

    describe('Dismiss Functionality', () => {
        test('calls saveReminder API when dismiss button clicked', async () => {
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            await waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith({
                    reminder_id: 1,
                    reminder_date: '2025-03-15',
                    reminder_time: '14:30',
                    reminder_message: 'Follow up with recruiter about the senior developer position',
                    reminder_dismissed: true,
                    job_id: 123,
                });
            });
        });

        test('calls onDismiss callback after successful API call', async () => {
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            await waitFor(() => {
                expect(mockOnDismiss).toHaveBeenCalledWith(1);
            });
        });

        test('shows "Dismissing..." text while processing', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.saveReminder.mockReturnValue(promise);

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            expect(screen.getByText('Dismissing...')).toBeInTheDocument();

            resolvePromise({});
            await waitFor(() => {
                expect(mockOnDismiss).toHaveBeenCalled();
            });
        });

        test('disables button while dismissing', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.saveReminder.mockReturnValue(promise);

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            expect(screen.getByText('Dismissing...')).toBeDisabled();

            resolvePromise({});
        });

        test('handles dismiss error gracefully', async () => {
            apiService.saveReminder.mockRejectedValue(new Error('Network error'));

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error dismissing reminder:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to dismiss reminder. Please try again.');
            });

            // onDismiss should not be called on error
            expect(mockOnDismiss).not.toHaveBeenCalled();
        });

        test('re-enables button after error', async () => {
            apiService.saveReminder.mockRejectedValue(new Error('Network error'));

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalled();
            });

            // Button should be enabled again
            expect(screen.getByText('Dismiss')).not.toBeDisabled();
        });

        test('passes null job_id when not present in reminder', async () => {
            const reminderWithoutJob = { ...mockReminder, job_id: null };
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderAlert reminder={reminderWithoutJob} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            await waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: null,
                    })
                );
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles reminder with very long message', () => {
            const longMessage = 'A'.repeat(500);
            const reminderWithLongMessage = { ...mockReminder, reminder_message: longMessage };

            render(<ReminderAlert reminder={reminderWithLongMessage} onDismiss={mockOnDismiss} />);

            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        test('handles reminder with missing date', () => {
            const reminderWithoutDate = { ...mockReminder, reminder_date: null };

            render(<ReminderAlert reminder={reminderWithoutDate} onDismiss={mockOnDismiss} />);

            // Should still render without crashing
            expect(screen.getByText('Reminder Alert')).toBeInTheDocument();
        });

        test('handles reminder with undefined job_id', () => {
            const reminderWithUndefinedJob = { ...mockReminder };
            delete reminderWithUndefinedJob.job_id;

            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderAlert reminder={reminderWithUndefinedJob} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');
            fireEvent.click(dismissButton);

            waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: null,
                    })
                );
            });
        });

        test('multiple rapid clicks do not cause multiple API calls', async () => {
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderAlert reminder={mockReminder} onDismiss={mockOnDismiss} />);

            const dismissButton = screen.getByText('Dismiss');

            // Click multiple times rapidly
            fireEvent.click(dismissButton);
            fireEvent.click(dismissButton);
            fireEvent.click(dismissButton);

            await waitFor(() => {
                // Should only be called once because button is disabled after first click
                expect(apiService.saveReminder).toHaveBeenCalledTimes(1);
            });
        });
    });
});
