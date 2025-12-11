import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ViewResume from './ViewResume';
import apiService from '../../services/api';
import { API_BASE_URL } from '../../config';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams({ resume_id: '1' })]
}));

const mockNavigate = jest.fn();
global.alert = jest.fn();

const renderWithRouter = (component, initialRoute = '/view-resume?resume_id=1') => {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            {component}
        </MemoryRouter>
    );
};

describe('ViewResume Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
    });

    const mockResumeDetail = {
        resume_id: 1,
        resume_html: '<html><body><h1>John Doe</h1><p>Software Engineer</p></body></html>',
        resume_html_rewrite: '<html><body><h1>John Doe</h1><p>Senior Software Engineer</p></body></html>',
        resume_keyword: ['JavaScript', 'React', 'Node.js'],
        keyword_final: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        focus_final: ['React', 'TypeScript'],
        suggestion: ['Add more details about projects', 'Include quantifiable achievements'],
        baseline_score: 75,
        rewrite_score: 92
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<ViewResume />);

            expect(screen.getByText('Loading resume...')).toBeInTheDocument();
        });

        test('renders view resume page after loading', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Resume')).toBeInTheDocument();
            });

            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.getByText('Download odt')).toBeInTheDocument();
            expect(screen.getByText('Download docx')).toBeInTheDocument();
            expect(screen.getByText('Download pdf')).toBeInTheDocument();
        });

        test('fetches resume detail on mount', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(apiService.getResumeDetail).toHaveBeenCalledWith('1');
            });
        });
    });

    describe('Tabs', () => {
        test('renders all tab options', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Resume')).toBeInTheDocument();
            });

            expect(screen.getByText('View Suggestions')).toBeInTheDocument();
            expect(screen.getByText('View Keyword Lists')).toBeInTheDocument();
            expect(screen.getByText('Compare')).toBeInTheDocument();
        });

        test('resume tab is active by default', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                const tabs = screen.getAllByText('View Resume');
                const tabElement = tabs.find(el => el.className.includes('tab-item'));
                expect(tabElement).toHaveClass('active');
            });
        });

        test('switches to suggestions tab on click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Suggestions')).toBeInTheDocument();
            });

            const suggestionsTab = screen.getByText('View Suggestions');
            fireEvent.click(suggestionsTab);

            await waitFor(() => {
                expect(suggestionsTab).toHaveClass('active');
            });
        });

        test('switches to keywords tab on click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Keyword Lists')).toBeInTheDocument();
            });

            const keywordsTab = screen.getByText('View Keyword Lists');
            fireEvent.click(keywordsTab);

            await waitFor(() => {
                expect(keywordsTab).toHaveClass('active');
            });
        });

        test('does not show compare tab if no rewrite exists', async () => {
            const resumeWithoutRewrite = { ...mockResumeDetail, resume_html_rewrite: null };
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutRewrite);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Resume')).toBeInTheDocument();
            });

            expect(screen.queryByText('Compare')).not.toBeInTheDocument();
        });
    });

    describe('Resume Content Display', () => {
        test('displays resume in iframe', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe).toBeInTheDocument();
            });
        });

        test('uses rewritten HTML if available', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe.getAttribute('srcdoc')).toContain('Senior Software Engineer');
            });
        });

        test('falls back to baseline HTML if no rewrite', async () => {
            const resumeWithoutRewrite = { ...mockResumeDetail, resume_html_rewrite: null };
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutRewrite);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe.getAttribute('srcdoc')).toContain('Software Engineer');
            });
        });

        test('shows no content message if no HTML', async () => {
            const emptyResume = { ...mockResumeDetail, resume_html: null, resume_html_rewrite: null };
            apiService.getResumeDetail.mockResolvedValue(emptyResume);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('No resume content available')).toBeInTheDocument();
            });
        });
    });

    describe('Suggestions Display', () => {
        test('displays suggestions when tab is clicked', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Suggestions')).toBeInTheDocument();
            });

            const suggestionsTab = screen.getByText('View Suggestions');
            fireEvent.click(suggestionsTab);

            await waitFor(() => {
                expect(screen.getByText('Add more details about projects')).toBeInTheDocument();
            });

            expect(screen.getByText('Include quantifiable achievements')).toBeInTheDocument();
        });

        test('shows no suggestions message if empty', async () => {
            const resumeWithoutSuggestions = { ...mockResumeDetail, suggestion: [] };
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutSuggestions);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Suggestions')).toBeInTheDocument();
            });

            const suggestionsTab = screen.getByText('View Suggestions');
            fireEvent.click(suggestionsTab);

            await waitFor(() => {
                expect(screen.getByText('No suggestions available')).toBeInTheDocument();
            });
        });
    });

    describe('Keywords Display', () => {
        test('displays keywords when tab is clicked', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Keyword Lists')).toBeInTheDocument();
            });

            const keywordsTab = screen.getByText('View Keyword Lists');
            fireEvent.click(keywordsTab);

            await waitFor(() => {
                expect(screen.getByText('JavaScript')).toBeInTheDocument();
            });

            expect(screen.getByText('React')).toBeInTheDocument();
            expect(screen.getByText('TypeScript')).toBeInTheDocument();
        });

        test('displays focus keywords section', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Keyword Lists')).toBeInTheDocument();
            });

            const keywordsTab = screen.getByText('View Keyword Lists');
            fireEvent.click(keywordsTab);

            await waitFor(() => {
                expect(screen.getByText('Focused Keywords')).toBeInTheDocument();
            });
        });

        test('shows no keywords message if empty', async () => {
            const resumeWithoutKeywords = {
                ...mockResumeDetail,
                keyword_final: [],
                resume_keyword: []
            };
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutKeywords);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('View Keyword Lists')).toBeInTheDocument();
            });

            const keywordsTab = screen.getByText('View Keyword Lists');
            fireEvent.click(keywordsTab);

            await waitFor(() => {
                expect(screen.getByText('No keywords available')).toBeInTheDocument();
            });
        });
    });

    describe('Download Functionality', () => {
        test('downloads resume in different formats', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.convertFile.mockResolvedValue({ file_name: 'resume.docx' });
            apiService.getPersonalInfo.mockResolvedValue({
                first_name: 'John',
                last_name: 'Doe'
            });

            // Mock document methods
            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn()
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Download docx')).toBeInTheDocument();
            });

            const downloadButton = screen.getByText('Download docx');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(apiService.convertFile).toHaveBeenCalledWith(1, 'html', 'docx');
            });
        });

        test('disables download buttons while downloading', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.convertFile.mockImplementation(() => new Promise(() => {})); // Never resolves
            apiService.getPersonalInfo.mockResolvedValue({
                first_name: 'John',
                last_name: 'Doe'
            });

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Download pdf')).toBeInTheDocument();
            });

            const downloadButton = screen.getByText('Download pdf');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(screen.getByText('Download odt')).toBeDisabled();
            });

            expect(screen.getByText('Download docx')).toBeDisabled();
            expect(screen.getByText('Download pdf')).toBeDisabled();
        });

        test('handles download error', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.convertFile.mockRejectedValue(new Error('Conversion failed'));

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Download pdf')).toBeInTheDocument();
            });

            const downloadButton = screen.getByText('Download pdf');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to download resume');
            });
        });
    });

    describe('Navigation', () => {
        test('navigates back to resume page when no job_id', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Done')).toBeInTheDocument();
            });

            const doneButton = screen.getByText('Done');
            fireEvent.click(doneButton);

            expect(mockNavigate).toHaveBeenCalledWith('/resume');
        });

        test('navigates to edit page on edit click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getPersonalInfo.mockResolvedValue({ tinymce_api_key: '' });

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/edit-resume'));
            });
        });

        test('navigates to TinyMCE editor if API key exists', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getPersonalInfo.mockResolvedValue({
                tinymce_api_key: 'test-api-key'
            });

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/manually-edit-resume'));
            });
        });

        test('navigates to compare page on compare click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Compare')).toBeInTheDocument();
            });

            const compareButton = screen.getByText('Compare');
            fireEvent.click(compareButton);

            expect(mockNavigate).toHaveBeenCalledWith(
                '/optimized-resume/1',
                expect.objectContaining({
                    state: expect.objectContaining({
                        fromViewResume: true
                    })
                })
            );
        });
    });

    describe('Error Handling', () => {
        test('displays error message when fetch fails', async () => {
            apiService.getResumeDetail.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume details')).toBeInTheDocument();
            });
        });

        test('displays error when resume not found', async () => {
            apiService.getResumeDetail.mockResolvedValue(null);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Resume not found')).toBeInTheDocument();
            });
        });

        test('handles edit navigation error gracefully', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.getPersonalInfo.mockRejectedValue(new Error('API error'));

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            await waitFor(() => {
                // Should fallback to manual editor on error
                expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/edit-resume'));
            });
        });
    });

    describe('Back Button', () => {
        test('renders back button', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });
        });

        test('back button navigates correctly', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ViewResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/resume');
        });
    });
});
