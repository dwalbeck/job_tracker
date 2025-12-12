import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import EditResume from './EditResume';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams({ resume_id: '1', job_id: '2' })]
}));

global.alert = jest.fn();

const renderWithRouter = (component, params = { resume_id: '1', job_id: '2' }) => {
    const searchString = new URLSearchParams(params).toString();
    return render(
        <MemoryRouter initialEntries={[`/edit-resume?${searchString}`]}>
            {component}
        </MemoryRouter>
    );
};

describe('EditResume Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
    });

    const mockResumeDetail = {
        resume_id: 1,
        resume_html: '<html><body><h1>John Doe</h1><p>Software Engineer</p></body></html>',
        resume_html_rewrite: '<html><body><h1>John Doe</h1><p>Senior Software Engineer</p></body></html>',
        resume_keyword: ['JavaScript', 'React'],
        keyword_final: ['JavaScript', 'React', 'Node.js'],
        focus_final: ['React'],
        suggestion: ['Add more details'],
        baseline_score: 75,
        rewrite_score: 92
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<EditResume />);

            expect(screen.getByText('Loading resume...')).toBeInTheDocument();
        });

        test('renders editor after loading', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit Resume')).toBeInTheDocument();
            });

            expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
        });

        test('fetches resume detail on mount', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(apiService.getResumeDetail).toHaveBeenCalledWith('1');
            });
        });

        test('renders page title', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit Resume')).toBeInTheDocument();
            });
        });
    });

    describe('Content Loading', () => {
        test('loads rewritten HTML if available', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
                expect(textarea.value).toContain('Senior Software Engineer');
            });
        });

        test('falls back to baseline HTML if no rewrite', async () => {
            const resumeWithoutRewrite = { ...mockResumeDetail, resume_html_rewrite: null };
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutRewrite);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
                expect(textarea.value).toContain('Software Engineer');
                expect(textarea.value).not.toContain('Senior');
            });
        });

        test('handles empty HTML content', async () => {
            const emptyResume = { ...mockResumeDetail, resume_html: null, resume_html_rewrite: null };
            apiService.getResumeDetail.mockResolvedValue(emptyResume);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
                expect(textarea.value).toBe('');
            });
        });

        test('displays HTML content in textarea', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
                expect(textarea.value).toContain('<html>');
                expect(textarea.value).toContain('</html>');
            });
        });
    });

    describe('HTML Editing', () => {
        test('allows editing HTML content', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            fireEvent.change(textarea, {
                target: { value: '<html><body><h1>Updated Content</h1></body></html>' }
            });

            expect(textarea.value).toContain('Updated Content');
        });

        test('textarea updates on change', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            const newContent = '<p>New paragraph</p>';

            fireEvent.change(textarea, { target: { value: newContent } });

            expect(textarea.value).toBe(newContent);
        });

        test('preserves whitespace and formatting in textarea', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            const formattedContent = `<html>
  <body>
    <h1>Title</h1>
  </body>
</html>`;

            fireEvent.change(textarea, { target: { value: formattedContent } });

            expect(textarea.value).toBe(formattedContent);
        });
    });

    describe('Preview Toggle', () => {
        test('shows raw HTML by default', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            expect(screen.getByText('Show Preview')).toBeInTheDocument();
        });

        test('toggles to preview mode', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Show Preview')).toBeInTheDocument();
            });

            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText('Show Raw HTML')).toBeInTheDocument();
            });

            expect(screen.getByTitle('Resume Preview')).toBeInTheDocument();
        });

        test('toggles back to raw HTML mode', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Show Preview')).toBeInTheDocument();
            });

            // Toggle to preview
            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText('Show Raw HTML')).toBeInTheDocument();
            });

            // Toggle back to raw HTML
            const showRawButton = screen.getByText('Show Raw HTML');
            fireEvent.click(showRawButton);

            await waitFor(() => {
                expect(screen.getByText('Show Preview')).toBeInTheDocument();
            });

            expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
        });

        test('displays iframe in preview mode', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Show Preview')).toBeInTheDocument();
            });

            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe).toBeInTheDocument();
                expect(iframe.getAttribute('srcdoc')).toContain('Senior Software Engineer');
            });
        });

        test('iframe has sandbox attribute', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Show Preview')).toBeInTheDocument();
            });

            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin');
            });
        });

        test('preview reflects edited content', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            // Edit content
            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            const newContent = '<html><body><h1>Custom Title</h1></body></html>';
            fireEvent.change(textarea, { target: { value: newContent } });

            // Toggle to preview
            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                const iframe = screen.getByTitle('Resume Preview');
                expect(iframe.getAttribute('srcdoc')).toContain('Custom Title');
            });
        });
    });

    describe('Save Functionality', () => {
        test('saves changes successfully', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalledWith({
                    resume_id: 1,
                    resume_html_rewrite: mockResumeDetail.resume_html_rewrite
                });
            });
        });

        test('saves edited content', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            // Edit content
            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            const editedContent = '<html><body><h1>Edited Resume</h1></body></html>';
            fireEvent.change(textarea, { target: { value: editedContent } });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalledWith({
                    resume_id: 1,
                    resume_html_rewrite: editedContent
                });
            });
        });

        test('shows saving state while saving', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Saving...')).toBeInTheDocument();
            });
        });

        test('disables save button while saving', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Saving...')).toBeDisabled();
            });
        });

        test('navigates after successful save', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
            });
        });

        test('handles save error', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockRejectedValue(new Error('Save failed'));

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to save resume changes');
            });

            // Should re-enable save button after error
            expect(screen.getByText('Save Changes')).not.toBeDisabled();
        });

        test('parses resume_id as integer when saving', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<EditResume />, { resume_id: '42', job_id: '1' });

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalledWith(
                    expect.objectContaining({ resume_id: 42 })
                );
            });
        });
    });

    describe('Navigation', () => {
        test('renders back button', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });
        });

        test('navigates back on back button click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
        });

        test('navigates back on cancel button click', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
        });

        test('includes job_id in navigation if present', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />, { resume_id: '1', job_id: '7' });

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=7');
        });

        test('handles missing job_id in navigation', async () => {
            const mockNavigateLocal = jest.fn();
            jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigateLocal);
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({ resume_id: '1' })]
            );

            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />, { resume_id: '1' });

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigateLocal).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=');
        });
    });

    describe('Error Handling', () => {
        test('displays error when fetch fails', async () => {
            apiService.getResumeDetail.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume details')).toBeInTheDocument();
            });
        });

        test('shows loading state before displaying error', async () => {
            apiService.getResumeDetail.mockImplementation(() =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Error')), 100))
            );

            renderWithRouter(<EditResume />);

            expect(screen.getByText('Loading resume...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume details')).toBeInTheDocument();
            });
        });

        test('logs error to console on fetch failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Network error');
            apiService.getResumeDetail.mockRejectedValue(error);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching resume detail:', error);
            });

            consoleSpy.mockRestore();
        });

        test('logs error to console on save failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Save failed');
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockRejectedValue(error);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error saving resume:', error);
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Header Controls', () => {
        test('renders all header buttons', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            expect(screen.getByText('Show Preview')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });

        test('header has correct layout structure', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Edit Resume')).toBeInTheDocument();
            });

            // Verify back button and title are in header
            expect(screen.getByText('←')).toBeInTheDocument();
            expect(screen.getByText('Edit Resume')).toBeInTheDocument();
        });

        test('save button is enabled when not saving', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });

            expect(screen.getByText('Save Changes')).not.toBeDisabled();
        });

        test('cancel button is always enabled', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            expect(screen.getByText('Cancel')).not.toBeDisabled();
        });
    });

    describe('Resume ID Handling', () => {
        test('does not fetch if resume_id is missing', async () => {
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({})]
            );

            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />, {});

            // Should show loading state but not call API
            expect(screen.getByText('Loading resume...')).toBeInTheDocument();

            await waitFor(() => {
                expect(apiService.getResumeDetail).not.toHaveBeenCalled();
            });
        });

        test('fetches with correct resume_id from URL params', async () => {
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({ resume_id: '123' })]
            );

            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />, { resume_id: '123' });

            await waitFor(() => {
                expect(apiService.getResumeDetail).toHaveBeenCalledWith('123');
            });
        });
    });

    describe('Content Preservation', () => {
        test('preserves content when toggling views', async () => {
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<EditResume />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Enter your resume content in HTML format...')).toBeInTheDocument();
            });

            // Edit content
            const textarea = screen.getByPlaceholderText('Enter your resume content in HTML format...');
            const editedContent = '<html><body><h1>Test Content</h1></body></html>';
            fireEvent.change(textarea, { target: { value: editedContent } });

            // Toggle to preview
            const toggleButton = screen.getByText('Show Preview');
            fireEvent.click(toggleButton);

            // Toggle back to raw HTML
            await waitFor(() => {
                expect(screen.getByText('Show Raw HTML')).toBeInTheDocument();
            });
            const showRawButton = screen.getByText('Show Raw HTML');
            fireEvent.click(showRawButton);

            // Verify content is preserved
            await waitFor(() => {
                const textareaAfterToggle = screen.getByPlaceholderText('Enter your resume content in HTML format...');
                expect(textareaAfterToggle.value).toBe(editedContent);
            });
        });
    });
});
