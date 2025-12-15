import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CoverLetter from './CoverLetter';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    ...jest.requireActual('../../services/api'),
    getLetterList: jest.fn(),
    deleteLetter: jest.fn(),
    convertLetter: jest.fn(),
    getPersonalInfo: jest.fn(),
    baseURL: 'http://localhost:8000'
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

global.alert = jest.fn();
global.confirm = jest.fn();

const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            {component}
        </MemoryRouter>
    );
};

describe('CoverLetter Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        global.alert.mockClear();
        global.confirm.mockClear();
    });

    const mockLetters = [
        {
            cover_id: 1,
            company: 'Tech Corp',
            job_title: 'Software Engineer',
            letter_length: 'medium',
            letter_tone: 'professional',
            letter_created: '2025-01-15T10:00:00',
            job_id: 1,
            resume_id: 5
        },
        {
            cover_id: 2,
            company: 'Data Inc',
            job_title: 'Data Scientist',
            letter_length: 'long',
            letter_tone: 'enthusiastic',
            letter_created: '2025-01-20T10:00:00',
            job_id: 2,
            resume_id: 6
        }
    ];

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getLetterList.mockImplementation(() => new Promise(() => {}));

            renderWithRouter(<CoverLetter />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        test('renders page after loading', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Cover Letter')).toBeInTheDocument();
            });

            expect(screen.getByPlaceholderText('Search by company or job title...')).toBeInTheDocument();
            expect(screen.getByText('Add New')).toBeInTheDocument();
        });

        test('fetches letter list on mount', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(apiService.getLetterList).toHaveBeenCalled();
            });
        });
    });

    describe('Letter Display', () => {
        test('displays all letters', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Data Inc')).toBeInTheDocument();
            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('Data Scientist')).toBeInTheDocument();
        });

        test('displays letter details', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getAllByText(/Length:/)[0]).toBeInTheDocument();
            });

            expect(screen.getByText('medium')).toBeInTheDocument();
            expect(screen.getByText('professional')).toBeInTheDocument();
        });

        test('displays creation time', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                const dateElements = screen.queryAllByText(/Created.*ago/);
                expect(dateElements.length).toBeGreaterThan(0);
            });
        });

        test('shows no letters message when empty', async () => {
            apiService.getLetterList.mockResolvedValue([]);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('No cover letters yet')).toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        test('filters by company name', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.queryByText('Data Inc')).not.toBeInTheDocument();
        });

        test('filters by job title', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Data Scientist')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'Scientist' } });

            await waitFor(() => {
                expect(screen.getByText('Data Scientist')).toBeInTheDocument();
            });

            expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
        });

        test('search is case insensitive', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'tech' } });

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });
        });

        test('shows clear search button when searching', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search by company or job title...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('✕')).toBeInTheDocument();
            });
        });

        test('clears search when clicking clear button', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search by company or job title...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('✕')).toBeInTheDocument();
            });

            const clearButton = screen.getByText('✕');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
        });

        test('shows no matching message when search has no results', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by company or job title...');
            fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

            await waitFor(() => {
                expect(screen.getByText('No matching cover letters found')).toBeInTheDocument();
            });
        });

        test('handles null company and job_title in search', async () => {
            const lettersWithNulls = [
                { ...mockLetters[0], company: null, job_title: null }
            ];
            apiService.getLetterList.mockResolvedValue(lettersWithNulls);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search by company or job title...');
                fireEvent.change(searchInput, { target: { value: 'test' } });
            });

            // Should not crash
            expect(screen.getByText('No matching cover letters found')).toBeInTheDocument();
        });
    });

    describe('Delete Functionality', () => {
        test('deletes letter with confirmation', async () => {
            global.confirm.mockReturnValue(true);
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.deleteLetter.mockResolvedValue({});

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this cover letter?');
            });

            await waitFor(() => {
                expect(apiService.deleteLetter).toHaveBeenCalledWith(1);
            });
        });

        test('does not delete without confirmation', async () => {
            global.confirm.mockReturnValue(false);
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            expect(apiService.deleteLetter).not.toHaveBeenCalled();
        });

        test('removes deleted letter from display', async () => {
            global.confirm.mockReturnValue(true);
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.deleteLetter.mockResolvedValue({});

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('Tech Corp')).not.toBeInTheDocument();
            });

            // Data Inc should still be visible
            expect(screen.getByText('Data Inc')).toBeInTheDocument();
        });

        test('handles delete error', async () => {
            global.confirm.mockReturnValue(true);
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.deleteLetter.mockRejectedValue(new Error('Delete failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to delete cover letter');
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Download Functionality', () => {
        test('downloads letter successfully', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.convertLetter.mockResolvedValue({ file_name: 'cover_letter.docx' });
            apiService.getPersonalInfo.mockResolvedValue({
                first_name: 'John',
                last_name: 'Doe'
            });

            // Mock document methods
            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn(),
                href: '',
                download: ''
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(apiService.convertLetter).toHaveBeenCalledWith(1, 'docx');
            });

            await waitFor(() => {
                expect(apiService.getPersonalInfo).toHaveBeenCalled();
            });

            expect(mockLink.click).toHaveBeenCalled();
        });

        test('creates download filename from personal info', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.convertLetter.mockResolvedValue({ file_name: 'cover_letter.docx' });
            apiService.getPersonalInfo.mockResolvedValue({
                first_name: 'Jane',
                last_name: 'Smith'
            });

            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn(),
                href: '',
                download: ''
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(mockLink.download).toBe('jane_smith-cover_letter.docx');
            });
        });

        test('handles missing personal info in download', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.convertLetter.mockResolvedValue({ file_name: 'cover_letter.docx' });
            apiService.getPersonalInfo.mockResolvedValue({});

            const mockLink = {
                click: jest.fn(),
                setAttribute: jest.fn(),
                href: '',
                download: ''
            };
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(mockLink.download).toBe('cover_letter-cover_letter.docx');
            });
        });

        test('handles download error', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);
            apiService.convertLetter.mockRejectedValue(new Error('Conversion failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to download cover letter');
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Navigation', () => {
        test('navigates to create cover letter on add new', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Add New')).toBeInTheDocument();
            });

            const addButton = screen.getByText('Add New');
            fireEvent.click(addButton);

            expect(mockNavigate).toHaveBeenCalledWith('/create-cover-letter');
        });

        test('navigates to edit cover letter on company click', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const companyElement = screen.getByText('Tech Corp');
            fireEvent.click(companyElement);

            expect(mockNavigate).toHaveBeenCalledWith('/create-cover-letter?job_id=1&resume_id=5');
        });

        test('navigates to edit cover letter on job title click', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            });

            const jobTitleElement = screen.getByText('Software Engineer');
            fireEvent.click(jobTitleElement);

            expect(mockNavigate).toHaveBeenCalledWith('/create-cover-letter?job_id=1&resume_id=5');
        });
    });

    describe('Time Since Creation', () => {
        test('displays days for recent letters', async () => {
            const recentLetter = [{
                ...mockLetters[0],
                letter_created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }];
            apiService.getLetterList.mockResolvedValue(recentLetter);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText(/Created 3 days ago/)).toBeInTheDocument();
            });
        });

        test('displays singular day', async () => {
            const recentLetter = [{
                ...mockLetters[0],
                letter_created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }];
            apiService.getLetterList.mockResolvedValue(recentLetter);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText(/Created 1 day ago/)).toBeInTheDocument();
            });
        });

        test('displays weeks for older letters', async () => {
            const oldLetter = [{
                ...mockLetters[0],
                letter_created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
            }];
            apiService.getLetterList.mockResolvedValue(oldLetter);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText(/Created 3 weeks ago/)).toBeInTheDocument();
            });
        });

        test('displays months for very old letters', async () => {
            const veryOldLetter = [{
                ...mockLetters[0],
                letter_created: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
            }];
            apiService.getLetterList.mockResolvedValue(veryOldLetter);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText(/Created 4 months ago/)).toBeInTheDocument();
            });
        });

        test('handles missing creation date', async () => {
            const letterNoDate = [{
                ...mockLetters[0],
                letter_created: null
            }];
            apiService.getLetterList.mockResolvedValue(letterNoDate);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            // Should not crash
        });
    });

    describe('Error Handling', () => {
        test('handles fetch error', async () => {
            apiService.getLetterList.mockRejectedValue(new Error('Network error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching cover letters:', expect.any(Error));
            });

            // Should still render with empty list
            await waitFor(() => {
                expect(screen.getByText('No cover letters yet')).toBeInTheDocument();
            });

            consoleSpy.mockRestore();
        });

        test('sets empty array on fetch error', async () => {
            apiService.getLetterList.mockRejectedValue(new Error('Network error'));

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('No cover letters yet')).toBeInTheDocument();
            });
        });
    });

    describe('Letter Cards', () => {
        test('renders all action buttons', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBe(2);
            });

            const downloadButtons = screen.getAllByText('Download');
            expect(downloadButtons.length).toBe(2);
        });

        test('displays tone and length for each letter', async () => {
            apiService.getLetterList.mockResolvedValue(mockLetters);

            renderWithRouter(<CoverLetter />);

            await waitFor(() => {
                expect(screen.getByText('professional')).toBeInTheDocument();
            });

            expect(screen.getByText('medium')).toBeInTheDocument();
            expect(screen.getByText('enthusiastic')).toBeInTheDocument();
            expect(screen.getByText('long')).toBeInTheDocument();
        });
    });
});
