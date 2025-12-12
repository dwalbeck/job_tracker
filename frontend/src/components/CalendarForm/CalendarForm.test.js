import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarForm from './CalendarForm';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    getJobList: jest.fn(),
    getCalendarEvent: jest.fn(),
    createCalendarEvent: jest.fn(),
    updateCalendarEvent: jest.fn(),
}));

jest.mock('../../utils/calendarUtils', () => ({
    calculateDuration: jest.fn((startDate, startTime, endDate, endTime) => 1),
    getTimeSlots: jest.fn(() => [
        { value: '09:00', display: '9:00 AM' },
        { value: '10:00', display: '10:00 AM' },
        { value: '14:00', display: '2:00 PM' },
    ]),
}));

jest.mock('../../utils/dateUtils', () => ({
    getTodayDate: jest.fn(() => '2025-03-15'),
}));

// Mock console
const originalConsoleError = console.error;

describe('CalendarForm Component', () => {
    let mockNavigate;
    let mockSearchParams;

    const mockJobs = [
        { job_id: 1, company: 'Tech Corp' },
        { job_id: 2, company: 'Startup Inc' },
        { job_id: 3, company: 'Big Corp' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Setup params mock (no id = add mode)
        require('react-router-dom').useParams.mockReturnValue({});

        // Setup search params mock
        mockSearchParams = new URLSearchParams();
        require('react-router-dom').useSearchParams.mockReturnValue([mockSearchParams]);

        // Default API mocks
        apiService.getJobList.mockResolvedValue(mockJobs);

        console.error = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Component Rendering - Add Mode', () => {
        test('renders add appointment form', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Add New Appointment')).toBeInTheDocument();
            });
        });

        test('renders all form fields', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Calendar Type \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Start Date \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Start Time \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/End Date \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/End Time \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Participants/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Outcome Score/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Outcome Note/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Video Link/)).toBeInTheDocument();
        });

        test('renders submit button with add text', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Appointment')).toBeInTheDocument();
            });
        });

        test('renders cancel button', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });
        });

        test('populates job dropdown with fetched jobs', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Startup Inc')).toBeInTheDocument();
            expect(screen.getByText('Big Corp')).toBeInTheDocument();
        });

        test('renders calendar type options', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                const calendarTypeSelect = screen.getByLabelText(/Calendar Type \*/);
                expect(calendarTypeSelect).toBeInTheDocument();
            });

            expect(screen.getByText('Phone Call')).toBeInTheDocument();
            expect(screen.getByText('Interview')).toBeInTheDocument();
            expect(screen.getByText('On Site')).toBeInTheDocument();
            expect(screen.getByText('Technical')).toBeInTheDocument();
        });

        test('shows duration display', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText(/Duration: 1 hours/)).toBeInTheDocument();
            });

            expect(screen.getByText('Calculated automatically from start and end times')).toBeInTheDocument();
        });
    });

    describe('Component Rendering - Edit Mode', () => {
        test('renders edit appointment form when id provided', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: ['John Doe', 'Jane Smith'],
                calendar_desc: 'Technical screening',
                calendar_note: 'Prepare coding questions',
                outcome_score: 8,
                outcome_note: 'Went well',
                video_link: 'https://zoom.us/meeting',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
            });
        });

        test('shows loading state while fetching appointment data', () => {
            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockImplementation(() => new Promise(() => {}));

            render(<CalendarForm />);

            expect(screen.getByText('Loading appointment data...')).toBeInTheDocument();
        });

        test('populates form with appointment data', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: ['John Doe'],
                calendar_desc: 'Technical screening',
                calendar_note: 'Prepare coding questions',
                outcome_score: null,
                outcome_note: '',
                video_link: '',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Technical screening')).toBeInTheDocument();
            });

            expect(screen.getByDisplayValue('Prepare coding questions')).toBeInTheDocument();
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        });

        test('handles array participant field correctly', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: ['John Doe', 'Jane Smith', 'Bob Johnson'],
                calendar_desc: '',
                calendar_note: '',
                outcome_score: null,
                outcome_note: '',
                video_link: '',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
            });

            expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Bob Johnson')).toBeInTheDocument();
        });

        test('handles non-array participant field correctly', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: 'Single Person',
                calendar_desc: '',
                calendar_note: '',
                outcome_score: null,
                outcome_note: '',
                video_link: '',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Single Person')).toBeInTheDocument();
            });
        });

        test('renders update button in edit mode', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: [],
                calendar_desc: '',
                calendar_note: '',
                outcome_score: null,
                outcome_note: '',
                video_link: '',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Update Appointment')).toBeInTheDocument();
            });
        });
    });

    describe('URL Parameters', () => {
        test('pre-fills date from query parameter', async () => {
            mockSearchParams.set('date', '2025-04-10');
            render(<CalendarForm />);

            await waitFor(() => {
                const startDateInput = screen.getByLabelText(/Start Date \*/);
                expect(startDateInput).toHaveValue('2025-04-10');
            });
        });

        test('pre-fills time from query parameter', async () => {
            mockSearchParams.set('time', '14:00');
            render(<CalendarForm />);

            await waitFor(() => {
                const startTimeInput = screen.getByLabelText(/Start Time \*/);
                expect(startTimeInput).toHaveValue('14:00');
            });
        });

        test('calculates end time as 1 hour after start time', async () => {
            mockSearchParams.set('time', '14:00');
            render(<CalendarForm />);

            await waitFor(() => {
                const endTimeInput = screen.getByLabelText(/End Time \*/);
                expect(endTimeInput).toHaveValue('15:00');
            });
        });

        test('pre-selects job from query parameter', async () => {
            mockSearchParams.set('job_id', '2');
            render(<CalendarForm />);

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Job \*/);
                expect(jobSelect).toHaveValue('2');
            });
        });
    });

    describe('Form Interactions', () => {
        test('auto-populates end date when start date changes', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Start Date \*/)).toBeInTheDocument();
            });

            const startDateInput = screen.getByLabelText(/Start Date \*/);
            const endDateInput = screen.getByLabelText(/End Date \*/);

            fireEvent.change(startDateInput, { target: { value: '2025-05-20' } });

            expect(endDateInput).toHaveValue('2025-05-20');
        });

        test('auto-populates end time when start time changes', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Start Time \*/)).toBeInTheDocument();
            });

            const startTimeInput = screen.getByLabelText(/Start Time \*/);
            const endTimeInput = screen.getByLabelText(/End Time \*/);

            fireEvent.change(startTimeInput, { target: { value: '10:00' } });

            expect(endTimeInput).toHaveValue('11:00');
        });

        test('handles midnight rollover for end time', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Start Time \*/)).toBeInTheDocument();
            });

            const startTimeInput = screen.getByLabelText(/Start Time \*/);
            const endTimeInput = screen.getByLabelText(/End Time \*/);

            fireEvent.change(startTimeInput, { target: { value: '23:30' } });

            expect(endTimeInput).toHaveValue('00:30');
        });

        test('adds participant field when button clicked', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Participant')).toBeInTheDocument();
            });

            const addButton = screen.getByText('+ Add Participant');
            fireEvent.click(addButton);

            const participantInputs = screen.getAllByPlaceholderText('Enter participant name');
            expect(participantInputs).toHaveLength(2);
        });

        test('removes participant field when remove button clicked', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Participant')).toBeInTheDocument();
            });

            // Add a participant first
            fireEvent.click(screen.getByText('+ Add Participant'));

            let participantInputs = screen.getAllByPlaceholderText('Enter participant name');
            expect(participantInputs).toHaveLength(2);

            // Remove one
            const removeButtons = screen.getAllByText('✕');
            fireEvent.click(removeButtons[0]);

            participantInputs = screen.getAllByPlaceholderText('Enter participant name');
            expect(participantInputs).toHaveLength(1);
        });

        test('does not remove last participant field', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                const participantInputs = screen.getAllByPlaceholderText('Enter participant name');
                expect(participantInputs).toHaveLength(1);
            });

            // Should not have remove button when only one participant
            expect(screen.queryByText('✕')).not.toBeInTheDocument();
        });

        test('adds participant on Enter key press', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter participant name')).toBeInTheDocument();
            });

            const participantInput = screen.getByPlaceholderText('Enter participant name');
            fireEvent.keyPress(participantInput, { key: 'Enter', code: 'Enter', charCode: 13 });

            const participantInputs = screen.getAllByPlaceholderText('Enter participant name');
            expect(participantInputs).toHaveLength(2);
        });

        test('updates participant value', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter participant name')).toBeInTheDocument();
            });

            const participantInput = screen.getByPlaceholderText('Enter participant name');
            fireEvent.change(participantInput, { target: { value: 'John Doe' } });

            expect(participantInput).toHaveValue('John Doe');
        });
    });

    describe('Form Submission', () => {
        test('creates new appointment successfully', async () => {
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            // Fill form
            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Calendar Type \*/), { target: { value: 'interview' } });
            fireEvent.change(screen.getByLabelText(/Start Date \*/), { target: { value: '2025-05-10' } });

            // Submit
            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(apiService.createCalendarEvent).toHaveBeenCalled();
            });

            expect(mockNavigate).toHaveBeenCalledWith('/calendar');
        });

        test('filters empty participants before submission', async () => {
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Participant')).toBeInTheDocument();
            });

            // Add multiple participants, leave some empty
            fireEvent.click(screen.getByText('+ Add Participant'));
            fireEvent.click(screen.getByText('+ Add Participant'));

            const participants = screen.getAllByPlaceholderText('Enter participant name');
            fireEvent.change(participants[0], { target: { value: 'John Doe' } });
            // Leave participant[1] empty
            fireEvent.change(participants[2], { target: { value: '  ' } }); // Whitespace only

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(apiService.createCalendarEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        participant: ['John Doe'],
                    })
                );
            });
        });

        test('converts job_id and outcome_score to integers', async () => {
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '2' } });
            fireEvent.change(screen.getByLabelText(/Outcome Score/), { target: { value: '8' } });

            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(apiService.createCalendarEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 2,
                        outcome_score: 8,
                    })
                );
            });
        });

        test('passes null for empty outcome_score', async () => {
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            // Leave outcome_score empty

            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(apiService.createCalendarEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        outcome_score: null,
                    })
                );
            });
        });

        test('updates appointment successfully', async () => {
            const mockAppointment = {
                calendar_id: 1,
                job_id: 1,
                calendar_type: 'interview',
                start_date: '2025-03-20',
                start_time: '10:00',
                end_date: '2025-03-20',
                end_time: '11:00',
                duration_hour: 1,
                participant: [],
                calendar_desc: '',
                calendar_note: '',
                outcome_score: null,
                outcome_note: '',
                video_link: '',
            };

            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockResolvedValue(mockAppointment);
            apiService.updateCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Update Appointment')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Update Appointment'));

            await waitFor(() => {
                expect(apiService.updateCalendarEvent).toHaveBeenCalled();
            });
        });

        test('shows loading state while submitting', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createCalendarEvent.mockReturnValue(promise);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Add Appointment'));

            expect(screen.getByText('Saving...')).toBeInTheDocument();
            expect(screen.getByText('Saving...')).toBeDisabled();

            resolvePromise({});
        });

        test('handles submission error gracefully', async () => {
            apiService.createCalendarEvent.mockRejectedValue(new Error('Save failed'));

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save appointment')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith(
                'Error saving appointment:',
                expect.any(Error)
            );
        });
    });

    describe('Navigation', () => {
        test('navigates to calendar on cancel', async () => {
            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            expect(mockNavigate).toHaveBeenCalledWith('/calendar');
        });

        test('navigates to job details when from parameter is job-details', async () => {
            mockSearchParams.set('from', 'job-details');
            mockSearchParams.set('job_id', '123');
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/123');
            });
        });

        test('navigates to calendar with view parameter', async () => {
            mockSearchParams.set('view', 'week');
            mockSearchParams.set('date', '2025-03-15');
            apiService.createCalendarEvent.mockResolvedValue({});

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job \*/), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Add Appointment'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=week&date=2025-03-15');
            });
        });

        test('cancel navigates with same rules as submit', async () => {
            mockSearchParams.set('view', 'day');
            mockSearchParams.set('date', '2025-03-20');

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=day&date=2025-03-20');
        });
    });

    describe('Edge Cases', () => {
        test('handles empty job list', async () => {
            apiService.getJobList.mockResolvedValue([]);

            render(<CalendarForm />);

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Job \*/);
                expect(jobSelect.options).toHaveLength(1); // Only "Select a job" option
            });
        });

        test('handles job fetch error', async () => {
            apiService.getJobList.mockRejectedValue(new Error('Network error'));

            render(<CalendarForm />);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching jobs:',
                    expect.any(Error)
                );
            });
        });

        test('handles appointment fetch error in edit mode', async () => {
            require('react-router-dom').useParams.mockReturnValue({ id: '1' });
            apiService.getCalendarEvent.mockRejectedValue(new Error('Not found'));

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load appointment data')).toBeInTheDocument();
            });
        });

        test('prevents Enter key from submitting form in participant field', async () => {
            const mockSubmit = jest.fn();
            apiService.createCalendarEvent.mockImplementation(mockSubmit);

            render(<CalendarForm />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter participant name')).toBeInTheDocument();
            });

            const participantInput = screen.getByPlaceholderText('Enter participant name');

            // Press Enter in participant field
            fireEvent.keyPress(participantInput, { key: 'Enter', code: 'Enter', charCode: 13 });

            // Should add participant, not submit form
            expect(mockSubmit).not.toHaveBeenCalled();
            expect(screen.getAllByPlaceholderText('Enter participant name')).toHaveLength(2);
        });
    });
});
