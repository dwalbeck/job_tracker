import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import JobForm from './JobForm';
import apiService from '../../services/api';
import { getTodayDate, formatDateForInput } from '../../utils/dateUtils';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../utils/dateUtils');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
}));

// Mock console.error
const originalConsoleError = console.error;

describe('JobForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();

        // Mock date utilities
        getTodayDate.mockReturnValue('2025-03-15');
        formatDateForInput.mockImplementation((date) => date);
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Add Mode - Component Rendering', () => {
        test('renders form in add mode with correct title', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByText('Add New Job')).toBeInTheDocument();
        });

        test('renders all form fields', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Salary/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Interest Level/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Job Status/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Date Applied/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Posting URL/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Apply URL/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Job Description/)).toBeInTheDocument();
        });

        test('renders required field indicators', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByLabelText(/Company \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Job Title \*/)).toBeInTheDocument();
        });

        test('renders action buttons', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Add Job')).toBeInTheDocument();
        });

        test('initializes with default values', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByLabelText(/Company/)).toHaveValue('');
            expect(screen.getByLabelText(/Job Title/)).toHaveValue('');
            expect(screen.getByLabelText(/Interest Level/)).toHaveValue('5');
            expect(screen.getByLabelText(/Job Status/)).toHaveValue('applied');
            expect(screen.getByLabelText(/Date Applied/)).toHaveValue('2025-03-15');
        });

        test('does not show loading state initially in add mode', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.queryByText('Loading job data...')).not.toBeInTheDocument();
        });
    });

    describe('Edit Mode - Component Rendering', () => {
        const mockJobData = {
            job_id: 1,
            company: 'TechCorp',
            job_title: 'Senior Software Engineer',
            salary: '$120,000 - $150,000',
            location: 'San Francisco, CA',
            interest_level: 8,
            posting_url: 'https://example.com/job',
            apply_url: 'https://example.com/apply',
            job_desc: 'Great opportunity for a senior developer',
            job_status: 'interviewing',
            date_applied: '2025-03-01',
        };

        beforeEach(() => {
            apiService.getJob.mockResolvedValue(mockJobData);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('renders form in edit mode with correct title', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Job')).toBeInTheDocument();
            });
        });

        test('shows loading state while fetching job data', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByText('Loading job data...')).toBeInTheDocument();
        });

        test('fetches job data on mount in edit mode', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getJob).toHaveBeenCalledWith('1');
            });
        });

        test('populates form with fetched job data', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Company/)).toHaveValue('TechCorp');
            });

            expect(screen.getByLabelText(/Job Title/)).toHaveValue('Senior Software Engineer');
            expect(screen.getByLabelText(/Salary/)).toHaveValue('$120,000 - $150,000');
            expect(screen.getByLabelText(/Location/)).toHaveValue('San Francisco, CA');
            expect(screen.getByLabelText(/Interest Level/)).toHaveValue('8');
            expect(screen.getByLabelText(/Job Status/)).toHaveValue('interviewing');
            expect(screen.getByLabelText(/Posting URL/)).toHaveValue('https://example.com/job');
            expect(screen.getByLabelText(/Apply URL/)).toHaveValue('https://example.com/apply');
            expect(screen.getByLabelText(/Job Description/)).toHaveValue(
                'Great opportunity for a senior developer'
            );
        });

        test('displays Update Job button in edit mode', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Update Job')).toBeInTheDocument();
            });
        });

        test('handles fetch error gracefully', async () => {
            apiService.getJob.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Failed to load job data')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching job:', expect.any(Error));
        });
    });

    describe('Form Field Interactions', () => {
        test('updates company field on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const companyInput = screen.getByLabelText(/Company/);
            fireEvent.change(companyInput, { target: { value: 'NewCorp' } });

            expect(companyInput).toHaveValue('NewCorp');
        });

        test('updates job title field on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const jobTitleInput = screen.getByLabelText(/Job Title/);
            fireEvent.change(jobTitleInput, { target: { value: 'Backend Developer' } });

            expect(jobTitleInput).toHaveValue('Backend Developer');
        });

        test('updates salary field on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const salaryInput = screen.getByLabelText(/Salary/);
            fireEvent.change(salaryInput, { target: { value: '$100,000 - $120,000' } });

            expect(salaryInput).toHaveValue('$100,000 - $120,000');
        });

        test('updates location field on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const locationInput = screen.getByLabelText(/Location/);
            fireEvent.change(locationInput, { target: { value: 'New York, NY' } });

            expect(locationInput).toHaveValue('New York, NY');
        });

        test('updates interest level on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const interestSelect = screen.getByLabelText(/Interest Level/);
            fireEvent.change(interestSelect, { target: { value: '9' } });

            expect(interestSelect).toHaveValue('9');
        });

        test('updates job status on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const statusSelect = screen.getByLabelText(/Job Status/);
            fireEvent.change(statusSelect, { target: { value: 'rejected' } });

            expect(statusSelect).toHaveValue('rejected');
        });

        test('updates date applied on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const dateInput = screen.getByLabelText(/Date Applied/);
            fireEvent.change(dateInput, { target: { value: '2025-03-20' } });

            expect(dateInput).toHaveValue('2025-03-20');
        });

        test('updates posting URL on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const postingUrlInput = screen.getByLabelText(/Posting URL/);
            fireEvent.change(postingUrlInput, { target: { value: 'https://jobs.example.com' } });

            expect(postingUrlInput).toHaveValue('https://jobs.example.com');
        });

        test('updates apply URL on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const applyUrlInput = screen.getByLabelText(/Apply URL/);
            fireEvent.change(applyUrlInput, { target: { value: 'https://apply.example.com' } });

            expect(applyUrlInput).toHaveValue('https://apply.example.com');
        });

        test('updates job description on change', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const jobDescTextarea = screen.getByLabelText(/Job Description/);
            fireEvent.change(jobDescTextarea, { target: { value: 'Looking for a talented developer' } });

            expect(jobDescTextarea).toHaveValue('Looking for a talented developer');
        });
    });

    describe('Interest Level Options', () => {
        test('renders all 10 interest level options', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const interestSelect = screen.getByLabelText(/Interest Level/);
            const options = interestSelect.querySelectorAll('option');

            expect(options).toHaveLength(10);
        });

        test('displays correct labels for interest levels', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const interestSelect = screen.getByLabelText(/Interest Level/);

            // Low levels (1-3)
            expect(interestSelect.querySelector('option[value="1"]')).toHaveTextContent('1 - Low');
            expect(interestSelect.querySelector('option[value="3"]')).toHaveTextContent('3 - Low');

            // Medium levels (4-7)
            expect(interestSelect.querySelector('option[value="5"]')).toHaveTextContent('5 - Medium');
            expect(interestSelect.querySelector('option[value="7"]')).toHaveTextContent('7 - Medium');

            // High levels (8-10)
            expect(interestSelect.querySelector('option[value="8"]')).toHaveTextContent('8 - High');
            expect(interestSelect.querySelector('option[value="10"]')).toHaveTextContent('10 - High');
        });
    });

    describe('Job Status Options', () => {
        test('renders all job status options', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const statusSelect = screen.getByLabelText(/Job Status/);
            const options = statusSelect.querySelectorAll('option');

            expect(options).toHaveLength(4);
        });

        test('displays correct status labels', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const statusSelect = screen.getByLabelText(/Job Status/);

            expect(statusSelect.querySelector('option[value="applied"]')).toHaveTextContent('Applied');
            expect(statusSelect.querySelector('option[value="interviewing"]')).toHaveTextContent('Interviewing');
            expect(statusSelect.querySelector('option[value="rejected"]')).toHaveTextContent('Rejected');
            expect(statusSelect.querySelector('option[value="no response"]')).toHaveTextContent('No Response');
        });
    });

    describe('Form Submission - Add Mode', () => {
        test('submits form with correct data in add mode', async () => {
            apiService.createJob.mockResolvedValue({ job_id: 1 });

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        company: 'TestCorp',
                        job_title: 'Developer',
                        job_status: 'applied',
                        interest_level: 5,
                        date_applied: '2025-03-15',
                    })
                );
            });
        });

        test('navigates to job tracker after successful submission', async () => {
            apiService.createJob.mockResolvedValue({ job_id: 1 });

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
            });
        });

        test('shows loading state during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createJob.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeInTheDocument();

            resolvePromise({ job_id: 1 });
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalled();
            });
        });

        test('disables buttons during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createJob.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeDisabled();
            expect(screen.getByText('Cancel')).toBeDisabled();

            resolvePromise({ job_id: 1 });
        });

        test('handles submission error gracefully', async () => {
            apiService.createJob.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save job')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error saving job:', expect.any(Error));
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('re-enables buttons after submission error', async () => {
            apiService.createJob.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            const submitButton = screen.getByText('Add Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save job')).toBeInTheDocument();
            });

            expect(screen.getByText('Add Job')).not.toBeDisabled();
            expect(screen.getByText('Cancel')).not.toBeDisabled();
        });
    });

    describe('Form Submission - Edit Mode', () => {
        const mockJobData = {
            job_id: 1,
            company: 'TechCorp',
            job_title: 'Senior Software Engineer',
            salary: '$120,000',
            location: 'San Francisco, CA',
            interest_level: 8,
            posting_url: 'https://example.com/job',
            apply_url: 'https://example.com/apply',
            job_desc: 'Great opportunity',
            job_status: 'interviewing',
            date_applied: '2025-03-01',
        };

        beforeEach(() => {
            apiService.getJob.mockResolvedValue(mockJobData);
            apiService.updateJob.mockResolvedValue({ job_id: 1 });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('calls updateJob with modified data in edit mode', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Company/)).toHaveValue('TechCorp');
            });

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'UpdatedCorp' } });

            const submitButton = screen.getByText('Update Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.updateJob).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 1,
                        company: 'UpdatedCorp',
                    })
                );
            });
        });

        test('navigates to job tracker after successful update', async () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Company/)).toHaveValue('TechCorp');
            });

            const submitButton = screen.getByText('Update Job');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
            });
        });
    });

    describe('Cancel Functionality', () => {
        test('navigates to job tracker when cancel clicked in add mode', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
        });

        test('navigates to job tracker when cancel clicked in edit mode', async () => {
            apiService.getJob.mockResolvedValue({
                job_id: 1,
                company: 'TechCorp',
                job_title: 'Developer',
                date_applied: '2025-03-01',
            });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Job')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
        });
    });

    describe('Field Placeholders', () => {
        test('displays correct placeholder for salary field', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const salaryInput = screen.getByLabelText(/Salary/);
            expect(salaryInput).toHaveAttribute('placeholder', 'e.g., $70,000 - $90,000');
        });

        test('displays correct placeholder for location field', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const locationInput = screen.getByLabelText(/Location/);
            expect(locationInput).toHaveAttribute('placeholder', 'e.g., San Francisco, CA');
        });

        test('displays correct placeholder for URL fields', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const postingUrlInput = screen.getByLabelText(/Posting URL/);
            const applyUrlInput = screen.getByLabelText(/Apply URL/);

            expect(postingUrlInput).toHaveAttribute('placeholder', 'https://...');
            expect(applyUrlInput).toHaveAttribute('placeholder', 'https://...');
        });

        test('displays correct placeholder for job description', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const jobDescTextarea = screen.getByLabelText(/Job Description/);
            expect(jobDescTextarea).toHaveAttribute('placeholder', 'Enter the full job description...');
        });
    });

    describe('Date Utility Integration', () => {
        test('calls getTodayDate for initial date_applied value', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(getTodayDate).toHaveBeenCalled();
            expect(screen.getByLabelText(/Date Applied/)).toHaveValue('2025-03-15');
        });

        test('calls formatDateForInput when loading job data', async () => {
            apiService.getJob.mockResolvedValue({
                job_id: 1,
                company: 'TechCorp',
                job_title: 'Developer',
                date_applied: '2025-03-01',
            });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(formatDateForInput).toHaveBeenCalledWith('2025-03-01');
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles very long job description', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const longDescription = 'A'.repeat(5000);
            const jobDescTextarea = screen.getByLabelText(/Job Description/);
            fireEvent.change(jobDescTextarea, { target: { value: longDescription } });

            expect(jobDescTextarea).toHaveValue(longDescription);
        });

        test('clears error message on successful re-submission', async () => {
            apiService.createJob.mockRejectedValueOnce(new Error('Network error'));
            apiService.createJob.mockResolvedValueOnce({ job_id: 1 });

            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            fireEvent.change(screen.getByLabelText(/Company/), { target: { value: 'TestCorp' } });
            fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Developer' } });

            // First submission fails
            fireEvent.click(screen.getByText('Add Job'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save job')).toBeInTheDocument();
            });

            // Second submission succeeds
            fireEvent.click(screen.getByText('Add Job'));

            await waitFor(() => {
                expect(screen.queryByText('Failed to save job')).not.toBeInTheDocument();
            });
        });

        test('renders calendar icon for date input', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            expect(screen.getByText('📅')).toBeInTheDocument();
        });

        test('textarea has correct number of rows', () => {
            render(
                <BrowserRouter>
                    <JobForm />
                </BrowserRouter>
            );

            const jobDescTextarea = screen.getByLabelText(/Job Description/);
            expect(jobDescTextarea).toHaveAttribute('rows', '36');
        });
    });
});
