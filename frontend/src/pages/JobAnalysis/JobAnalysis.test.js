import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobAnalysis from './JobAnalysis';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
    useSearchParams: () => [new URLSearchParams({ resume_id: '5' })]
}));

global.alert = jest.fn();

const renderWithRouter = (component, jobId = '1', resumeId = '5') => {
    return render(
        <MemoryRouter initialEntries={[`/job-analysis/${jobId}?resume_id=${resumeId}`]}>
            <Routes>
                <Route path="/job-analysis/:id" element={component} />
            </Routes>
        </MemoryRouter>
    );
};

describe('JobAnalysis Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    const mockJobData = {
        job_qualification: 'Experience with React, JavaScript, and Node.js is required. Python knowledge is a plus.',
        keywords: ['React', 'JavaScript', 'Node.js', 'Python']
    };

    const mockJobDetails = {
        job_id: 1,
        company: 'Tech Corp',
        job_title: 'Software Engineer',
        job_status: 'applied',
        resume_id: null
    };

    const mockResumeDetail = {
        resume_id: 5,
        keyword_final: ['React', 'JavaScript'],
        focus_final: ['React']
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.extractJobData.mockImplementation(() => new Promise(() => {}));
            apiService.getJob.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<JobAnalysis />);

            expect(screen.getByText('Analyzing job description with AI...')).toBeInTheDocument();
        });

        test('renders page after loading', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
            });

            expect(screen.getByText('Qualifications')).toBeInTheDocument();
            expect(screen.getByText('Keywords')).toBeInTheDocument();
        });

        test('fetches job data on mount', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(apiService.extractJobData).toHaveBeenCalledWith('1');
            });

            expect(apiService.getJob).toHaveBeenCalledWith('1');
        });

        test('displays qualifications text', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText(/Experience with React/)).toBeInTheDocument();
            });
        });
    });

    describe('Keyword Loading', () => {
        test('displays extracted keywords', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            // Wait for component to load and timers to run
            await waitFor(() => {
                expect(screen.getByText('Keywords')).toBeInTheDocument();
            });

            jest.runAllTimers();

            await waitFor(() => {
                expect(screen.getByText(/React/)).toBeInTheDocument();
            });
        });

        test('loads existing keywords for repeat run', async () => {
            const jobDetailsWithResume = { ...mockJobDetails, resume_id: 5 };
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(jobDetailsWithResume);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(apiService.getResumeDetail).toHaveBeenCalledWith(5);
            });
        });

        test('handles missing resume details gracefully', async () => {
            const jobDetailsWithResume = { ...mockJobDetails, resume_id: 5 };
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(jobDetailsWithResume);
            apiService.getResumeDetail.mockRejectedValue(new Error('Not found'));

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Could not fetch resume details:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('displays error when fetch fails', async () => {
            apiService.extractJobData.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load job description. Please try again.')).toBeInTheDocument();
            });
        });

        test('displays timeout error message', async () => {
            const timeoutError = new Error('Timeout');
            timeoutError.isTimeout = true;
            apiService.extractJobData.mockRejectedValue(timeoutError);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText(/Request timed out/)).toBeInTheDocument();
            });
        });

        test('displays error for invalid job ID', async () => {
            const mockNavigateInvalid = jest.fn();
            jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigateInvalid);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: 'undefined' });

            apiService.extractJobData.mockResolvedValue(mockJobData);

            renderWithRouter(<JobAnalysis />, 'undefined', '5');

            await waitFor(() => {
                expect(screen.getByText('Failed to load job description. Please try again.')).toBeInTheDocument();
            });
        });

        test('logs console error on fetch failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Network error');
            apiService.extractJobData.mockRejectedValue(error);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching job data:', error);
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Navigation', () => {
        test('renders cancel button', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });
        });

        test('navigates back on cancel', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/1');
        });
    });

    describe('Keyword Deletion', () => {
        test('renders delete buttons for keywords', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Keywords')).toBeInTheDocument();
            });

            jest.runAllTimers();

            await waitFor(() => {
                const deleteButtons = screen.getAllByTitle('Delete keyword');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Finalize Process', () => {
        test('renders finalize button', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });
        });

        test('shows alert if no keywords selected', async () => {
            apiService.extractJobData.mockResolvedValue({ ...mockJobData, keywords: [] });
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            expect(global.alert).toHaveBeenCalledWith('Please select at least one keyword or focus area');
        });

        test('processes finalization successfully with polling', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockResolvedValue({ resume_id: 10 });
            // New polling behavior: rewriteResume returns process_id
            apiService.rewriteResume.mockResolvedValue({
                process_id: 42
            });

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(apiService.resumeFull).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(apiService.rewriteResume).toHaveBeenCalledWith('1');
            });

            // Should navigate to OptimizedResume with polling state
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(
                    '/optimized-resume/10',
                    expect.objectContaining({
                        state: expect.objectContaining({
                            processId: 42,
                            jobId: '1',
                            isPolling: true
                        })
                    })
                );
            });
        });

        test('shows loading message during finalization', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockImplementation(() => new Promise(() => {}));
            apiService.rewriteResume.mockResolvedValue({ resume_id: 10 });

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(screen.getByText(/Create resume for Job posting/)).toBeInTheDocument();
            });
        });

        test('disables buttons during processing', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeDisabled();
            });

            expect(screen.getByText('Cancel')).toBeDisabled();
        });

        test('handles finalization error', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockRejectedValue(new Error('Finalization failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Finalization failed');
            });

            consoleSpy.mockRestore();
        });

        test('handles timeout error during finalization', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            const timeoutError = new Error('Timeout');
            timeoutError.isTimeout = true;
            apiService.resumeFull.mockRejectedValue(timeoutError);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Request timed out'));
            });
        });

        test('calls resumeFull with correct parameters', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockResolvedValue({ resume_id: 10 });
            apiService.rewriteResume.mockResolvedValue({
                process_id: 42
            });

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(apiService.resumeFull).toHaveBeenCalledWith(
                    '1',
                    '5',
                    expect.any(Array),
                    expect.any(Array)
                );
            });
        });
    });

    describe('Loading States', () => {
        test('shows initial loading message', () => {
            apiService.extractJobData.mockImplementation(() => new Promise(() => {}));
            apiService.getJob.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<JobAnalysis />);

            expect(screen.getByText('Analyzing job description with AI...')).toBeInTheDocument();
        });

        test('hides loading after successful fetch', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.queryByText('Analyzing job description with AI...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
        });
    });

    describe('Section Rendering', () => {
        test('renders qualifications section', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Qualifications')).toBeInTheDocument();
            });
        });

        test('renders keywords section', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Keywords')).toBeInTheDocument();
            });
        });

        test('renders button container', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            expect(screen.getByText('Finalize')).toBeInTheDocument();
        });
    });

    describe('Resume ID Handling', () => {
        test('uses resume_id from URL params', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);
            apiService.resumeFull.mockResolvedValue({ resume_id: 10 });
            apiService.rewriteResume.mockResolvedValue({
                process_id: 42
            });

            renderWithRouter(<JobAnalysis />, '1', '42');

            await waitFor(() => {
                expect(screen.getByText('Finalize')).toBeInTheDocument();
            });

            jest.runAllTimers();

            const finalizeButton = screen.getByText('Finalize');
            fireEvent.click(finalizeButton);

            await waitFor(() => {
                expect(apiService.resumeFull).toHaveBeenCalledWith(
                    '1',
                    '42',
                    expect.any(Array),
                    expect.any(Array)
                );
            });
        });
    });

    describe('Keyword Counts', () => {
        test('displays keyword counts', async () => {
            apiService.extractJobData.mockResolvedValue(mockJobData);
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Keywords')).toBeInTheDocument();
            });

            jest.runAllTimers();

            // Keywords should show with count in format: "Keyword (count)"
            await waitFor(() => {
                const keywordElements = screen.queryAllByText(/\(\d+\)/);
                expect(keywordElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Empty States', () => {
        test('handles empty keywords array', async () => {
            apiService.extractJobData.mockResolvedValue({
                job_qualification: 'Some text',
                keywords: []
            });
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Keywords')).toBeInTheDocument();
            });
        });

        test('handles empty qualification text', async () => {
            apiService.extractJobData.mockResolvedValue({
                job_qualification: '',
                keywords: ['React']
            });
            apiService.getJob.mockResolvedValue(mockJobDetails);

            renderWithRouter(<JobAnalysis />);

            await waitFor(() => {
                expect(screen.getByText('Qualifications')).toBeInTheDocument();
            });
        });
    });
});
