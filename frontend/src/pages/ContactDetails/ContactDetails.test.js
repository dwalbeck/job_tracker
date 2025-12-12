import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactDetails from './ContactDetails';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

jest.mock('../../context/JobContext', () => ({
    useJob: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    getContact: jest.fn(),
    deleteContact: jest.fn(),
}));

// Mock console methods and window functions
const originalConsoleError = console.error;
const originalAlert = window.alert;
const originalConfirm = window.confirm;

describe('ContactDetails Component', () => {
    let mockNavigate;
    let mockSelectJob;

    const mockContact = {
        contact_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Senior Recruiter',
        email: 'john.doe@company.com',
        phone: '123-456-7890',
        company: 'Tech Corp',
        linkedin: 'https://linkedin.com/in/johndoe',
        contact_note: 'Very helpful and responsive. Follow up next week.',
        linked_to: [
            { job_id: 10, company: 'Tech Corp', job_title: 'Software Engineer' },
            { job_id: 20, company: 'Tech Corp', job_title: 'Senior Developer' },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup navigation mock
        mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Setup params mock
        require('react-router-dom').useParams.mockReturnValue({ id: '1' });

        // Setup JobContext mock
        mockSelectJob = jest.fn();
        require('../../context/JobContext').useJob.mockReturnValue({
            selectJob: mockSelectJob,
        });

        // Mock window functions
        console.error = jest.fn();
        window.alert = jest.fn();
        window.confirm = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        window.alert = originalAlert;
        window.confirm = originalConfirm;
    });

    describe('Component Rendering', () => {
        test('renders loading state initially', () => {
            apiService.getContact.mockImplementation(() => new Promise(() => {}));

            render(<ContactDetails />);

            expect(screen.getByText('Loading contact details...')).toBeInTheDocument();
        });

        test('renders contact details after loading', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByText('Doe')).toBeInTheDocument();
            expect(screen.getByText('Senior Recruiter')).toBeInTheDocument();
            expect(screen.getByText('john.doe@company.com')).toBeInTheDocument();
            expect(screen.getByText('123-456-7890')).toBeInTheDocument();
            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        });

        test('renders all detail labels', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('First Name:')).toBeInTheDocument();
            });

            expect(screen.getByText('Last Name:')).toBeInTheDocument();
            expect(screen.getByText('Job Title:')).toBeInTheDocument();
            expect(screen.getByText('Email:')).toBeInTheDocument();
            expect(screen.getByText('Phone:')).toBeInTheDocument();
            expect(screen.getByText('Company:')).toBeInTheDocument();
            expect(screen.getByText('LinkedIn:')).toBeInTheDocument();
        });

        test('renders email as clickable mailto link', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                const emailLink = screen.getByText('john.doe@company.com');
                expect(emailLink.tagName).toBe('A');
                expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@company.com');
            });
        });

        test('renders phone as clickable tel link', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                const phoneLink = screen.getByText('123-456-7890');
                expect(phoneLink.tagName).toBe('A');
                expect(phoneLink).toHaveAttribute('href', 'tel:123-456-7890');
            });
        });

        test('renders linkedin as external link', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                const linkedinLink = screen.getByText('https://linkedin.com/in/johndoe');
                expect(linkedinLink.tagName).toBe('A');
                expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe');
                expect(linkedinLink).toHaveAttribute('target', '_blank');
                expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
            });
        });

        test('renders contact notes when present', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Notes:')).toBeInTheDocument();
                expect(screen.getByText('Very helpful and responsive. Follow up next week.')).toBeInTheDocument();
            });
        });

        test('does not render notes section when no notes', async () => {
            const contactWithoutNotes = { ...mockContact, contact_note: null };
            apiService.getContact.mockResolvedValue(contactWithoutNotes);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
        });

        test('renders linked jobs when present', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Linked Jobs:')).toBeInTheDocument();
            });

            expect(screen.getByText('Tech Corp - Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('Tech Corp - Senior Developer')).toBeInTheDocument();
        });

        test('does not render linked jobs section when no linked jobs', async () => {
            const contactWithoutJobs = { ...mockContact, linked_to: [] };
            apiService.getContact.mockResolvedValue(contactWithoutJobs);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.queryByText('Linked Jobs:')).not.toBeInTheDocument();
        });

        test('renders back, edit, and delete buttons', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        test('shows Not specified for missing optional fields', async () => {
            const contactWithMissingFields = {
                ...mockContact,
                job_title: null,
                email: null,
                phone: null,
                company: null,
                linkedin: null,
            };
            apiService.getContact.mockResolvedValue(contactWithMissingFields);

            render(<ContactDetails />);

            await waitFor(() => {
                const notSpecifiedElements = screen.getAllByText('Not specified');
                expect(notSpecifiedElements.length).toBeGreaterThanOrEqual(5);
            });
        });
    });

    describe('Data Fetching', () => {
        test('fetches contact on mount', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(apiService.getContact).toHaveBeenCalledWith('1');
            });
        });

        test('fetches contact when id changes', async () => {
            const { rerender } = render(<ContactDetails />);
            apiService.getContact.mockResolvedValue(mockContact);

            await waitFor(() => {
                expect(apiService.getContact).toHaveBeenCalledWith('1');
            });

            // Change the id param
            require('react-router-dom').useParams.mockReturnValue({ id: '2' });
            rerender(<ContactDetails />);

            await waitFor(() => {
                expect(apiService.getContact).toHaveBeenCalledWith('2');
            });
        });

        test('displays error message when fetch fails', async () => {
            apiService.getContact.mockRejectedValue(new Error('Network error'));

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load contact details')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith(
                'Error fetching contact details:',
                expect.any(Error)
            );
        });

        test('displays contact not found when null returned', async () => {
            apiService.getContact.mockResolvedValue(null);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact not found')).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        test('navigates back to contacts when back button clicked', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contacts');
        });

        test('navigates to edit form when edit button clicked', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Edit')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-form/1');
        });

        test('navigates to job details when linked job clicked', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp - Software Engineer')).toBeInTheDocument();
            });

            const jobButton = screen.getByText('Tech Corp - Software Engineer');
            fireEvent.click(jobButton);

            expect(mockSelectJob).toHaveBeenCalledWith(10);
            expect(mockNavigate).toHaveBeenCalledWith('/job-details/10');
        });

        test('selects correct job when multiple linked jobs clicked', async () => {
            apiService.getContact.mockResolvedValue(mockContact);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp - Senior Developer')).toBeInTheDocument();
            });

            const jobButton = screen.getByText('Tech Corp - Senior Developer');
            fireEvent.click(jobButton);

            expect(mockSelectJob).toHaveBeenCalledWith(20);
            expect(mockNavigate).toHaveBeenCalledWith('/job-details/20');
        });
    });

    describe('Delete Functionality', () => {
        test('shows confirmation dialog when delete clicked', async () => {
            apiService.getContact.mockResolvedValue(mockContact);
            window.confirm.mockReturnValue(false);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this contact?');
        });

        test('deletes contact and navigates when confirmed', async () => {
            apiService.getContact.mockResolvedValue(mockContact);
            apiService.deleteContact.mockResolvedValue({});
            window.confirm.mockReturnValue(true);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(apiService.deleteContact).toHaveBeenCalledWith('1');
            });

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/contacts');
            });
        });

        test('does not delete when confirmation cancelled', async () => {
            apiService.getContact.mockResolvedValue(mockContact);
            window.confirm.mockReturnValue(false);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            expect(apiService.deleteContact).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('handles delete error gracefully', async () => {
            apiService.getContact.mockResolvedValue(mockContact);
            apiService.deleteContact.mockRejectedValue(new Error('Delete failed'));
            window.confirm.mockReturnValue(true);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Delete')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error deleting contact:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to delete contact');
            });

            // Should not navigate on error
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('handles contact with empty linked_to array', async () => {
            const contactWithEmptyLinks = { ...mockContact, linked_to: [] };
            apiService.getContact.mockResolvedValue(contactWithEmptyLinks);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.queryByText('Linked Jobs:')).not.toBeInTheDocument();
        });

        test('handles contact with null linked_to', async () => {
            const contactWithNullLinks = { ...mockContact, linked_to: null };
            apiService.getContact.mockResolvedValue(contactWithNullLinks);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.queryByText('Linked Jobs:')).not.toBeInTheDocument();
        });

        test('handles contact with undefined linked_to', async () => {
            const contactWithUndefinedLinks = { ...mockContact, linked_to: undefined };
            apiService.getContact.mockResolvedValue(contactWithUndefinedLinks);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            expect(screen.queryByText('Linked Jobs:')).not.toBeInTheDocument();
        });

        test('handles very long contact notes', async () => {
            const longNote = 'A'.repeat(1000);
            const contactWithLongNote = { ...mockContact, contact_note: longNote };
            apiService.getContact.mockResolvedValue(contactWithLongNote);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Notes:')).toBeInTheDocument();
            });

            const noteContent = screen.getByText(longNote);
            expect(noteContent).toBeInTheDocument();
        });

        test('handles contact with many linked jobs', async () => {
            const manyJobs = Array.from({ length: 10 }, (_, i) => ({
                job_id: i + 1,
                company: `Company ${i + 1}`,
                job_title: `Position ${i + 1}`,
            }));
            const contactWithManyJobs = { ...mockContact, linked_to: manyJobs };
            apiService.getContact.mockResolvedValue(contactWithManyJobs);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Linked Jobs:')).toBeInTheDocument();
            });

            expect(screen.getByText('Company 1 - Position 1')).toBeInTheDocument();
            expect(screen.getByText('Company 10 - Position 10')).toBeInTheDocument();
        });

        test('handles empty string values for optional fields', async () => {
            const contactWithEmptyStrings = {
                ...mockContact,
                job_title: '',
                email: '',
                phone: '',
                company: '',
                linkedin: '',
            };
            apiService.getContact.mockResolvedValue(contactWithEmptyStrings);

            render(<ContactDetails />);

            await waitFor(() => {
                expect(screen.getByText('Contact Details')).toBeInTheDocument();
            });

            // Empty strings should be treated as "Not specified"
            const notSpecifiedElements = screen.getAllByText('Not specified');
            expect(notSpecifiedElements.length).toBeGreaterThanOrEqual(5);
        });
    });
});
