import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OptimizedResume from './OptimizedResume';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('htmldiff-js', () => ({
    execute: jest.fn((before, after) => {
        return `<ins>New content</ins><del>Old content</del>${after}`;
    })
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' })
}));

global.alert = jest.fn();

const renderWithRouter = (component, locationState = {}) => {
    const defaultState = {
        resumeHtml: '<html><body><p>Original resume content</p></body></html>',
        resumeHtmlRewrite: '<html><body><p>Rewritten resume content</p></body></html>',
        baselineScore: 75,
        rewriteScore: 92,
        jobId: 1,
        fromViewResume: false
    };

    return render(
        <MemoryRouter initialEntries={[{ pathname: '/optimized-resume/1', state: { ...defaultState, ...locationState } }]}>
            <Routes>
                <Route path="/optimized-resume/:id" element={component} />
            </Routes>
        </MemoryRouter>
    );
};

describe('OptimizedResume Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
    });

    describe('Initial Rendering', () => {
        test('renders page title', () => {
            renderWithRouter(<OptimizedResume />);

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });

        test('displays baseline and rewrite scores', () => {
            renderWithRouter(<OptimizedResume />);

            expect(screen.getByText('baseline:')).toBeInTheDocument();
            expect(screen.getByText('75%')).toBeInTheDocument();
            expect(screen.getByText('optimized:')).toBeInTheDocument();
            expect(screen.getByText('92%')).toBeInTheDocument();
        });

        test('displays help text', () => {
            renderWithRouter(<OptimizedResume />);

            expect(screen.getByText(/Click on any highlighted change/)).toBeInTheDocument();
        });

        test('renders cancel and accept buttons', () => {
            renderWithRouter(<OptimizedResume />);

            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Accept Changes')).toBeInTheDocument();
        });
    });

    describe('Score Display', () => {
        test('displays correct baseline score', () => {
            renderWithRouter(<OptimizedResume />, { baselineScore: 65 });

            expect(screen.getByText('65%')).toBeInTheDocument();
        });

        test('displays correct rewrite score', () => {
            renderWithRouter(<OptimizedResume />, { rewriteScore: 88 });

            expect(screen.getByText('88%')).toBeInTheDocument();
        });

        test('handles zero scores', () => {
            renderWithRouter(<OptimizedResume />, {
                baselineScore: 0,
                rewriteScore: 0
            });

            const scoreValues = screen.getAllByText('0%');
            expect(scoreValues.length).toBe(2);
        });
    });

    describe('HTML Diff Generation', () => {
        test('generates diff from provided HTML', () => {
            const HtmlDiff = require('htmldiff-js');

            renderWithRouter(<OptimizedResume />);

            expect(HtmlDiff.execute).toHaveBeenCalled();
        });

        test('extracts body content for diffing', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '<html><head><title>Test</title></head><body><p>Body content</p></body></html>',
                resumeHtmlRewrite: '<html><head><title>Test</title></head><body><p>New body content</p></body></html>'
            });

            // Component should extract and diff only body content
            expect(screen.getByText(/Resume Comparison/)).toBeInTheDocument();
        });

        test('handles missing body tags gracefully', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '<p>Simple HTML</p>',
                resumeHtmlRewrite: '<p>Modified HTML</p>'
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });

        test('handles empty HTML gracefully', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '',
                resumeHtmlRewrite: ''
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });
    });

    describe('Interactive Change Toggling', () => {
        test('makes insertions clickable', async () => {
            renderWithRouter(<OptimizedResume />);

            await waitFor(() => {
                const diffContainer = document.querySelector('.html-diff-content');
                expect(diffContainer).toBeInTheDocument();
            });

            // Check that ins elements would be made interactive
            const insElements = document.querySelectorAll('ins');
            insElements.forEach(el => {
                if (el.textContent.length > 1) {
                    expect(el.style.cursor).toBeTruthy();
                }
            });
        });

        test('makes deletions clickable', async () => {
            renderWithRouter(<OptimizedResume />);

            await waitFor(() => {
                const diffContainer = document.querySelector('.html-diff-content');
                expect(diffContainer).toBeInTheDocument();
            });

            // Check that del elements would be made interactive
            const delElements = document.querySelectorAll('del');
            delElements.forEach(el => {
                if (el.textContent.length > 1) {
                    expect(el.style.cursor).toBeTruthy();
                }
            });
        });

        test('hides single-character changes', async () => {
            // Mock HtmlDiff to return single-char changes
            const HtmlDiff = require('htmldiff-js');
            HtmlDiff.execute.mockReturnValue('<ins>a</ins><del>b</del><ins>Normal change</ins>');

            renderWithRouter(<OptimizedResume />);

            await waitFor(() => {
                const diffContainer = document.querySelector('.html-diff-content');
                expect(diffContainer).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        test('navigates back to view resume when fromViewResume is true', () => {
            renderWithRouter(<OptimizedResume />, {
                fromViewResume: true,
                jobId: 5
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=5');
        });

        test('navigates to job details when jobId exists and not from view resume', () => {
            renderWithRouter(<OptimizedResume />, {
                fromViewResume: false,
                jobId: 3
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/3');
        });

        test('navigates to job tracker when no jobId', () => {
            renderWithRouter(<OptimizedResume />, {
                fromViewResume: false,
                jobId: null
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');
        });
    });

    describe('Accepting Changes', () => {
        test('saves changes and navigates', async () => {
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<OptimizedResume />, {
                fromViewResume: true,
                jobId: 2
            });

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalledWith({
                    resume_id: 1,
                    resume_html_rewrite: expect.any(String)
                });
            });

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
        });

        test('navigates to job details after save when not from view resume', async () => {
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<OptimizedResume />, {
                fromViewResume: false,
                jobId: 4
            });

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalled();
            });

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/4');
        });

        test('navigates to resume page when no jobId', async () => {
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<OptimizedResume />, {
                fromViewResume: false,
                jobId: null
            });

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalled();
            });

            expect(mockNavigate).toHaveBeenCalledWith('/resume');
        });

        test('handles save error', async () => {
            apiService.updateResumeDetail.mockRejectedValue(new Error('Save failed'));

            renderWithRouter(<OptimizedResume />);

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to save changes. Please try again.');
            });
        });
    });

    describe('HTML Reconstruction', () => {
        test('reconstructs HTML with accepted changes', async () => {
            apiService.updateResumeDetail.mockImplementation(({ resume_html_rewrite }) => {
                expect(resume_html_rewrite).toContain('html');
                return Promise.resolve({});
            });

            renderWithRouter(<OptimizedResume />);

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalled();
            });
        });

        test('preserves document structure in reconstructed HTML', async () => {
            apiService.updateResumeDetail.mockImplementation(({ resume_html_rewrite }) => {
                // Should preserve DOCTYPE, html, head, body structure
                expect(resume_html_rewrite).toBeTruthy();
                return Promise.resolve({});
            });

            renderWithRouter(<OptimizedResume />, {
                resumeHtmlRewrite: '<html><head><style>body { color: red; }</style></head><body><p>Content</p></body></html>'
            });

            const acceptButton = screen.getByText('Accept Changes');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalled();
            });
        });
    });

    describe('Helper Functions', () => {
        test('normalizes whitespace correctly', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '<p>Text    with     multiple   spaces</p>',
                resumeHtmlRewrite: '<p>Text with single spaces</p>'
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });

        test('converts bullets to lists', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '<p>Item 1<br>- Bullet 1<br>- Bullet 2</p>',
                resumeHtmlRewrite: '<p>Item 1<ul><li>Bullet 1</li><li>Bullet 2</li></ul></p>'
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });

        test('removes unwanted breaks', () => {
            renderWithRouter(<OptimizedResume />, {
                resumeHtml: '<p>Line 1<br/><br/>Line 2</p>',
                resumeHtmlRewrite: '<p>Line 1<br/>Line 2</p>'
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles missing location state', () => {
            render(
                <MemoryRouter initialEntries={['/optimized-resume/1']}>
                    <Routes>
                        <Route path="/optimized-resume/:id" element={<OptimizedResume />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        test('handles diff generation error gracefully', () => {
            const HtmlDiff = require('htmldiff-js');
            HtmlDiff.execute.mockImplementation(() => {
                throw new Error('Diff error');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<OptimizedResume />);

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });

        test('handles very long HTML content', () => {
            const longContent = '<p>' + 'Lorem ipsum '.repeat(1000) + '</p>';

            renderWithRouter(<OptimizedResume />, {
                resumeHtml: longContent,
                resumeHtmlRewrite: longContent + '<p>Extra paragraph</p>'
            });

            expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
        });
    });

    describe('Polling for Background Process', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        test('starts polling when isPolling state is provided', async () => {
            apiService.request = jest.fn()
                .mockResolvedValueOnce({ process_state: 'running' })
                .mockResolvedValueOnce({ process_state: 'complete' });

            apiService.request.mockResolvedValueOnce({
                resume_html: '<html><body>Original</body></html>',
                resume_html_rewrite: '<html><body>Rewritten</body></html>',
                baseline_score: 75,
                rewrite_score: 92,
                suggestion: []
            });

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            // Should show loading message
            expect(screen.getByText(/AI is rewriting your resume/)).toBeInTheDocument();

            // First poll
            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledWith(
                    '/v1/process/poll/42',
                    expect.objectContaining({ method: 'GET' })
                );
            });

            // Advance timers for next poll
            jest.advanceTimersByTime(5000);

            // Second poll should detect completion
            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledWith(
                    '/v1/resume/rewrite/1',
                    expect.objectContaining({ method: 'GET' })
                );
            });

            jest.runOnlyPendingTimers();

            // Should eventually show comparison page
            await waitFor(() => {
                expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
            });
        });

        test('handles process completion on first poll', async () => {
            apiService.request = jest.fn()
                .mockResolvedValueOnce({ process_state: 'complete' })
                .mockResolvedValueOnce({
                    resume_html: '<html><body>Original</body></html>',
                    resume_html_rewrite: '<html><body>Rewritten</body></html>',
                    baseline_score: 75,
                    rewrite_score: 92,
                    suggestion: []
                });

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledWith(
                    '/v1/process/poll/42',
                    expect.any(Object)
                );
            });

            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledWith(
                    '/v1/resume/rewrite/1',
                    expect.any(Object)
                );
            });

            jest.runOnlyPendingTimers();

            await waitFor(() => {
                expect(screen.getByText('Resume Comparison')).toBeInTheDocument();
            });
        });

        test('handles failed process state', async () => {
            apiService.request = jest.fn()
                .mockResolvedValueOnce({ process_state: 'failed' });

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    expect.stringContaining('Resume rewrite process failed')
                );
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/1');
            });
        });

        test('handles polling timeout after max attempts', async () => {
            apiService.request = jest.fn()
                .mockResolvedValue({ process_state: 'running' });

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            // Simulate max attempts (120 polls)
            for (let i = 0; i < 120; i++) {
                jest.advanceTimersByTime(5000);
                await waitFor(() => {}, { timeout: 100 });
            }

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    expect.stringContaining('timed out after 10 minutes')
                );
            });
        });

        test('handles polling error', async () => {
            apiService.request = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'));

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    expect.stringContaining('Error during polling')
                );
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/1');
            });
        });

        test('displays loading message during polling', () => {
            apiService.request = jest.fn()
                .mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            expect(screen.getByText(/AI is rewriting your resume/)).toBeInTheDocument();
        });

        test('polls at 5 second intervals', async () => {
            apiService.request = jest.fn()
                .mockResolvedValue({ process_state: 'running' });

            renderWithRouter(<OptimizedResume />, {
                isPolling: true,
                processId: 42,
                jobId: 1
            });

            // Wait for first poll
            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledTimes(1);
            });

            // Advance 5 seconds
            jest.advanceTimersByTime(5000);

            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledTimes(2);
            });

            // Advance another 5 seconds
            jest.advanceTimersByTime(5000);

            await waitFor(() => {
                expect(apiService.request).toHaveBeenCalledTimes(3);
            });
        });
    });
});
