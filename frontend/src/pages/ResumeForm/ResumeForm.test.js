import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ResumeForm from './ResumeForm';
import apiService from '../../services/api';
import { API_BASE_URL } from '../../config';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ state: null })
}));

// Mock fetch
global.fetch = jest.fn();
global.alert = jest.fn();

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('ResumeForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.alert.mockClear();
    });

    const mockJobList = [
        { job_id: 1, company: 'Tech Corp', job_title: 'Software Engineer' },
        { job_id: 2, company: 'Data Inc', job_title: 'Data Scientist' }
    ];

    describe('Initial Rendering', () => {
        test('renders add new resume form', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            expect(screen.getByText('Add New Resume')).toBeInTheDocument();
            expect(screen.getByText('File Upload')).toBeInTheDocument();
            expect(screen.getByText('For Job')).toBeInTheDocument();
            expect(screen.getByText('Resume Title')).toBeInTheDocument();
        });

        test('fetches job list on mount', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(apiService.getJobList).toHaveBeenCalled();
            });
        });

        test('displays job list in dropdown', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                const select = screen.getByRole('combobox');
                expect(select).toBeInTheDocument();
            });

            const options = screen.getAllByRole('option');
            expect(options.length).toBe(3); // Including default option
        });
    });

    describe('File Upload', () => {
        test('displays selected file name', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');

            fireEvent.change(fileInput, { target: { files: [file] } });

            await waitFor(() => {
                const displayInput = screen.getByPlaceholderText('No file selected');
                expect(displayInput.value).toBe('resume.pdf');
            });
        });

        test('accepts PDF files', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            expect(fileInput.accept).toBe('.pdf,.docx,.odt');
        });
    });

    describe('Job Selection', () => {
        test('changes form when job is selected', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByRole('combobox')).toBeInTheDocument();
            });

            const jobSelect = screen.getByRole('combobox');
            fireEvent.change(jobSelect, { target: { value: '1' } });

            // Resume title should be hidden when job is selected
            await waitFor(() => {
                expect(screen.queryByText('Resume Title')).not.toBeInTheDocument();
            });
        });

        test('shows resume title and baseline when no job selected', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Resume Title')).toBeInTheDocument();
            });

            expect(screen.getByText('Baseline')).toBeInTheDocument();
        });

        test('clears baseline when job is selected', async () => {
            apiService.getJobList.mockResolvedValue(mockJobList);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByRole('combobox')).toBeInTheDocument();
            });

            const jobSelect = screen.getByRole('combobox');
            fireEvent.change(jobSelect, { target: { value: '1' } });

            // Baseline checkbox should not be visible
            await waitFor(() => {
                const baselineCheckboxes = screen.queryAllByRole('checkbox');
                const baselineCheckbox = baselineCheckboxes.find(cb =>
                    cb.parentElement.textContent.includes('Baseline')
                );
                expect(baselineCheckbox).toBeUndefined();
            });
        });
    });

    describe('Baseline and Default Checkboxes', () => {
        test('baseline checkbox controls default checkbox', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Baseline')).toBeInTheDocument();
            });

            const checkboxes = screen.getAllByRole('checkbox');
            const baselineCheckbox = checkboxes.find(cb =>
                cb.parentElement.textContent.includes('Baseline')
            );
            const defaultCheckbox = checkboxes.find(cb =>
                cb.parentElement.textContent.includes('Default')
            );

            // Uncheck baseline
            fireEvent.click(baselineCheckbox);

            // Default should be disabled
            expect(defaultCheckbox).toBeDisabled();
        });

        test('default is disabled when baseline is unchecked', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Baseline')).toBeInTheDocument();
            });

            const checkboxes = screen.getAllByRole('checkbox');
            const baselineCheckbox = checkboxes.find(cb =>
                cb.parentElement.textContent.includes('Baseline')
            );

            // Uncheck baseline
            fireEvent.click(baselineCheckbox);

            const defaultCheckbox = checkboxes.find(cb =>
                cb.parentElement.textContent.includes('Default')
            );
            expect(defaultCheckbox).toBeDisabled();
        });
    });

    describe('Form Validation', () => {
        test('shows alert when no file selected', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            expect(global.alert).toHaveBeenCalledWith('Please select a file to upload');
        });

        test('shows alert when no title or job selected', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            // Select a file but no title
            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Please provide a resume title or select a job');
            });
        });
    });

    describe('Form Submission', () => {
        test('submits form with valid data', async () => {
            apiService.getJobList.mockResolvedValue([]);
            apiService.getResume.mockResolvedValue({
                resume_id: 1,
                original_format: 'pdf'
            });
            apiService.convertFile.mockResolvedValue({
                file: 'resume.html',
                file_content: '<html>Resume</html>'
            });
            apiService.updateResumeDetail.mockResolvedValue({});
            apiService.updateResume.mockResolvedValue({});
            apiService.extractResume.mockResolvedValue({
                job_title: 'Software Engineer',
                suggestions: ['Improve formatting', 'Add metrics']
            });

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resume_id: 1 })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            // Fill in form
            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/v1/resume'),
                    expect.objectContaining({ method: 'POST' })
                );
            });
        });

        test('shows processing steps during submission', async () => {
            apiService.getJobList.mockResolvedValue([]);
            apiService.getResume.mockResolvedValue({
                resume_id: 1,
                original_format: 'pdf'
            });
            apiService.convertFile.mockResolvedValue({
                file: 'resume.html',
                file_content: '<html>Resume</html>'
            });
            apiService.updateResumeDetail.mockResolvedValue({});
            apiService.updateResume.mockResolvedValue({});
            apiService.extractResume.mockResolvedValue({
                job_title: 'Engineer',
                suggestions: []
            });

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resume_id: 1 })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Processing uploaded resume file')).toBeInTheDocument();
            });
        });

        test('displays suggestions after processing', async () => {
            apiService.getJobList.mockResolvedValue([]);
            apiService.getResume.mockResolvedValue({
                resume_id: 1,
                original_format: 'pdf'
            });
            apiService.convertFile.mockResolvedValue({
                file: 'resume.html',
                file_content: '<html>Resume</html>'
            });
            apiService.updateResumeDetail.mockResolvedValue({});
            apiService.updateResume.mockResolvedValue({});
            apiService.extractResume.mockResolvedValue({
                job_title: 'Engineer',
                suggestions: ['Add more details', 'Update skills section']
            });

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resume_id: 1 })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Suggestions for Improvement')).toBeInTheDocument();
            }, { timeout: 3000 });

            expect(screen.getByText('Add more details')).toBeInTheDocument();
            expect(screen.getByText('Update skills section')).toBeInTheDocument();
        });
    });

    describe('Cancel and Done Buttons', () => {
        test('cancel button is visible and enabled', async () => {
            apiService.getJobList.mockResolvedValue([]);

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            expect(cancelButton).not.toBeDisabled();
        });

        test('buttons are disabled during processing', async () => {
            apiService.getJobList.mockResolvedValue([]);
            apiService.getResume.mockResolvedValue({
                resume_id: 1,
                original_format: 'pdf'
            });
            apiService.convertFile.mockResolvedValue({
                file: 'resume.html',
                file_content: '<html>Resume</html>'
            });
            apiService.updateResumeDetail.mockResolvedValue({});
            apiService.updateResume.mockResolvedValue({});
            apiService.extractResume.mockImplementation(() => new Promise(() => {})); // Never resolves

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resume_id: 1 })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Processing uploaded resume file')).toBeInTheDocument();
            });

            expect(screen.getByText('Cancel')).toBeDisabled();
            expect(screen.getByText('Add Resume')).toBeDisabled();
        });
    });

    describe('Error Handling', () => {
        test('handles file upload error', async () => {
            apiService.getJobList.mockResolvedValue([]);

            global.fetch.mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({ detail: 'Invalid file format' })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Invalid file format'));
            });
        });

        test('handles extraction error', async () => {
            apiService.getJobList.mockResolvedValue([]);
            apiService.getResume.mockResolvedValue({
                resume_id: 1,
                original_format: 'pdf'
            });
            apiService.convertFile.mockResolvedValue({
                file: 'resume.html',
                file_content: '<html>Resume</html>'
            });
            apiService.updateResumeDetail.mockResolvedValue({});
            apiService.updateResume.mockResolvedValue({});
            apiService.extractResume.mockRejectedValue(new Error('Extraction failed'));

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resume_id: 1 })
            });

            renderWithRouter(<ResumeForm />);

            await waitFor(() => {
                expect(screen.getByText('Add Resume')).toBeInTheDocument();
            });

            const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByLabelText('Browse').querySelector('input[type="file"]');
            fireEvent.change(fileInput, { target: { files: [file] } });

            const titleInput = screen.getByRole('textbox');
            fireEvent.change(titleInput, { target: { value: 'My Resume' } });

            const submitButton = screen.getByText('Add Resume');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error extracting resume data'));
            });
        });
    });
});
