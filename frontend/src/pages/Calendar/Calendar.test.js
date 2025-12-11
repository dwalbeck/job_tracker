import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calendar from './Calendar';
import apiService from '../../services/api';

// Mock all dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('../../context/JobContext', () => ({
    useJob: jest.fn(),
}));

jest.mock('../../components/ExportMenu/ExportMenu', () => {
    return function MockExportMenu({ label, onExport }) {
        return <button onClick={onExport}>{label}</button>;
    };
});

jest.mock('../../components/Calendar/MonthView', () => {
    return function MockMonthView({ currentDate, onDateChange, onViewChange, onReminderClick }) {
        return (
            <div data-testid="month-view">
                Month View
                <button onClick={() => onDateChange(new Date('2025-02-01'))}>Change Date</button>
                <button onClick={() => onViewChange('week')}>Switch to Week</button>
                <button onClick={() => onReminderClick({ id: 1, title: 'Test Reminder' })}>Click Reminder</button>
            </div>
        );
    };
});

jest.mock('../../components/Calendar/WeekView', () => {
    return function MockWeekView({ currentDate, onDateChange, onReminderClick }) {
        return (
            <div data-testid="week-view">
                Week View
                <button onClick={() => onDateChange(new Date('2025-02-15'))}>Change Date</button>
                <button onClick={() => onReminderClick({ id: 2, title: 'Week Reminder' })}>Click Reminder</button>
            </div>
        );
    };
});

jest.mock('../../components/Calendar/DayView', () => {
    return function MockDayView({ currentDate, onDateChange, onReminderClick }) {
        return (
            <div data-testid="day-view">
                Day View
                <button onClick={() => onDateChange(new Date('2025-02-20'))}>Change Date</button>
                <button onClick={() => onReminderClick({ id: 3, title: 'Day Reminder' })}>Click Reminder</button>
            </div>
        );
    };
});

jest.mock('../../components/ReminderModal/ReminderModal', () => {
    return function MockReminderModal({ isOpen, onClose, preSelectedJobId, reminder, redirectJobId }) {
        if (!isOpen) return null;
        return (
            <div data-testid="reminder-modal">
                <h2>Reminder Modal</h2>
                <div data-testid="pre-selected-job-id">{preSelectedJobId || 'none'}</div>
                <div data-testid="reminder-id">{reminder?.id || 'none'}</div>
                <div data-testid="redirect-job-id">{redirectJobId || 'none'}</div>
                <button onClick={() => onClose(false)}>Cancel</button>
                <button onClick={() => onClose(true)}>Save</button>
            </div>
        );
    };
});

jest.mock('../../services/api', () => ({
    exportCalendar: jest.fn(),
    baseURL: 'http://api.test.com',
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalAlert = window.alert;

describe('Calendar Component', () => {
    let mockNavigate;
    let mockSearchParams;
    let mockSetSearchParams;
    let mockUseJob;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Setup search params mock
        mockSearchParams = new URLSearchParams();
        mockSetSearchParams = jest.fn();
        require('react-router-dom').useSearchParams.mockReturnValue([
            mockSearchParams,
            mockSetSearchParams,
        ]);

        // Setup JobContext mock
        mockUseJob = { selectedJobId: null };
        require('../../context/JobContext').useJob.mockReturnValue(mockUseJob);

        // Mock console and alert
        console.log = jest.fn();
        console.error = jest.fn();
        window.alert = jest.fn();

        // Mock document methods
        document.createElement = jest.fn((tag) => {
            const element = {
                href: '',
                download: '',
                click: jest.fn(),
                setAttribute: jest.fn(),
            };
            return element;
        });
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        window.alert = originalAlert;
    });

    describe('Component Rendering', () => {
        test('renders calendar page with default month view', () => {
            render(<Calendar />);

            expect(screen.getByText('Calendar - month view')).toBeInTheDocument();
            expect(screen.getByTestId('month-view')).toBeInTheDocument();
            expect(screen.getByText('+ Add Reminder')).toBeInTheDocument();
            expect(screen.getByText('+ Add Appointment')).toBeInTheDocument();
            expect(screen.getByText('Export Calendar')).toBeInTheDocument();
        });

        test('renders week view when view parameter is week', () => {
            mockSearchParams.set('view', 'week');

            render(<Calendar />);

            expect(screen.getByText('Calendar - week view')).toBeInTheDocument();
            expect(screen.getByTestId('week-view')).toBeInTheDocument();
            expect(screen.queryByTestId('month-view')).not.toBeInTheDocument();
        });

        test('renders day view when view parameter is day', () => {
            mockSearchParams.set('view', 'day');

            render(<Calendar />);

            expect(screen.getByText('Calendar - day view')).toBeInTheDocument();
            expect(screen.getByTestId('day-view')).toBeInTheDocument();
            expect(screen.queryByTestId('month-view')).not.toBeInTheDocument();
        });

        test('defaults to month view when view parameter is invalid', () => {
            mockSearchParams.set('view', 'invalid');

            render(<Calendar />);

            expect(screen.getByText('Calendar - invalid view')).toBeInTheDocument();
            expect(screen.getByTestId('month-view')).toBeInTheDocument();
        });

        test('does not render back button when selectedJobId is not present', () => {
            render(<Calendar />);

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });

        test('renders back button when selectedJobId is present', () => {
            mockUseJob.selectedJobId = 123;

            render(<Calendar />);

            expect(screen.getByText('←')).toBeInTheDocument();
        });
    });

    describe('View Switching', () => {
        test('switches to week view when requested from month view', () => {
            render(<Calendar />);

            const switchButton = screen.getByText('Switch to Week');
            fireEvent.click(switchButton);

            expect(mockSetSearchParams).toHaveBeenCalledWith({ view: 'week' });
        });

        test('updates URL parameters when changing view', () => {
            render(<Calendar />);

            const switchButton = screen.getByText('Switch to Week');
            fireEvent.click(switchButton);

            expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
            expect(mockSetSearchParams).toHaveBeenCalledWith({ view: 'week' });
        });
    });

    describe('Date Handling', () => {
        test('handles date change in month view', () => {
            render(<Calendar />);

            const changeDateButton = screen.getByText('Change Date');
            fireEvent.click(changeDateButton);

            // Component should handle the date change (state update)
            // No external calls expected for date changes
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('handles date change in week view', () => {
            mockSearchParams.set('view', 'week');

            render(<Calendar />);

            const changeDateButton = screen.getByText('Change Date');
            fireEvent.click(changeDateButton);

            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('handles date change in day view', () => {
            mockSearchParams.set('view', 'day');

            render(<Calendar />);

            const changeDateButton = screen.getByText('Change Date');
            fireEvent.click(changeDateButton);

            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        test('navigates back to job details when back button clicked', () => {
            mockUseJob.selectedJobId = 456;

            render(<Calendar />);

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/456');
        });

        test('navigates to calendar form when add appointment clicked', () => {
            render(<Calendar />);

            const addAppointmentButton = screen.getByText('+ Add Appointment');
            fireEvent.click(addAppointmentButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form');
        });

        test('does not navigate back when back button clicked without selectedJobId', () => {
            // This test verifies the button shouldn't even be rendered
            render(<Calendar />);

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });
    });

    describe('Reminder Modal', () => {
        test('opens reminder modal when add reminder button clicked', () => {
            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
            expect(screen.getByText('Reminder Modal')).toBeInTheDocument();
        });

        test('opens reminder modal on page load when open_reminder=true', () => {
            mockSearchParams.set('open_reminder', 'true');

            render(<Calendar />);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
        });

        test('removes open_reminder parameter after opening modal', () => {
            mockSearchParams.set('open_reminder', 'true');

            render(<Calendar />);

            expect(mockSetSearchParams).toHaveBeenCalled();
            const callArgs = mockSetSearchParams.mock.calls[0][0];
            expect(callArgs.has('open_reminder')).toBe(false);
        });

        test('does not open modal when open_reminder is not true', () => {
            mockSearchParams.set('open_reminder', 'false');

            render(<Calendar />);

            expect(screen.queryByTestId('reminder-modal')).not.toBeInTheDocument();
        });

        test('closes reminder modal when cancel button clicked', () => {
            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(screen.queryByTestId('reminder-modal')).not.toBeInTheDocument();
        });

        test('closes reminder modal and navigates back when save clicked with job_id param', () => {
            mockSearchParams.set('job_id', '789');

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            expect(screen.queryByTestId('reminder-modal')).not.toBeInTheDocument();
            expect(mockNavigate).toHaveBeenCalledWith('/job-details/789');
        });

        test('closes reminder modal without navigation when save clicked without job_id param', () => {
            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            expect(screen.queryByTestId('reminder-modal')).not.toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('opens reminder modal with selected reminder when reminder clicked in month view', () => {
            render(<Calendar />);

            const reminderButton = screen.getByText('Click Reminder');
            fireEvent.click(reminderButton);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
            expect(screen.getByTestId('reminder-id')).toHaveTextContent('1');
        });

        test('opens reminder modal with selected reminder when reminder clicked in week view', () => {
            mockSearchParams.set('view', 'week');

            render(<Calendar />);

            const reminderButton = screen.getByText('Click Reminder');
            fireEvent.click(reminderButton);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
            expect(screen.getByTestId('reminder-id')).toHaveTextContent('2');
        });

        test('opens reminder modal with selected reminder when reminder clicked in day view', () => {
            mockSearchParams.set('view', 'day');

            render(<Calendar />);

            const reminderButton = screen.getByText('Click Reminder');
            fireEvent.click(reminderButton);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
            expect(screen.getByTestId('reminder-id')).toHaveTextContent('3');
        });

        test('clears selected reminder when modal closed', () => {
            render(<Calendar />);

            // Click reminder to select one
            const reminderButton = screen.getByText('Click Reminder');
            fireEvent.click(reminderButton);

            expect(screen.getByTestId('reminder-id')).toHaveTextContent('1');

            // Close modal
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            // Open modal again
            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            // Should not have reminder id anymore
            expect(screen.getByTestId('reminder-id')).toHaveTextContent('none');
        });

        test('passes job_id parameter as preSelectedJobId to ReminderModal', () => {
            mockSearchParams.set('job_id', '999');

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('pre-selected-job-id')).toHaveTextContent('999');
        });

        test('passes selectedJobId as preSelectedJobId when job_id param not present', () => {
            mockUseJob.selectedJobId = 777;

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('pre-selected-job-id')).toHaveTextContent('777');
        });

        test('prefers job_id parameter over selectedJobId', () => {
            mockSearchParams.set('job_id', '888');
            mockUseJob.selectedJobId = 777;

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('pre-selected-job-id')).toHaveTextContent('888');
        });

        test('passes job_id as redirectJobId to ReminderModal', () => {
            mockSearchParams.set('job_id', '555');

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            expect(screen.getByTestId('redirect-job-id')).toHaveTextContent('555');
        });
    });

    describe('Export Functionality', () => {
        test('exports calendar successfully', async () => {
            const mockResponse = {
                calendar_export_dir: '/exports',
                calendar_export_file: 'calendar_2025-01-15.csv',
            };
            apiService.exportCalendar.mockResolvedValue(mockResponse);

            render(<Calendar />);

            const exportButton = screen.getByText('Export Calendar');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportCalendar).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(console.log).toHaveBeenCalledWith(
                    'Calendar exported to: /exports/calendar_2025-01-15.csv'
                );
            });

            // Verify document manipulation for download
            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(document.body.appendChild).toHaveBeenCalled();
            expect(document.body.removeChild).toHaveBeenCalled();
        });

        test('creates download link with correct attributes', async () => {
            const mockResponse = {
                calendar_export_dir: '/exports',
                calendar_export_file: 'calendar_export.csv',
            };
            apiService.exportCalendar.mockResolvedValue(mockResponse);

            let createdLink;
            document.createElement = jest.fn((tag) => {
                createdLink = {
                    href: '',
                    download: '',
                    click: jest.fn(),
                    setAttribute: jest.fn(),
                };
                return createdLink;
            });

            render(<Calendar />);

            const exportButton = screen.getByText('Export Calendar');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(createdLink.href).toBe(
                    'http://api.test.com/v1/files/exports/calendar_export.csv'
                );
                expect(createdLink.download).toBe('calendar_export.csv');
                expect(createdLink.setAttribute).toHaveBeenCalledWith('target', '_blank');
                expect(createdLink.click).toHaveBeenCalled();
            });
        });

        test('handles export error gracefully', async () => {
            apiService.exportCalendar.mockRejectedValue(new Error('Export failed'));

            render(<Calendar />);

            const exportButton = screen.getByText('Export Calendar');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportCalendar).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error exporting calendar:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to export calendar');
            });
        });

        test('handles network error during export', async () => {
            apiService.exportCalendar.mockRejectedValue(new Error('Network error'));

            render(<Calendar />);

            const exportButton = screen.getByText('Export Calendar');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalled();
                expect(window.alert).toHaveBeenCalledWith('Failed to export calendar');
            });
        });
    });

    describe('View Component Props', () => {
        test('passes correct props to MonthView', () => {
            const { container } = render(<Calendar />);

            expect(screen.getByTestId('month-view')).toBeInTheDocument();
            // Props are passed correctly as demonstrated by the mock's ability to trigger callbacks
            expect(screen.getByText('Change Date')).toBeInTheDocument();
            expect(screen.getByText('Switch to Week')).toBeInTheDocument();
            expect(screen.getByText('Click Reminder')).toBeInTheDocument();
        });

        test('passes correct props to WeekView', () => {
            mockSearchParams.set('view', 'week');

            render(<Calendar />);

            expect(screen.getByTestId('week-view')).toBeInTheDocument();
            expect(screen.getByText('Change Date')).toBeInTheDocument();
            expect(screen.getByText('Click Reminder')).toBeInTheDocument();
        });

        test('passes correct props to DayView', () => {
            mockSearchParams.set('view', 'day');

            render(<Calendar />);

            expect(screen.getByTestId('day-view')).toBeInTheDocument();
            expect(screen.getByText('Change Date')).toBeInTheDocument();
            expect(screen.getByText('Click Reminder')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles multiple view switches correctly', () => {
            const { rerender } = render(<Calendar />);

            expect(screen.getByTestId('month-view')).toBeInTheDocument();

            mockSearchParams.set('view', 'week');
            rerender(<Calendar />);

            expect(screen.getByTestId('week-view')).toBeInTheDocument();

            mockSearchParams.set('view', 'day');
            rerender(<Calendar />);

            expect(screen.getByTestId('day-view')).toBeInTheDocument();

            mockSearchParams.set('view', 'month');
            rerender(<Calendar />);

            expect(screen.getByTestId('month-view')).toBeInTheDocument();
        });

        test('handles rapid button clicks gracefully', () => {
            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');

            fireEvent.click(addReminderButton);
            fireEvent.click(addReminderButton);
            fireEvent.click(addReminderButton);

            // Should still only have one modal open
            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
        });

        test('handles navigation with undefined selectedJobId', () => {
            mockUseJob.selectedJobId = undefined;

            render(<Calendar />);

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });

        test('handles navigation with null selectedJobId', () => {
            mockUseJob.selectedJobId = null;

            render(<Calendar />);

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });

        test('preserves view parameter when opening reminder modal', () => {
            mockSearchParams.set('view', 'week');

            render(<Calendar />);

            const addReminderButton = screen.getByText('+ Add Reminder');
            fireEvent.click(addReminderButton);

            // View should still be week
            expect(screen.getByText('Calendar - week view')).toBeInTheDocument();
            expect(screen.getByTestId('week-view')).toBeInTheDocument();
        });

        test('handles both open_reminder and job_id parameters together', () => {
            mockSearchParams.set('open_reminder', 'true');
            mockSearchParams.set('job_id', '123');

            render(<Calendar />);

            expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
            expect(screen.getByTestId('pre-selected-job-id')).toHaveTextContent('123');
            expect(screen.getByTestId('redirect-job-id')).toHaveTextContent('123');
        });
    });
});
