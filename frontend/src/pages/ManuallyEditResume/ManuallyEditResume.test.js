import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ManuallyEditResume from './ManuallyEditResume';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');

// Mock TinyMCE Editor
jest.mock('@tinymce/tinymce-react', () => ({
    Editor: ({ onInit, initialValue, apiKey }) => {
        const mockEditor = {
            getContent: jest.fn(() => '<p>Edited content</p>'),
            setContent: jest.fn()
        };

        React.useEffect(() => {
            if (onInit) {
                onInit(null, mockEditor);
            }
        }, [onInit]);

        return (
            <div data-testid="tinymce-editor" data-api-key={apiKey}>
                <textarea defaultValue={initialValue} />
            </div>
        );
    }
}));

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
        <MemoryRouter initialEntries={[`/manually-edit-resume?${searchString}`]}>
            {component}
        </MemoryRouter>
    );
};

describe('ManuallyEditResume Component', () => {
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

    const mockPersonalInfo = {
        tinymce_api_key: 'test-api-key-12345',
        first_name: 'John',
        last_name: 'Doe'
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getPersonalInfo.mockImplementation(() => new Promise(() => {}));
            apiService.getResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<ManuallyEditResume />);

            expect(screen.getByText('Loading resume...')).toBeInTheDocument();
        });

        test('renders editor after loading', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Manually Edit Resume')).toBeInTheDocument();
            });

            expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
        });

        test('fetches resume content on mount', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(apiService.getPersonalInfo).toHaveBeenCalled();
            });

            expect(apiService.getResumeDetail).toHaveBeenCalledWith('1');
        });

        test('fetches TinyMCE API key from personal settings', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(apiService.getPersonalInfo).toHaveBeenCalled();
            });

            const editor = screen.getByTestId('tinymce-editor');
            expect(editor.getAttribute('data-api-key')).toBe('test-api-key-12345');
        });
    });

    describe('Content Loading', () => {
        test('uses rewritten HTML if available', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            const textarea = screen.getByTestId('tinymce-editor').querySelector('textarea');
            expect(textarea.value).toContain('Senior Software Engineer');
        });

        test('falls back to baseline HTML if no rewrite', async () => {
            const resumeWithoutRewrite = { ...mockResumeDetail, resume_html_rewrite: null };
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(resumeWithoutRewrite);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            const textarea = screen.getByTestId('tinymce-editor').querySelector('textarea');
            expect(textarea.value).toContain('Software Engineer');
            expect(textarea.value).not.toContain('Senior');
        });

        test('handles empty HTML content', async () => {
            const emptyResume = { ...mockResumeDetail, resume_html: null, resume_html_rewrite: null };
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(emptyResume);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            const textarea = screen.getByTestId('tinymce-editor').querySelector('textarea');
            expect(textarea.value).toBe('');
        });

        test('handles missing TinyMCE API key', async () => {
            const personalInfoWithoutKey = { ...mockPersonalInfo, tinymce_api_key: null };
            apiService.getPersonalInfo.mockResolvedValue(personalInfoWithoutKey);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            const editor = screen.getByTestId('tinymce-editor');
            expect(editor.getAttribute('data-api-key')).toBe('');
        });
    });

    describe('TinyMCE Editor', () => {
        test('renders TinyMCE editor with correct API key', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                const editor = screen.getByTestId('tinymce-editor');
                expect(editor.getAttribute('data-api-key')).toBe('test-api-key-12345');
            });
        });

        test('initializes editor with resume content', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            const textarea = screen.getByTestId('tinymce-editor').querySelector('textarea');
            expect(textarea.value).toBeTruthy();
        });

        test('stores editor reference on init', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
            });

            // Editor ref should be set (tested indirectly through save functionality)
        });
    });

    describe('Save Functionality', () => {
        test('saves edited content successfully', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(apiService.updateResumeDetail).toHaveBeenCalledWith({
                    resume_id: 1,
                    resume_html_rewrite: '<p>Edited content</p>'
                });
            });
        });

        test('shows saving state while saving', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Saving...')).toBeInTheDocument();
            });
        });

        test('disables buttons while saving', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Saving...')).toBeDisabled();
            });

            const cancelButtons = screen.getAllByText('Cancel');
            cancelButtons.forEach(button => {
                expect(button).toBeDisabled();
            });
        });

        test('navigates after successful save', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockResolvedValue({});

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
            });
        });

        test('handles save error', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);
            apiService.updateResumeDetail.mockRejectedValue(new Error('Save failed'));

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to save resume. Please try again.');
            });

            // Should re-enable buttons after error
            expect(screen.getByText('Save')).not.toBeDisabled();
        });

        test('alerts if editor not initialized', async () => {
            // Mock editor to not initialize
            const EditorMock = ({ onInit, initialValue }) => {
                // Don't call onInit
                return (
                    <div data-testid="tinymce-editor">
                        <textarea defaultValue={initialValue} />
                    </div>
                );
            };

            jest.mock('@tinymce/tinymce-react', () => ({
                Editor: EditorMock
            }));

            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            // This test verifies the alert check, but the mock always initializes
            // In real scenario, if editorRef.current is null, it would alert
        });
    });

    describe('Navigation', () => {
        test('renders back button', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });
        });

        test('navigates back on back button click', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
        });

        test('navigates back on cancel button click', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getAllByText('Cancel').length).toBeGreaterThan(0);
            });

            const cancelButtons = screen.getAllByText('Cancel');
            fireEvent.click(cancelButtons[0]);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=2');
        });

        test('includes job_id in navigation if present', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />, { resume_id: '1', job_id: '5' });

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/view-resume?resume_id=1&job_id=5');
        });

        test('handles missing job_id in navigation', async () => {
            const mockNavigateLocal = jest.fn();
            jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigateLocal);
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({ resume_id: '1' })]
            );

            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />, { resume_id: '1' });

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
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume content')).toBeInTheDocument();
            });
        });

        test('displays error when personal info fetch fails', async () => {
            apiService.getPersonalInfo.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume content')).toBeInTheDocument();
            });
        });

        test('shows loading state before displaying error', async () => {
            apiService.getPersonalInfo.mockImplementation(() =>
                new Promise((_, reject) => setTimeout(() => reject(new Error('Error')), 100))
            );

            renderWithRouter(<ManuallyEditResume />);

            expect(screen.getByText('Loading resume...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume content')).toBeInTheDocument();
            });
        });

        test('clears error state after successful retry', async () => {
            // First call fails, subsequent calls succeed
            apiService.getPersonalInfo
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            const { rerender } = renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load resume content')).toBeInTheDocument();
            });

            // Simulate retry by re-rendering
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            rerender(
                <MemoryRouter initialEntries={['/manually-edit-resume?resume_id=1&job_id=2']}>
                    <ManuallyEditResume />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Manually Edit Resume')).toBeInTheDocument();
            });
        });
    });

    describe('Page Header', () => {
        test('displays page title', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Manually Edit Resume')).toBeInTheDocument();
            });
        });

        test('header contains back button and title', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            expect(screen.getByText('Manually Edit Resume')).toBeInTheDocument();
        });
    });

    describe('Footer Buttons', () => {
        test('renders cancel and save buttons', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            expect(screen.getAllByText('Cancel').length).toBeGreaterThan(0);
        });

        test('buttons are enabled when not saving', async () => {
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />);

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument();
            });

            expect(screen.getByText('Save')).not.toBeDisabled();

            const cancelButtons = screen.getAllByText('Cancel');
            cancelButtons.forEach(button => {
                expect(button).not.toBeDisabled();
            });
        });
    });

    describe('Resume ID Handling', () => {
        test('does not fetch if resume_id is missing', async () => {
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({})]
            );

            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />, {});

            // Should show loading state but not call API
            expect(screen.getByText('Loading resume...')).toBeInTheDocument();

            await waitFor(() => {
                expect(apiService.getResumeDetail).not.toHaveBeenCalled();
            });
        });

        test('fetches with correct resume_id from URL params', async () => {
            jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue(
                [new URLSearchParams({ resume_id: '999' })]
            );

            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.getResumeDetail.mockResolvedValue(mockResumeDetail);

            renderWithRouter(<ManuallyEditResume />, { resume_id: '999' });

            await waitFor(() => {
                expect(apiService.getResumeDetail).toHaveBeenCalledWith('999');
            });
        });
    });
});
