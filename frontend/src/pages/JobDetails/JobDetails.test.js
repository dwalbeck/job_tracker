import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobDetails from './JobDetails';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    ...jest.requireActual('../../services/api'),
    getJob: jest.fn(),
    getResumeDetail: jest.fn(),
    getResume: jest.fn(),
    getAppointments: jest.fn(),
    getReminderList: jest.fn(),
    getNotes: jest.fn(),
    getAllContacts: jest.fn(),
    getBaselineResumeList: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    convertFile: jest.fn(),
    baseURL: 'http://localhost:8000'
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' })
}));

global.alert = jest.fn();
global.confirm = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
});

// Mock document.execCommand
document.execCommand = jest.fn(() => true);

const renderWithRouter = (component, jobId = '1') => {
    return render(
        <MemoryRouter initialEntries={[`/job-details/${jobId}`]}>
            <Routes>
                <Route path="/job-details/:id" element={component} />
            </Routes>
        </MemoryRouter>
    );
};

describe('JobDetails Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
        global.confirm.mockClear();
    });

    const mockJob = {
        job_id: 1,
        company: 'Tech Corp',
        job_title: 'Software Engineer',
        salary: '$120,000',
        location: 'San Francisco, CA',
        interest_level: 8,
        job_status: 'applied',
        date_applied: '2025-01-15',
        last_contact: '2025-01-20',
        job_created: '2025-01-10',
        job_directory: 'tech_corp_software_engineer',
        job_desc: 'Looking for a skilled software engineer',
        posting_url: 'https://example.com/job',
        apply_url: 'https://example.com/apply',
        resume_id: null,
        average_score: 85
    };

    const mockAppointments = [
        {
            calendar_id: 1,
            start_date: '2025-02-01',
            end_date: '2025-02-01',
            start_time: '14:00:00',
            end_time: '15:00:00',
            calendar_type: 'interview',
            participant: ['John Doe', 'Jane Smith'],
            calendar_desc: 'Technical interview',
            outcome_score: 8
        }
    ];

    const mockReminders = [
        {
            reminder_id: 1,
            reminder_date: '2025-02-05',
            reminder_time: '10:00:00',
            reminder_message: 'Follow up on application'
        }
    ];

    const mockNotes = [
        {
            note_id: 1,
            note_title: 'Interview Notes',
            note_content: 'Great discussion about React',
            note_created: '2025-01-21T10:00:00'
        }
    ];

    const mockContacts = [
        {
            contact_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            job_title: 'Hiring Manager',
            email: 'john@example.com',
            phone: '555-1234'
        }
    ];

    const mockBaselineResumes = [
        {
            resume_id: 5,
            resume_title: 'Software Engineer Resume',
            is_default: true
        },
        {
            resume_id: 6,
            resume_title: 'Full Stack Resume',
            is_default: false
        }
    ];

    const mockResumeDetail = {
        resume_id: 10,
        keyword_count: 15,
        focus_count: 5,
        baseline_score: 75,
        rewrite_score: 92
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getJob.mockImplementation(() => new Promise(() => {}));
            apiService.getAppointments.mockImplementation(() => new Promise(() => {}));
            apiService.getReminderList.mockImplementation(() => new Promise(() => {}));
            apiService.getNotes.mockImplementation(() => new Promise(() => {}));
            apiService.getAllContacts.mockImplementation(() => new Promise(() => {}));
            apiService.getBaselineResumeList.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<JobDetails />);

            expect(screen.getByText('Loading job details...')).toBeInTheDocument();
        });

        test('renders job details after loading', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue(mockAppointments);
            apiService.getReminderList.mockResolvedValue(mockReminders);
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Job Details')).toBeInTheDocument();
            });

            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        });

        test('fetches all data on mount', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(apiService.getJob).toHaveBeenCalledWith('1');
            });

            expect(apiService.getAppointments).toHaveBeenCalledWith('1');
            expect(apiService.getReminderList).toHaveBeenCalled();
            expect(apiService.getNotes).toHaveBeenCalledWith('1');
            expect(apiService.getAllContacts).toHaveBeenCalledWith('1');
            expect(apiService.getBaselineResumeList).toHaveBeenCalled();
        });
    });

    describe('Job Information Display', () => {
        test('displays job details correctly', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('$120,000')).toBeInTheDocument();
            expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
            expect(screen.getByText('8/10')).toBeInTheDocument();
        });

        test('shows "Not specified" for missing fields', async () => {
            const jobWithMissingFields = {
                ...mockJob,
                salary: null,
                location: null
            };
            apiService.getJob.mockResolvedValue(jobWithMissingFields);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0);
            });
        });

        test('formats dates correctly', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                // Dates should be formatted using toLocaleDateString
                const dateElements = screen.getAllByText(/\d+\/\d+\/\d+/);
                expect(dateElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Resume Statistics', () => {
        test('displays resume stats when job has resume', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Keyword Count:')).toBeInTheDocument();
            });

            expect(screen.getByText('15')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('75%')).toBeInTheDocument();
            expect(screen.getByText('92%')).toBeInTheDocument();
        });

        test('does not display resume stats when no resume', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.queryByText('Keyword Count:')).not.toBeInTheDocument();
            });
        });

        test('handles resume detail fetch error', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockRejectedValue(new Error('Not found'));
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching resume details:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Navigation and Actions', () => {
        test('navigates back to job tracker', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
        });

        test('navigates to edit form', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-form/1');
        });

        test('navigates to add note', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Add Note')).toBeInTheDocument();
            });

            const addNoteButton = screen.getByText('Add Note');
            fireEvent.click(addNoteButton);

            expect(mockNavigate).toHaveBeenCalledWith('/notes-form?job_id=1');
        });

        test('navigates to add contact', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Add Contact')).toBeInTheDocument();
            });

            const addContactButton = screen.getByText('Add Contact');
            fireEvent.click(addContactButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-form?job_id=1');
        });

        test('navigates to add appointment', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Add Appointment')).toBeInTheDocument();
            });

            const addApptButton = screen.getByText('Add Appointment');
            fireEvent.click(addApptButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form?job_id=1');
        });

        test('navigates to add reminder', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Add Reminder')).toBeInTheDocument();
            });

            const addReminderButton = screen.getByText('Add Reminder');
            fireEvent.click(addReminderButton);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar?view=month&job_id=1&open_reminder=true');
        });
    });

    describe('Status Change', () => {
        test('updates job status', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.updateJob.mockResolvedValue({});
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                const statusSelect = screen.getByRole('combobox');
                expect(statusSelect).toBeInTheDocument();
            });

            const statusSelect = screen.getByRole('combobox');
            fireEvent.change(statusSelect, { target: { value: 'interviewing' } });

            await waitFor(() => {
                expect(apiService.updateJob).toHaveBeenCalledWith(
                    expect.objectContaining({ job_status: 'interviewing' })
                );
            });
        });

        test('handles status update error', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.updateJob.mockRejectedValue(new Error('Update failed'));
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                const statusSelect = screen.getByRole('combobox');
                expect(statusSelect).toBeInTheDocument();
            });

            const statusSelect = screen.getByRole('combobox');
            fireEvent.change(statusSelect, { target: { value: 'interviewing' } });

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to update job status');
            });
        });
    });

    describe('Delete Job', () => {
        test('deletes job with confirmation', async () => {
            global.confirm.mockReturnValue(true);
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.deleteJob.mockResolvedValue({});
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this job?');
            });

            await waitFor(() => {
                expect(apiService.deleteJob).toHaveBeenCalledWith('1');
            });

            expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
        });

        test('does not delete without confirmation', async () => {
            global.confirm.mockReturnValue(false);
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            expect(apiService.deleteJob).not.toHaveBeenCalled();
        });

        test('handles delete error', async () => {
            global.confirm.mockReturnValue(true);
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.deleteJob.mockRejectedValue(new Error('Delete failed'));
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to delete job');
            });
        });
    });

    describe('Copy to Clipboard', () => {
        test('copies posting URL to clipboard', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Copy Posting URL')).toBeInTheDocument();
            });

            const copyButton = screen.getByText('Copy Posting URL');
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/job');
            });

            expect(global.alert).toHaveBeenCalledWith('Posting URL copied to clipboard!');
        });

        test('copies apply URL to clipboard', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Copy Application URL')).toBeInTheDocument();
            });

            const copyButton = screen.getByText('Copy Application URL');
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/apply');
            });

            expect(global.alert).toHaveBeenCalledWith('Application URL copied to clipboard!');
        });

        test('alerts when URL is missing', async () => {
            const jobWithoutUrls = { ...mockJob, posting_url: null };
            apiService.getJob.mockResolvedValue(jobWithoutUrls);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Copy Posting URL')).toBeInTheDocument();
            });

            const copyButton = screen.getByText('Copy Posting URL');
            fireEvent.click(copyButton);

            expect(global.alert).toHaveBeenCalledWith('No Posting URL available');
        });

        test('uses fallback copy method when clipboard API fails', async () => {
            navigator.clipboard.writeText.mockRejectedValue(new Error('Permission denied'));
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Copy Posting URL')).toBeInTheDocument();
            });

            const copyButton = screen.getByText('Copy Posting URL');
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(document.execCommand).toHaveBeenCalledWith('copy');
            });
        });
    });

    describe('Description Modal', () => {
        test('opens description modal', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('View Description')).toBeInTheDocument();
            });

            const viewDescButton = screen.getByText('View Description');
            fireEvent.click(viewDescButton);

            await waitFor(() => {
                expect(screen.getByText('Job Description')).toBeInTheDocument();
            });

            expect(screen.getByText('Looking for a skilled software engineer')).toBeInTheDocument();
        });

        test('closes description modal', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('View Description')).toBeInTheDocument();
            });

            const viewDescButton = screen.getByText('View Description');
            fireEvent.click(viewDescButton);

            await waitFor(() => {
                expect(screen.getByText('Job Description')).toBeInTheDocument();
            });

            const closeButtons = screen.getAllByText('Close');
            fireEvent.click(closeButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('Job Description')).not.toBeInTheDocument();
            });
        });

        test('shows "No job description provided" when missing', async () => {
            const jobWithoutDesc = { ...mockJob, job_desc: null };
            apiService.getJob.mockResolvedValue(jobWithoutDesc);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('View Description')).toBeInTheDocument();
            });

            const viewDescButton = screen.getByText('View Description');
            fireEvent.click(viewDescButton);

            await waitFor(() => {
                expect(screen.getByText('No job description provided')).toBeInTheDocument();
            });
        });
    });

    describe('Resume Actions', () => {
        test('navigates to optimize resume', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Optimize Resume')).toBeInTheDocument();
            });

            const optimizeButton = screen.getByText('Optimize Resume');
            fireEvent.click(optimizeButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-analysis/1?resume_id=5');
        });

        test('alerts if no resume selected for optimization', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Optimize Resume')).toBeInTheDocument();
            });

            const optimizeButton = screen.getByText('Optimize Resume');
            fireEvent.click(optimizeButton);

            expect(global.alert).toHaveBeenCalledWith('Please select a baseline resume first');
        });

        test('shows resume buttons when job has resume', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Download Resume')).toBeInTheDocument();
            });

            expect(screen.getByText('Manage Resume')).toBeInTheDocument();
            expect(screen.getByText('Create Cover Letter')).toBeInTheDocument();
        });

        test('downloads resume', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.convertFile.mockResolvedValue({ file_name: 'resume.docx' });
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            // Mock document methods
            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn(),
                href: ''
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Download Resume')).toBeInTheDocument();
            });

            const downloadButton = screen.getByText('Download Resume');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(apiService.convertFile).toHaveBeenCalledWith(10, 'html', 'docx');
            });
        });

        test('handles download error', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.convertFile.mockRejectedValue(new Error('Download failed'));
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Download Resume')).toBeInTheDocument();
            });

            const downloadButton = screen.getByText('Download Resume');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to download resume'));
            });
        });

        test('navigates to manage resume', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Manage Resume')).toBeInTheDocument();
            });

            const manageButton = screen.getByText('Manage Resume');
            fireEvent.click(manageButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=10&job_id=1');
        });

        test('alerts if no resume for manage action', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.queryByText('Manage Resume')).not.toBeInTheDocument();
            });
        });

        test('navigates to create cover letter', async () => {
            const jobWithResume = { ...mockJob, resume_id: 10 };
            apiService.getJob.mockResolvedValue(jobWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getResume.mockResolvedValue({ baseline_resume_id: 5 });
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Create Cover Letter')).toBeInTheDocument();
            });

            const coverLetterButton = screen.getByText('Create Cover Letter');
            fireEvent.click(coverLetterButton);

            expect(mockNavigate).toHaveBeenCalledWith('/create-cover-letter?job_id=1&resume_id=10');
        });
    });

    describe('Appointments and Reminders', () => {
        test('displays appointments', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue(mockAppointments);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Appointments')).toBeInTheDocument();
            });

            expect(screen.getByText('interview')).toBeInTheDocument();
            expect(screen.getByText('Technical interview')).toBeInTheDocument();
        });

        test('displays reminders', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue(mockReminders);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Follow up on application')).toBeInTheDocument();
            });

            expect(screen.getByText('reminder')).toBeInTheDocument();
        });

        test('shows no data message when empty', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('No appointments or reminders found')).toBeInTheDocument();
            });
        });

        test('navigates to appointment on click', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue(mockAppointments);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Technical interview')).toBeInTheDocument();
            });

            const appointmentRow = screen.getByText('Technical interview').closest('tr');
            fireEvent.click(appointmentRow);

            expect(mockNavigate).toHaveBeenCalledWith('/calendar-form/1?from=job-details&job_id=1');
        });
    });

    describe('Notes', () => {
        test('displays notes', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Notes')).toBeInTheDocument();
            });

            expect(screen.getByText('Interview Notes')).toBeInTheDocument();
            expect(screen.getByText('Great discussion about React')).toBeInTheDocument();
        });

        test('shows no notes message when empty', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('No notes found')).toBeInTheDocument();
            });
        });

        test('navigates to note on click', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Interview Notes')).toBeInTheDocument();
            });

            const noteCard = screen.getByText('Interview Notes').closest('.note-card');
            fireEvent.click(noteCard);

            expect(mockNavigate).toHaveBeenCalledWith('/notes-form/1');
        });
    });

    describe('Contacts', () => {
        test('displays contacts', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contacts')).toBeInTheDocument();
            });

            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByText('Doe')).toBeInTheDocument();
            expect(screen.getByText('Hiring Manager')).toBeInTheDocument();
        });

        test('shows no contacts message when empty', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('No contacts found')).toBeInTheDocument();
            });
        });

        test('navigates to contact on click', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const contactCard = screen.getByText('John').closest('.contact-card');
            fireEvent.click(contactCard);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-details/1');
        });
    });

    describe('Error States', () => {
        test('displays error when job not found', async () => {
            apiService.getJob.mockResolvedValue(null);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue([]);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Job not found')).toBeInTheDocument();
            });
        });

        test('displays error when fetch fails', async () => {
            apiService.getJob.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load job details')).toBeInTheDocument();
            });
        });

        test('handles fetch errors for sub-resources gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockRejectedValue(new Error('Error'));
            apiService.getReminderList.mockRejectedValue(new Error('Error'));
            apiService.getNotes.mockRejectedValue(new Error('Error'));
            apiService.getAllContacts.mockRejectedValue(new Error('Error'));
            apiService.getBaselineResumeList.mockRejectedValue(new Error('Error'));

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Job Details')).toBeInTheDocument();
            });

            // Should still display job details even if sub-resources fail
            expect(screen.getByText('Tech Corp')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });
    });

    describe('Resume Selection', () => {
        test('shows default resume', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('baseline default')).toBeInTheDocument();
            });

            expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
        });

        test('toggles resume selection dropdown', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const resumeDisplay = screen.getByText('Software Engineer Resume').closest('.resume-display');
            fireEvent.click(resumeDisplay);

            await waitFor(() => {
                const select = screen.getByRole('combobox');
                expect(select).toBeInTheDocument();
            });
        });

        test('changes selected resume', async () => {
            apiService.getJob.mockResolvedValue(mockJob);
            apiService.getAppointments.mockResolvedValue([]);
            apiService.getReminderList.mockResolvedValue([]);
            apiService.getNotes.mockResolvedValue([]);
            apiService.getAllContacts.mockResolvedValue([]);
            apiService.getBaselineResumeList.mockResolvedValue(mockBaselineResumes);

            renderWithRouter(<JobDetails />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const resumeDisplay = screen.getByText('Software Engineer Resume').closest('.resume-display');
            fireEvent.click(resumeDisplay);

            await waitFor(() => {
                const select = screen.getByRole('combobox');
                fireEvent.change(select, { target: { value: '6' } });
            });

            await waitFor(() => {
                expect(screen.getByText('Full Stack Resume')).toBeInTheDocument();
            });
        });
    });
});
