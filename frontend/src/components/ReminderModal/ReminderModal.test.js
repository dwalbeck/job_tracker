import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReminderModal from './ReminderModal';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    getJobList: jest.fn(),
    saveReminder: jest.fn(),
    deleteReminder: jest.fn(),
}));

// Mock console and window functions
const originalConsoleError = console.error;
const originalConfirm = window.confirm;

describe('ReminderModal Component', () => {
    let mockNavigate;

    const mockJobs = [
        { job_id: 1, company: 'Tech Corp', job_title: 'Software Engineer' },
        { job_id: 2, company: 'Startup Inc', job_title: 'Senior Developer' },
        { job_id: 3, company: 'Big Corp', job_title: 'Lead Engineer' },
    ];

    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Mock console and window functions
        console.error = jest.fn();
        window.confirm = jest.fn();

        // Default API mocks
        apiService.getJobList.mockResolvedValue(mockJobs);
    });

    afterEach(() => {
        console.error = originalConsoleError;
        window.confirm = originalConfirm;
    });

    describe('Component Rendering', () => {
        test('does not render when isOpen is false', () => {
            render(<ReminderModal isOpen={false} onClose={mockOnClose} />);

            expect(screen.queryByText('Add Reminder')).not.toBeInTheDocument();
        });

        test('renders add reminder modal when isOpen is true', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });
        });

        test('renders edit reminder modal when reminder is provided', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Follow up with recruiter',
                job_id: 1,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Edit Reminder')).toBeInTheDocument();
            });
        });

        test('renders all form fields', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/For Job Posting/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Reminder Date/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Reminder Time/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Reminder Message/)).toBeInTheDocument();
        });

        test('renders submit button with correct text for adding', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });
        });

        test('renders submit button with correct text for editing', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Follow up',
                job_id: 1,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Update Reminder')).toBeInTheDocument();
            });
        });

        test('renders delete button only in edit mode', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Follow up',
                job_id: 1,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });
        });

        test('does not render delete button in add mode', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });

            expect(screen.queryByText('Delete')).not.toBeInTheDocument();
        });

        test('renders cancel button', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching', () => {
        test('fetches job list when modal opens', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(apiService.getJobList).toHaveBeenCalledTimes(1);
            });
        });

        test('populates job dropdown with fetched jobs', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp - Software Engineer')).toBeInTheDocument();
            });

            expect(screen.getByText('Startup Inc - Senior Developer')).toBeInTheDocument();
            expect(screen.getByText('Big Corp - Lead Engineer')).toBeInTheDocument();
        });

        test('handles job fetch error gracefully', async () => {
            apiService.getJobList.mockRejectedValue(new Error('Network error'));

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching jobs:',
                    expect.any(Error)
                );
            });
        });

        test('populates form when reminder is provided', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Follow up with recruiter about the position',
                job_id: 2,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('2025-03-15')).toBeInTheDocument();
            });

            expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Follow up with recruiter about the position')).toBeInTheDocument();
        });

        test('pre-selects job when preSelectedJobId provided', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} preSelectedJobId={2} />);

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/For Job Posting/);
                expect(jobSelect).toHaveValue('2');
            });
        });

        test('disables job select when preSelectedJobId provided', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} preSelectedJobId={2} />);

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/For Job Posting/);
                expect(jobSelect).toBeDisabled();
            });
        });
    });

    describe('Form Interactions', () => {
        test('updates form fields when changed', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Reminder Date/)).toBeInTheDocument();
            });

            const dateInput = screen.getByLabelText(/Reminder Date/);
            const timeInput = screen.getByLabelText(/Reminder Time/);
            const messageInput = screen.getByLabelText(/Reminder Message/);

            fireEvent.change(dateInput, { target: { value: '2025-04-20' } });
            fireEvent.change(timeInput, { target: { value: '10:00' } });
            fireEvent.change(messageInput, { target: { value: 'Test reminder message' } });

            expect(dateInput).toHaveValue('2025-04-20');
            expect(timeInput).toHaveValue('10:00');
            expect(messageInput).toHaveValue('Test reminder message');
        });

        test('allows job selection change', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/For Job Posting/)).toBeInTheDocument();
            });

            const jobSelect = screen.getByLabelText(/For Job Posting/);
            fireEvent.change(jobSelect, { target: { value: '2' } });

            expect(jobSelect).toHaveValue('2');
        });
    });

    describe('Save Functionality', () => {
        test('saves new reminder successfully', async () => {
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Reminder Date/)).toBeInTheDocument();
            });

            // Fill form
            fireEvent.change(screen.getByLabelText(/Reminder Date/), {
                target: { value: '2025-04-20' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Time/), {
                target: { value: '10:00' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Message/), {
                target: { value: 'Test reminder message' },
            });

            // Submit
            const submitButton = screen.getByText('Add Reminder');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith({
                    reminder_date: '2025-04-20',
                    reminder_time: '10:00',
                    reminder_message: 'Test reminder message',
                    reminder_dismissed: false,
                    job_id: null,
                });
            });

            expect(mockOnClose).toHaveBeenCalledWith(true);
        });

        test('saves reminder with selected job', async () => {
            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/For Job Posting/)).toBeInTheDocument();
            });

            // Fill form
            fireEvent.change(screen.getByLabelText(/For Job Posting/), {
                target: { value: '2' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Date/), {
                target: { value: '2025-04-20' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Message/), {
                target: { value: 'Test message' },
            });

            // Submit
            fireEvent.submit(screen.getByText('Add Reminder').closest('form'));

            await waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 2,
                    })
                );
            });
        });

        test('updates existing reminder successfully', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Original message',
                job_id: 1,
            };

            apiService.saveReminder.mockResolvedValue({});

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Original message')).toBeInTheDocument();
            });

            // Update message
            fireEvent.change(screen.getByLabelText(/Reminder Message/), {
                target: { value: 'Updated message' },
            });

            // Submit
            const submitButton = screen.getByText('Update Reminder');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.saveReminder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        reminder_id: 1,
                        reminder_message: 'Updated message',
                    })
                );
            });

            expect(mockOnClose).toHaveBeenCalledWith(true);
        });

        test('shows loading state while saving', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.saveReminder.mockReturnValue(promise);

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Reminder Date/)).toBeInTheDocument();
            });

            // Fill and submit form
            fireEvent.change(screen.getByLabelText(/Reminder Date/), {
                target: { value: '2025-04-20' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Message/), {
                target: { value: 'Test' },
            });

            fireEvent.click(screen.getByText('Add Reminder'));

            expect(screen.getByText('Saving...')).toBeInTheDocument();
            expect(screen.getByText('Saving...')).toBeDisabled();

            resolvePromise({});
        });

        test('handles save error gracefully', async () => {
            apiService.saveReminder.mockRejectedValue(new Error('Network error'));

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Reminder Date/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Reminder Date/), {
                target: { value: '2025-04-20' },
            });
            fireEvent.change(screen.getByLabelText(/Reminder Message/), {
                target: { value: 'Test' },
            });

            fireEvent.click(screen.getByText('Add Reminder'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save reminder. Please try again.')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith(
                'Error saving reminder:',
                expect.any(Error)
            );
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Delete Functionality', () => {
        test('shows confirmation dialog when delete clicked', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Test',
                job_id: 1,
            };

            window.confirm.mockReturnValue(false);

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Delete'));

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this reminder?');
        });

        test('deletes reminder when confirmed', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Test',
                job_id: 1,
            };

            window.confirm.mockReturnValue(true);
            apiService.deleteReminder.mockResolvedValue({});

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(apiService.deleteReminder).toHaveBeenCalledWith(1);
            });

            expect(mockOnClose).toHaveBeenCalledWith(true);
        });

        test('does not delete when cancelled', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Test',
                job_id: 1,
            };

            window.confirm.mockReturnValue(false);

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Delete'));

            expect(apiService.deleteReminder).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('handles delete error gracefully', async () => {
            const reminder = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Test',
                job_id: 1,
            };

            window.confirm.mockReturnValue(true);
            apiService.deleteReminder.mockRejectedValue(new Error('Delete failed'));

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminder} />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(screen.getByText('Failed to delete reminder. Please try again.')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith(
                'Error deleting reminder:',
                expect.any(Error)
            );
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Cancel Functionality', () => {
        test('closes modal when cancel button clicked', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            expect(mockOnClose).toHaveBeenCalledWith(false);
        });

        test('navigates to job details when redirectJobId provided', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} redirectJobId={123} />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/123');
        });

        test('closes modal when clicking overlay', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });

            const overlay = screen.getByText('Add Reminder').closest('.reminder-modal-overlay');
            fireEvent.click(overlay);

            expect(mockOnClose).toHaveBeenCalledWith(false);
        });

        test('does not close when clicking modal content', async () => {
            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });

            const content = screen.getByText('Add Reminder').closest('.reminder-modal-content');
            fireEvent.click(content);

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('handles empty job list', async () => {
            apiService.getJobList.mockResolvedValue([]);

            render(<ReminderModal isOpen={true} onClose={mockOnClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText(/For Job Posting/)).toBeInTheDocument();
            });

            const jobSelect = screen.getByLabelText(/For Job Posting/);
            expect(jobSelect.options).toHaveLength(1); // Only "No job selected" option
        });

        test('handles reminder without job_id', async () => {
            const reminderWithoutJob = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: '14:30',
                reminder_message: 'Test',
                job_id: null,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminderWithoutJob} />);

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/For Job Posting/);
                expect(jobSelect).toHaveValue('');
            });
        });

        test('handles reminder without time', async () => {
            const reminderWithoutTime = {
                reminder_id: 1,
                reminder_date: '2025-03-15',
                reminder_time: null,
                reminder_message: 'Test',
                job_id: 1,
            };

            render(<ReminderModal isOpen={true} onClose={mockOnClose} reminder={reminderWithoutTime} />);

            await waitFor(() => {
                const timeInput = screen.getByLabelText(/Reminder Time/);
                expect(timeInput).toHaveValue('');
            });
        });
    });
});
