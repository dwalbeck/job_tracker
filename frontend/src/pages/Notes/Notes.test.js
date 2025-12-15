import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notes from './Notes';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('../../context/JobContext', () => ({
    useJob: jest.fn(),
}));

jest.mock('../../components/ExportMenu/ExportMenu', () => {
    return function MockExportMenu({ label, onExport }) {
        return <button onClick={onExport}>{label}</button>;
    };
});

jest.mock('../../services/api', () => ({
    getNotes: jest.fn(),
    deleteNote: jest.fn(),
    exportNotes: jest.fn(),
    baseURL: 'http://api.test.com',
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalAlert = window.alert;
const originalConfirm = window.confirm;

describe('Notes Component', () => {
    let mockNavigate;
    let mockUseJob;

    const mockNotes = [
        {
            note_id: 1,
            company: 'Tech Corp',
            job_title: 'Software Engineer',
            note_title: 'Initial Phone Screen',
            note_content: 'Had a great conversation with the recruiter. They mentioned the team is looking for someone with React experience.',
            note_created: '2025-01-10T14:30:00Z',
        },
        {
            note_id: 2,
            company: 'Startup Inc',
            job_title: 'Senior Developer',
            note_title: 'Technical Interview',
            note_content: 'Completed coding challenge. Asked about system design for a distributed cache.',
            note_created: '2025-01-12T10:15:00Z',
        },
        {
            note_id: 3,
            company: 'Big Corp',
            job_title: 'Lead Engineer',
            note_title: 'Follow-up',
            note_content: 'Short note about following up with hiring manager next week.',
            note_created: '2025-01-15T16:45:00Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Setup JobContext mock
        mockUseJob = { selectedJobId: null };
        require('../../context/JobContext').useJob.mockReturnValue(mockUseJob);

        // Mock window functions and console
        console.log = jest.fn();
        console.error = jest.fn();
        window.alert = jest.fn();
        window.confirm = jest.fn();

        // Mock document methods
        document.createElement = jest.fn((tag) => {
            const element = {
                href: '',
                download: '',
                click: jest.fn(),
                setAttribute: jest.fn(),
            };
            return element;
        });
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        window.alert = originalAlert;
        window.confirm = originalConfirm;
    });

    describe('Component Rendering', () => {
        test('renders loading state initially', () => {
            apiService.getNotes.mockImplementation(() => new Promise(() => {}));

            render(<Notes />);

            expect(screen.getByText('Loading notes...')).toBeInTheDocument();
        });

        test('renders notes page after loading', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Note List')).toBeInTheDocument();
            });

            expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            expect(screen.getByText('Technical Interview')).toBeInTheDocument();
            expect(screen.getByText('Follow-up')).toBeInTheDocument();
        });

        test('renders note content in cards', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('Had a great conversation with the recruiter. They mentioned the team is looking for someone with React experience.')).toBeInTheDocument();
        });

        test('renders company and job title for each note', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Startup Inc')).toBeInTheDocument();
            expect(screen.getByText('Big Corp')).toBeInTheDocument();
            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('Senior Developer')).toBeInTheDocument();
            expect(screen.getByText('Lead Engineer')).toBeInTheDocument();
        });

        test('renders delete button for each note', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons).toHaveLength(3);
            });
        });

        test('does not render back button when selectedJobId is null', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Note List')).toBeInTheDocument();
            });

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });

        test('renders back button when selectedJobId is present', async () => {
            mockUseJob.selectedJobId = 123;
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });
        });

        test('renders add note button', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Note')).toBeInTheDocument();
            });
        });

        test('renders export button', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Export Notes')).toBeInTheDocument();
            });
        });

        test('renders search input', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search notes...');
                expect(searchInput).toBeInTheDocument();
            });
        });

        test('renders formatted date and time for notes', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                // Should render dates (format depends on locale, so we just check they exist)
                const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
                expect(dateElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Data Fetching', () => {
        test('fetches notes on mount without job filter', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalledWith(null);
            });
        });

        test('fetches notes with job filter when selectedJobId present', async () => {
            mockUseJob.selectedJobId = 456;
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalledWith(456);
            });
        });

        test('refetches notes when selectedJobId changes', async () => {
            mockUseJob.selectedJobId = 123;
            apiService.getNotes.mockResolvedValue(mockNotes);

            const { rerender } = render(<Notes />);

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalledWith(123);
            });

            // Change selectedJobId
            mockUseJob.selectedJobId = 456;
            rerender(<Notes />);

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalledWith(456);
            });
        });

        test('displays empty state when no notes', async () => {
            apiService.getNotes.mockResolvedValue([]);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('No notes found.')).toBeInTheDocument();
            });
        });

        test('handles fetch error gracefully', async () => {
            apiService.getNotes.mockRejectedValue(new Error('Network error'));

            render(<Notes />);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching notes:',
                    expect.any(Error)
                );
            });

            // Should still render the page, just with empty notes
            expect(screen.getByText('No notes found.')).toBeInTheDocument();
        });

        test('handles null response from API', async () => {
            apiService.getNotes.mockResolvedValue(null);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('No notes found.')).toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        test('filters notes by content', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');
            fireEvent.change(searchInput, { target: { value: 'recruiter' } });

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
                expect(screen.queryByText('Technical Interview')).not.toBeInTheDocument();
                expect(screen.queryByText('Follow-up')).not.toBeInTheDocument();
            });
        });

        test('search is case insensitive', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');
            fireEvent.change(searchInput, { target: { value: 'RECRUITER' } });

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });
        });

        test('shows no results message when search has no matches', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');
            fireEvent.change(searchInput, { target: { value: 'NonExistentContent' } });

            await waitFor(() => {
                expect(screen.getByText('No notes match your search.')).toBeInTheDocument();
            });
        });

        test('clear search button appears when search term exists', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');
            fireEvent.change(searchInput, { target: { value: 'recruiter' } });

            await waitFor(() => {
                expect(screen.getByText('⊠')).toBeInTheDocument();
            });
        });

        test('clear search button clears the search', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');
            fireEvent.change(searchInput, { target: { value: 'recruiter' } });

            await waitFor(() => {
                expect(screen.queryByText('Technical Interview')).not.toBeInTheDocument();
            });

            const clearButton = screen.getByText('⊠');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
                expect(screen.getByText('Technical Interview')).toBeInTheDocument();
                expect(screen.getByText('Follow-up')).toBeInTheDocument();
            });
        });

        test('clear button is hidden when search is empty', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            expect(screen.queryByText('⊠')).not.toBeInTheDocument();
        });

        test('displays all notes when search is cleared', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');

            // Search
            fireEvent.change(searchInput, { target: { value: 'recruiter' } });

            await waitFor(() => {
                expect(screen.queryByText('Technical Interview')).not.toBeInTheDocument();
            });

            // Clear search
            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
                expect(screen.getByText('Technical Interview')).toBeInTheDocument();
                expect(screen.getByText('Follow-up')).toBeInTheDocument();
            });
        });
    });

    describe('Text Truncation', () => {
        test('truncates long note content when not hovered', async () => {
            const longNote = {
                note_id: 4,
                company: 'Test Corp',
                job_title: 'Engineer',
                note_title: 'Long Note',
                note_content: 'A'.repeat(200),
                note_created: '2025-01-16T12:00:00Z',
            };
            apiService.getNotes.mockResolvedValue([longNote]);

            render(<Notes />);

            await waitFor(() => {
                const truncatedText = screen.getByText(/A+\.\.\./);
                expect(truncatedText).toBeInTheDocument();
                expect(truncatedText.textContent.length).toBeLessThan(200);
            });
        });

        test('shows full content when note is hovered', async () => {
            const longNote = {
                note_id: 4,
                company: 'Test Corp',
                job_title: 'Engineer',
                note_title: 'Long Note',
                note_content: 'A'.repeat(200),
                note_created: '2025-01-16T12:00:00Z',
            };
            apiService.getNotes.mockResolvedValue([longNote]);

            render(<Notes />);

            await waitFor(() => {
                const noteRow = screen.getByText('Long Note').closest('.note-row');
                expect(noteRow).toBeInTheDocument();

                fireEvent.mouseEnter(noteRow);
            });

            await waitFor(() => {
                const fullText = screen.getByText('A'.repeat(200));
                expect(fullText).toBeInTheDocument();
            });
        });

        test('truncates content again when hover ends', async () => {
            const longNote = {
                note_id: 4,
                company: 'Test Corp',
                job_title: 'Engineer',
                note_title: 'Long Note',
                note_content: 'A'.repeat(200),
                note_created: '2025-01-16T12:00:00Z',
            };
            apiService.getNotes.mockResolvedValue([longNote]);

            render(<Notes />);

            await waitFor(() => {
                const noteRow = screen.getByText('Long Note').closest('.note-row');

                // Hover
                fireEvent.mouseEnter(noteRow);
            });

            await waitFor(() => {
                expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
            });

            const noteRow = screen.getByText('Long Note').closest('.note-row');
            // Stop hovering
            fireEvent.mouseLeave(noteRow);

            await waitFor(() => {
                const truncatedText = screen.getByText(/A+\.\.\./);
                expect(truncatedText.textContent.length).toBeLessThan(200);
            });
        });

        test('does not truncate short content', async () => {
            const shortNote = {
                note_id: 5,
                company: 'Test Corp',
                job_title: 'Engineer',
                note_title: 'Short Note',
                note_content: 'Short content here',
                note_created: '2025-01-16T12:00:00Z',
            };
            apiService.getNotes.mockResolvedValue([shortNote]);

            render(<Notes />);

            await waitFor(() => {
                const content = screen.getByText('Short content here');
                expect(content).toBeInTheDocument();
                expect(content.textContent).not.toContain('...');
            });
        });
    });

    describe('Navigation', () => {
        test('navigates to note form when note card is clicked', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const noteRow = screen.getByText('Initial Phone Screen').closest('.note-row');
            fireEvent.click(noteRow);

            expect(mockNavigate).toHaveBeenCalledWith('/notes-form/1');
        });

        test('navigates to add note form when button clicked', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Note')).toBeInTheDocument();
            });

            const addButton = screen.getByText('+ Add Note');
            fireEvent.click(addButton);

            expect(mockNavigate).toHaveBeenCalledWith('/notes-form');
        });

        test('navigates back to job details when back button clicked', async () => {
            mockUseJob.selectedJobId = 789;
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/789');
        });
    });

    describe('Delete Functionality', () => {
        test('shows confirmation dialog when delete clicked', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            window.confirm.mockReturnValue(false);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this note?');
        });

        test('deletes note and refreshes list when confirmed', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.deleteNote.mockResolvedValue({});
            window.confirm.mockReturnValue(true);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });

            // Mock the second fetch to return notes without the deleted one
            apiService.getNotes.mockResolvedValue([mockNotes[1], mockNotes[2]]);

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(apiService.deleteNote).toHaveBeenCalledWith(1);
            });

            await waitFor(() => {
                expect(apiService.getNotes).toHaveBeenCalledTimes(2); // Initial + refresh
            });
        });

        test('does not delete when confirmation cancelled', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            window.confirm.mockReturnValue(false);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            expect(apiService.deleteNote).not.toHaveBeenCalled();
        });

        test('delete button click does not trigger note row click', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            window.confirm.mockReturnValue(false);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            // Should not navigate to note form
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('handles delete error gracefully', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.deleteNote.mockRejectedValue(new Error('Delete failed'));
            window.confirm.mockReturnValue(true);

            render(<Notes />);

            await waitFor(() => {
                const deleteButtons = screen.getAllByText('Delete');
                expect(deleteButtons.length).toBeGreaterThan(0);
            });

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error deleting note:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to delete note');
            });
        });
    });

    describe('Export Functionality', () => {
        test('exports notes successfully', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.exportNotes.mockResolvedValue({
                note_export_dir: '/exports',
                note_export_file: 'notes_2025-01-15.csv',
            });

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Export Notes')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Notes');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportNotes).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(console.log).toHaveBeenCalledWith(
                    'Notes exported to: /exports/notes_2025-01-15.csv'
                );
            });
        });

        test('creates download link with correct attributes on export', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.exportNotes.mockResolvedValue({
                note_export_dir: '/exports',
                note_export_file: 'notes_export.csv',
            });

            let createdLink;
            document.createElement = jest.fn((tag) => {
                createdLink = {
                    href: '',
                    download: '',
                    click: jest.fn(),
                    setAttribute: jest.fn(),
                };
                return createdLink;
            });

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Export Notes')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Notes');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(createdLink.href).toBe('http://api.test.com/v1/files/exports/notes_export.csv');
                expect(createdLink.download).toBe('notes_export.csv');
                expect(createdLink.setAttribute).toHaveBeenCalledWith('target', '_blank');
                expect(createdLink.click).toHaveBeenCalled();
            });
        });

        test('handles export error gracefully', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);
            apiService.exportNotes.mockRejectedValue(new Error('Export failed'));

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Export Notes')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Notes');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error exporting notes:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to export notes');
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles notes with missing optional fields', async () => {
            const notesWithMissingData = [
                {
                    note_id: 1,
                    company: 'Test Corp',
                    job_title: 'Engineer',
                    note_title: 'Test Note',
                    note_content: null,
                    note_created: '2025-01-16T12:00:00Z',
                },
            ];

            apiService.getNotes.mockResolvedValue(notesWithMissingData);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Test Note')).toBeInTheDocument();
            });
        });

        test('handles rapid search input changes', async () => {
            apiService.getNotes.mockResolvedValue(mockNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search notes...');

            fireEvent.change(searchInput, { target: { value: 'r' } });
            fireEvent.change(searchInput, { target: { value: 're' } });
            fireEvent.change(searchInput, { target: { value: 'rec' } });
            fireEvent.change(searchInput, { target: { value: 'recruiter' } });

            await waitFor(() => {
                expect(screen.getByText('Initial Phone Screen')).toBeInTheDocument();
                expect(screen.queryByText('Technical Interview')).not.toBeInTheDocument();
            });
        });

        test('handles multiple hovers correctly', async () => {
            const longNotes = [
                {
                    note_id: 1,
                    company: 'Corp A',
                    job_title: 'Engineer A',
                    note_title: 'Note A',
                    note_content: 'A'.repeat(150),
                    note_created: '2025-01-16T12:00:00Z',
                },
                {
                    note_id: 2,
                    company: 'Corp B',
                    job_title: 'Engineer B',
                    note_title: 'Note B',
                    note_content: 'B'.repeat(150),
                    note_created: '2025-01-16T12:00:00Z',
                },
            ];
            apiService.getNotes.mockResolvedValue(longNotes);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Note A')).toBeInTheDocument();
            });

            const noteRowA = screen.getByText('Note A').closest('.note-row');
            const noteRowB = screen.getByText('Note B').closest('.note-row');

            // Hover over first note
            fireEvent.mouseEnter(noteRowA);

            await waitFor(() => {
                expect(screen.getByText('A'.repeat(150))).toBeInTheDocument();
            });

            // Hover over second note
            fireEvent.mouseEnter(noteRowB);

            await waitFor(() => {
                expect(screen.getByText('B'.repeat(150))).toBeInTheDocument();
            });

            // Only the second note should be expanded now
            fireEvent.mouseLeave(noteRowA);
        });

        test('handles empty note content gracefully', async () => {
            const emptyContentNote = [
                {
                    note_id: 1,
                    company: 'Test Corp',
                    job_title: 'Engineer',
                    note_title: 'Empty Note',
                    note_content: '',
                    note_created: '2025-01-16T12:00:00Z',
                },
            ];

            apiService.getNotes.mockResolvedValue(emptyContentNote);

            render(<Notes />);

            await waitFor(() => {
                expect(screen.getByText('Empty Note')).toBeInTheDocument();
            });
        });
    });
});
