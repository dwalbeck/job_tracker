import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import NotesForm from './NotesForm';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [mockSearchParams],
}));

// Mock console.error
const originalConsoleError = console.error;

describe('NotesForm Component', () => {
    const mockJobs = [
        { job_id: 1, company: 'TechCorp' },
        { job_id: 2, company: 'StartupXYZ' },
        { job_id: 3, company: 'BigCompany' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
        mockSearchParams.delete('job_id');

        // Mock API calls
        apiService.getJobList.mockResolvedValue(mockJobs);
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Add Mode - Component Rendering', () => {
        test('renders form in add mode with correct title', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Add New Note')).toBeInTheDocument();
            });
        });

        test('renders all form fields', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Note Title/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Note Content/)).toBeInTheDocument();
        });

        test('renders required field indicators', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job \*/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Note Title \*/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Note Content \*/)).toBeInTheDocument();
        });

        test('renders action buttons', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            expect(screen.getByText('Add Note')).toBeInTheDocument();
        });

        test('initializes with empty values', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toHaveValue('');
            });

            expect(screen.getByLabelText(/Note Content/)).toHaveValue('');
            expect(screen.getByLabelText(/Job/)).toHaveValue('');
        });

        test('does not show loading state initially in add mode', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading note data...')).not.toBeInTheDocument();
            });
        });
    });

    describe('Job List Population', () => {
        test('fetches job list on mount', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getJobList).toHaveBeenCalled();
            });
        });

        test('populates job dropdown with fetched jobs', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp')).toBeInTheDocument();
            });

            expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
            expect(screen.getByText('BigCompany')).toBeInTheDocument();
        });

        test('displays "Select a job" as default option', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Select a job')).toBeInTheDocument();
            });
        });

        test('handles job list fetch error gracefully', async () => {
            apiService.getJobList.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith('Error fetching jobs:', expect.any(Error));
            });

            // Should still render the form
            expect(screen.getByText('Add New Note')).toBeInTheDocument();
        });

        test('sets empty array when job list returns null', async () => {
            apiService.getJobList.mockResolvedValue(null);

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Select a job')).toBeInTheDocument();
            });

            // Should only have the default "Select a job" option
            const jobSelect = screen.getByLabelText(/Job/);
            const options = jobSelect.querySelectorAll('option');
            expect(options).toHaveLength(1);
        });
    });

    describe('Job Pre-selection via Query Parameter', () => {
        test('pre-selects job when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '2');

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Job/);
                expect(jobSelect).toHaveValue('2');
            });
        });

        test('does not pre-select job when job_id is not in query params', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Job/);
                expect(jobSelect).toHaveValue('');
            });
        });
    });

    describe('Edit Mode - Component Rendering', () => {
        const mockNotes = [
            {
                note_id: 1,
                job_id: 1,
                note_title: 'Interview Prep',
                note_content: 'Review common algorithms and data structures',
            },
            {
                note_id: 2,
                job_id: 2,
                note_title: 'Follow-up',
                note_content: 'Send thank you email to recruiter',
            },
        ];

        beforeEach(() => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('renders form in edit mode with correct title', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Note')).toBeInTheDocument();
            });
        });

        test('shows loading state while fetching note data', () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            expect(screen.getByText('Loading note data...')).toBeInTheDocument();
        });

        test('fetches notes on mount in edit mode', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalled();
            });
        });

        test('finds and populates note by id', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toHaveValue('Interview Prep');
            });

            expect(screen.getByLabelText(/Note Content/)).toHaveValue(
                'Review common algorithms and data structures'
            );
            expect(screen.getByLabelText(/Job/)).toHaveValue('1');
        });

        test('displays Update Note button in edit mode', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Update Note')).toBeInTheDocument();
            });
        });

        test('handles note not found error', async () => {
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '999' });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Note not found')).toBeInTheDocument();
            });
        });

        test('handles fetch error gracefully', async () => {
            apiService.getNotes.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Failed to load note data')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching note:', expect.any(Error));
        });
    });

    describe('Form Field Interactions', () => {
        test('updates job selection on change', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            const jobSelect = screen.getByLabelText(/Job/);
            fireEvent.change(jobSelect, { target: { value: '2' } });

            expect(jobSelect).toHaveValue('2');
        });

        test('updates note title field on change', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toBeInTheDocument();
            });

            const titleInput = screen.getByLabelText(/Note Title/);
            fireEvent.change(titleInput, { target: { value: 'My Note Title' } });

            expect(titleInput).toHaveValue('My Note Title');
        });

        test('updates note content field on change', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Content/)).toBeInTheDocument();
            });

            const contentTextarea = screen.getByLabelText(/Note Content/);
            fireEvent.change(contentTextarea, { target: { value: 'This is my note content' } });

            expect(contentTextarea).toHaveValue('This is my note content');
        });
    });

    describe('Form Submission - Add Mode', () => {
        test('submits form with correct data in add mode', async () => {
            apiService.createNote.mockResolvedValue({ note_id: 1 });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test Title' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), {
                target: { value: 'Test content' },
            });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createNote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 1,
                        note_title: 'Test Title',
                        note_content: 'Test content',
                    })
                );
            });
        });

        test('converts job_id to integer when submitting', async () => {
            apiService.createNote.mockResolvedValue({ note_id: 1 });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '2' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createNote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 2,
                    })
                );
            });
        });

        test('navigates to notes page after successful submission without job_id param', async () => {
            apiService.createNote.mockResolvedValue({ note_id: 1 });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/notes');
            });
        });

        test('navigates to job details when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '3');
            apiService.createNote.mockResolvedValue({ note_id: 1 });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/3');
            });
        });

        test('shows loading state during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createNote.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeInTheDocument();

            resolvePromise({ note_id: 1 });
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalled();
            });
        });

        test('disables buttons during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createNote.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeDisabled();
            expect(screen.getByText('Cancel')).toBeDisabled();

            resolvePromise({ note_id: 1 });
        });

        test('handles submission error gracefully', async () => {
            apiService.createNote.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save note')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error saving note:', expect.any(Error));
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('re-enables buttons after submission error', async () => {
            apiService.createNote.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            const submitButton = screen.getByText('Add Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save note')).toBeInTheDocument();
            });

            expect(screen.getByText('Add Note')).not.toBeDisabled();
            expect(screen.getByText('Cancel')).not.toBeDisabled();
        });
    });

    describe('Form Submission - Edit Mode', () => {
        const mockNotes = [
            {
                note_id: 1,
                job_id: 1,
                note_title: 'Interview Prep',
                note_content: 'Review algorithms',
            },
        ];

        beforeEach(() => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.updateNote.mockResolvedValue({ note_id: 1 });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('calls updateNote with modified data in edit mode', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toHaveValue('Interview Prep');
            });

            fireEvent.change(screen.getByLabelText(/Note Title/), {
                target: { value: 'Updated Title' },
            });

            const submitButton = screen.getByText('Update Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.updateNote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        note_id: 1,
                        note_title: 'Updated Title',
                    })
                );
            });
        });

        test('navigates to notes page after successful update without job_id param', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toHaveValue('Interview Prep');
            });

            const submitButton = screen.getByText('Update Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/notes');
            });
        });

        test('navigates to job details when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '2');

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Title/)).toHaveValue('Interview Prep');
            });

            const submitButton = screen.getByText('Update Note');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/2');
            });
        });
    });

    describe('Cancel Functionality', () => {
        test('navigates to notes page when cancel clicked in add mode without job_id param', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/notes');
        });

        test('navigates to job details when cancel clicked in add mode with job_id param', async () => {
            mockSearchParams.set('job_id', '3');

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/3');
        });

        test('navigates to notes page when cancel clicked in edit mode without job_id param', async () => {
            apiService.getNotes.mockResolvedValue([
                {
                    note_id: 1,
                    job_id: 1,
                    note_title: 'Test',
                    note_content: 'Content',
                },
            ]);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Note')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/notes');
        });

        test('navigates to job details when cancel clicked in edit mode with job_id param', async () => {
            mockSearchParams.set('job_id', '2');
            apiService.getNotes.mockResolvedValue([
                {
                    note_id: 1,
                    job_id: 1,
                    note_title: 'Test',
                    note_content: 'Content',
                },
            ]);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Note')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/2');
        });
    });

    describe('Field Placeholders and Attributes', () => {
        test('displays correct placeholder for note title field', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const titleInput = screen.getByLabelText(/Note Title/);
                expect(titleInput).toHaveAttribute('placeholder', 'Enter a title for your note');
            });
        });

        test('displays correct placeholder for note content field', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const contentTextarea = screen.getByLabelText(/Note Content/);
                expect(contentTextarea).toHaveAttribute('placeholder', 'Enter your note content here...');
            });
        });

        test('note content textarea has 5 rows', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const contentTextarea = screen.getByLabelText(/Note Content/);
                expect(contentTextarea).toHaveAttribute('rows', '5');
            });
        });

        test('note content textarea has auto-expand class', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const contentTextarea = screen.getByLabelText(/Note Content/);
                expect(contentTextarea).toHaveClass('auto-expand');
            });
        });

        test('job field is required', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Job/);
                expect(jobSelect).toBeRequired();
            });
        });

        test('note title field is required', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const titleInput = screen.getByLabelText(/Note Title/);
                expect(titleInput).toBeRequired();
            });
        });

        test('note content field is required', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const contentTextarea = screen.getByLabelText(/Note Content/);
                expect(contentTextarea).toBeRequired();
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles very long note content', async () => {
            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note Content/)).toBeInTheDocument();
            });

            const longContent = 'A'.repeat(5000);
            const contentTextarea = screen.getByLabelText(/Note Content/);
            fireEvent.change(contentTextarea, { target: { value: longContent } });

            expect(contentTextarea).toHaveValue(longContent);
        });

        test('clears error message on successful re-submission', async () => {
            apiService.createNote.mockRejectedValueOnce(new Error('Network error'));
            apiService.createNote.mockResolvedValueOnce({ note_id: 1 });

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/Job/), { target: { value: '1' } });
            fireEvent.change(screen.getByLabelText(/Note Title/), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/Note Content/), { target: { value: 'Content' } });

            // First submission fails
            fireEvent.click(screen.getByText('Add Note'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save note')).toBeInTheDocument();
            });

            // Second submission succeeds
            fireEvent.click(screen.getByText('Add Note'));

            await waitFor(() => {
                expect(screen.queryByText('Failed to save note')).not.toBeInTheDocument();
            });
        });

        test('handles empty job list', async () => {
            apiService.getJobList.mockResolvedValue([]);

            render(
                <BrowserRouter>
                    <NotesForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Select a job')).toBeInTheDocument();
            });

            const jobSelect = screen.getByLabelText(/Job/);
            const options = jobSelect.querySelectorAll('option');
            expect(options).toHaveLength(1); // Only the default "Select a job" option
        });
    });
});
