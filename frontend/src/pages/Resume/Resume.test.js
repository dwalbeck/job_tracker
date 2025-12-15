import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Resume from './Resume';
import apiService from '../../services/api';
import { API_BASE_URL } from '../../config';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../components/ExportMenu/ExportMenu', () => {
    return function MockExportMenu({ label, onExport }) {
        return <button onClick={onExport}>{label}</button>;
    };
});

// Mock window.location
delete window.location;
window.location = { href: '' };

// Mock window.confirm
global.confirm = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('Resume Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.location.href = '';
        global.confirm.mockReturnValue(true);
    });

    const mockBaselineResumes = [
        {
            resume_id: 1,
            resume_title: 'Software Engineer Resume',
            is_baseline: true,
            is_default: true,
            keyword_count: 15,
            focus_count: 5,
            resume_created: '2025-01-01T10:00:00',
            resume_updated: '2025-01-10T10:00:00'
        },
        {
            resume_id: 2,
            resume_title: 'Data Scientist Resume',
            is_baseline: true,
            is_default: false,
            keyword_count: 12,
            focus_count: 4,
            resume_created: '2025-01-05T10:00:00',
            resume_updated: null
        }
    ];

    const mockJobResumes = [
        {
            resume_id: 3,
            company: 'Tech Corp',
            job_title: 'Senior Developer',
            job_id: 1,
            baseline_resume_id: 1,
            keyword_count: 18,
            focus_count: 6,
            baseline_score: 75,
            rewrite_score: 92,
            resume_created: '2025-01-15T10:00:00',
            resume_updated: '2025-01-20T10:00:00'
        }
    ];

    describe('Initial Rendering', () => {
        test('renders loading state initially', () => {
            apiService.getBaselineResumes.mockReturnValue(new Promise(() => {}));
            global.fetch.mockReturnValue(new Promise(() => {}));

            render(<Resume />);

            expect(screen.getByText('Loading resumes...')).toBeInTheDocument();
        });

        test('renders page title and controls after loading', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Resume')).toBeInTheDocument();
            });

            expect(screen.getByPlaceholderText('Search resumes...')).toBeInTheDocument();
            expect(screen.getByText('Add New')).toBeInTheDocument();
            expect(screen.getByText('Export Resumes')).toBeInTheDocument();
        });

        test('renders baseline and job sections', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Baseline')).toBeInTheDocument();
            });

            expect(screen.getByText('Customized for Jobs')).toBeInTheDocument();
        });
    });

    describe('Baseline Resumes', () => {
        test('displays baseline resumes correctly', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            expect(screen.getByText('Data Scientist Resume')).toBeInTheDocument();
        });

        test('displays keyword and focus counts', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getAllByText('Keywords').length).toBeGreaterThan(0);
            });

            expect(screen.getAllByText('Focus').length).toBeGreaterThan(0);
        });

        test('shows no resumes message when empty', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('No baseline resumes found')).toBeInTheDocument();
            });
        });
    });

    describe('Job Resumes', () => {
        test('displays job resumes correctly', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Senior Developer')).toBeInTheDocument();
        });

        test('displays baseline and rewrite scores', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('75%')).toBeInTheDocument();
            });

            expect(screen.getByText('92%')).toBeInTheDocument();
        });

        test('shows no resumes message when empty', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('No job-specific resumes found')).toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        test('filters baseline resumes by title', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search resumes...');
            fireEvent.change(searchInput, { target: { value: 'Software' } });

            expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            expect(screen.queryByText('Data Scientist Resume')).not.toBeInTheDocument();
        });

        test('filters job resumes by company or title', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search resumes...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        });

        test('shows clear search button when searching', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search resumes...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search resumes...');
            fireEvent.change(searchInput, { target: { value: 'test' } });

            const clearButton = screen.getByText('✕');
            expect(clearButton).toBeInTheDocument();
        });

        test('clears search when clicking clear button', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search resumes...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search resumes...');
            fireEvent.change(searchInput, { target: { value: 'test' } });

            const clearButton = screen.getByText('✕');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
        });
    });

    describe('Resume Actions', () => {
        test('navigates to view resume when clicking title', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({
                json: async () => []
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const resumeTitle = screen.getByText('Software Engineer Resume');
            fireEvent.click(resumeTitle);

            expect(window.location.href).toBe('/view-resume?resume_id=1');
        });

        test('clones baseline resume successfully', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch
                .mockResolvedValueOnce({ json: async () => [] })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ resume_id: 4, resume_title: 'Cloned Resume' })
                });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const cloneButtons = screen.getAllByText('Clone');
            fireEvent.click(cloneButtons[0]);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/v1/resume/clone'),
                    expect.any(Object)
                );
            });
        });

        test('deletes resume with confirmation', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch
                .mockResolvedValueOnce({ json: async () => [] })
                .mockResolvedValueOnce({ ok: true });

            global.confirm.mockReturnValue(true);

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this resume?');
            });
        });

        test('does not delete resume without confirmation', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch.mockResolvedValue({ json: async () => [] });

            global.confirm.mockReturnValue(false);

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            expect(global.fetch).not.toHaveBeenCalledWith(
                expect.stringContaining('/v1/resume?resume_id='),
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        test('sets resume as default', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            global.fetch
                .mockResolvedValueOnce({ json: async () => [] })
                .mockResolvedValueOnce({ ok: true });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Data Scientist Resume')).toBeInTheDocument();
            });

            const setDefaultButton = screen.getByText('Set as Default');
            fireEvent.click(setDefaultButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/v1/resume'),
                    expect.objectContaining({ method: 'POST' })
                );
            });
        });

        test('navigates to edit page on edit click', async () => {
            apiService.getBaselineResumes.mockResolvedValue(mockBaselineResumes);
            apiService.getPersonalInfo.mockResolvedValue({ tinymce_api_key: '' });
            global.fetch.mockResolvedValue({ json: async () => [] });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
            });

            const editButtons = screen.getAllByText('Edit');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(window.location.href).toContain('/edit-resume?resume_id=1');
            });
        });

        test('navigates to tailor page for job resume', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({
                json: async () => mockJobResumes
            });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const tailorButton = screen.getByText('Tailor');
            fireEvent.click(tailorButton);

            expect(window.location.href).toContain('/job-analysis/1?resume_id=1');
        });
    });

    describe('Add New and Export', () => {
        test('navigates to resume form on add new click', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockResolvedValue({ json: async () => [] });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Add New')).toBeInTheDocument();
            });

            const addButton = screen.getByText('Add New');
            fireEvent.click(addButton);

            expect(window.location.href).toBe('/resume-form');
        });

        test('exports resumes', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            apiService.exportResumes.mockResolvedValue({
                resume_export_dir: '/tmp',
                resume_export_file: 'resumes.csv'
            });
            global.fetch.mockResolvedValue({ json: async () => [] });

            // Mock document methods
            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn()
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText('Export Resumes')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Resumes');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportResumes).toHaveBeenCalled();
            });
        });
    });

    describe('Error Handling', () => {
        test('handles baseline resumes fetch error', async () => {
            apiService.getBaselineResumes.mockRejectedValue(new Error('Network error'));
            global.fetch.mockResolvedValue({ json: async () => [] });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            render(<Resume />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching baseline resumes:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles job resumes fetch error', async () => {
            apiService.getBaselineResumes.mockResolvedValue([]);
            global.fetch.mockRejectedValue(new Error('Network error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            render(<Resume />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching job resumes:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Date Calculations', () => {
        test('displays last edit in days for recent edits', async () => {
            const recentResume = [{
                resume_id: 1,
                resume_title: 'Recent Resume',
                is_baseline: true,
                is_default: false,
                keyword_count: 10,
                focus_count: 3,
                resume_created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                resume_updated: null
            }];

            apiService.getBaselineResumes.mockResolvedValue(recentResume);
            global.fetch.mockResolvedValue({ json: async () => [] });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText(/Last edit 2 days ago/)).toBeInTheDocument();
            });
        });

        test('displays last edit in weeks for older edits', async () => {
            const oldResume = [{
                resume_id: 1,
                resume_title: 'Old Resume',
                is_baseline: true,
                is_default: false,
                keyword_count: 10,
                focus_count: 3,
                resume_created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                resume_updated: null
            }];

            apiService.getBaselineResumes.mockResolvedValue(oldResume);
            global.fetch.mockResolvedValue({ json: async () => [] });

            render(<Resume />);

            await waitFor(() => {
                expect(screen.getByText(/Last edit 3 weeks ago/)).toBeInTheDocument();
            });
        });
    });
});
