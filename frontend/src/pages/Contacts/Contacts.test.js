import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Contacts from './Contacts';
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
    getAllContacts: jest.fn(),
    exportContacts: jest.fn(),
    baseURL: 'http://api.test.com',
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalAlert = window.alert;

describe('Contacts Component', () => {
    let mockNavigate;
    let mockUseJob;

    const mockContacts = [
        {
            contact_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            job_title: 'Recruiter',
            email: 'john.doe@company.com',
            phone: '123-456-7890',
            company: 'Tech Corp',
            linkedin: 'https://linkedin.com/in/johndoe',
        },
        {
            contact_id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            job_title: 'Hiring Manager',
            email: 'jane.smith@startup.com',
            phone: '987-654-3210',
            company: 'Startup Inc',
            linkedin: 'https://linkedin.com/in/janesmith',
        },
        {
            contact_id: 3,
            first_name: 'Bob',
            last_name: 'Johnson',
            job_title: 'HR Director',
            email: 'bob.johnson@bigcorp.com',
            phone: '555-123-4567',
            company: 'Big Corp',
            linkedin: null,
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

        // Mock console and alert
        console.log = jest.fn();
        console.error = jest.fn();
        window.alert = jest.fn();

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
    });

    describe('Component Rendering', () => {
        test('renders contacts page with loading state initially', () => {
            apiService.getAllContacts.mockImplementation(() => new Promise(() => {}));

            render(<Contacts />);

            expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
        });

        test('renders contacts table after loading', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Contacts')).toBeInTheDocument();
            });

            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByText('Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane')).toBeInTheDocument();
            expect(screen.getByText('Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.getByText('Johnson')).toBeInTheDocument();
        });

        test('renders all table headers', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument();
            });

            expect(screen.getByText('Last Name')).toBeInTheDocument();
            expect(screen.getByText('Job Title')).toBeInTheDocument();
            expect(screen.getByText('Email')).toBeInTheDocument();
            expect(screen.getByText('Phone')).toBeInTheDocument();
            expect(screen.getByText('Company')).toBeInTheDocument();
            expect(screen.getByText('LinkedIn')).toBeInTheDocument();
        });

        test('renders contact details in table rows', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Recruiter')).toBeInTheDocument();
            });

            expect(screen.getByText('john.doe@company.com')).toBeInTheDocument();
            expect(screen.getByText('123-456-7890')).toBeInTheDocument();
            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        });

        test('renders linkedin links for contacts that have them', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                const linkedinLinks = screen.getAllByText('linkedin');
                expect(linkedinLinks).toHaveLength(2); // Only John and Jane have LinkedIn
            });
        });

        test('does not render back button when selectedJobId is null', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Contacts')).toBeInTheDocument();
            });

            expect(screen.queryByText('←')).not.toBeInTheDocument();
        });

        test('renders back button when selectedJobId is present', async () => {
            mockUseJob.selectedJobId = 123;
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });
        });

        test('renders create contact button', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('+ Create Contact')).toBeInTheDocument();
            });
        });

        test('renders export button', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Export Contacts')).toBeInTheDocument();
            });
        });

        test('renders search input', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search contacts...');
                expect(searchInput).toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching', () => {
        test('fetches contacts on mount', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(apiService.getAllContacts).toHaveBeenCalledTimes(1);
            });
        });

        test('displays empty state when no contacts', async () => {
            apiService.getAllContacts.mockResolvedValue([]);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('No contacts found.')).toBeInTheDocument();
            });
        });

        test('handles fetch error gracefully', async () => {
            apiService.getAllContacts.mockRejectedValue(new Error('Network error'));

            render(<Contacts />);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching contacts:',
                    expect.any(Error)
                );
            });

            // Should still render the page, just with empty contacts
            expect(screen.getByText('No contacts found.')).toBeInTheDocument();
        });

        test('handles null response from API', async () => {
            apiService.getAllContacts.mockResolvedValue(null);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('No contacts found.')).toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        test('filters contacts by first name', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'John' } });

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
                expect(screen.queryByText('Jane')).not.toBeInTheDocument();
                expect(screen.queryByText('Bob')).not.toBeInTheDocument();
            });
        });

        test('filters contacts by last name', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Smith')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'Smith' } });

            await waitFor(() => {
                expect(screen.getByText('Jane')).toBeInTheDocument();
                expect(screen.queryByText('John')).not.toBeInTheDocument();
                expect(screen.queryByText('Bob')).not.toBeInTheDocument();
            });
        });

        test('search is case insensitive', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'JOHN' } });

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });
        });

        test('search by full name', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'Jane Smith' } });

            await waitFor(() => {
                expect(screen.getByText('Jane')).toBeInTheDocument();
                expect(screen.queryByText('John')).not.toBeInTheDocument();
            });
        });

        test('shows no results message when search has no matches', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

            await waitFor(() => {
                expect(screen.getByText('No contacts match your search.')).toBeInTheDocument();
            });
        });

        test('clear search button appears when search term exists', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'John' } });

            await waitFor(() => {
                expect(screen.getByText('✕')).toBeInTheDocument();
            });
        });

        test('clear search button clears the search', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');
            fireEvent.change(searchInput, { target: { value: 'John' } });

            await waitFor(() => {
                expect(screen.queryByText('Jane')).not.toBeInTheDocument();
            });

            const clearButton = screen.getByText('✕');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(screen.getByText('Jane')).toBeInTheDocument();
                expect(screen.getByText('Bob')).toBeInTheDocument();
            });
        });

        test('clear button is hidden when search is empty', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            expect(screen.queryByText('✕')).not.toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        test('navigates to contact details when row is clicked', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const firstRow = screen.getByText('John').closest('tr');
            fireEvent.click(firstRow);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-details/1');
        });

        test('navigates to create contact form when button clicked', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('+ Create Contact')).toBeInTheDocument();
            });

            const createButton = screen.getByText('+ Create Contact');
            fireEvent.click(createButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-form');
        });

        test('navigates back to job details when back button clicked', async () => {
            mockUseJob.selectedJobId = 456;
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('←')).toBeInTheDocument();
            });

            const backButton = screen.getByText('←');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/456');
        });

        test('linkedin link does not trigger row click', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                const linkedinLinks = screen.getAllByText('linkedin');
                expect(linkedinLinks.length).toBeGreaterThan(0);
            });

            const linkedinLink = screen.getAllByText('linkedin')[0];
            fireEvent.click(linkedinLink);

            // Should not navigate to contact details
            expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/contact-details'));
        });
    });

    describe('Export Functionality', () => {
        test('exports contacts successfully', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.exportContacts.mockResolvedValue({
                contact_export_dir: '/exports',
                contact_export_file: 'contacts_2025-01-15.csv',
            });

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Export Contacts')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Contacts');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportContacts).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(console.log).toHaveBeenCalledWith(
                    'Contacts exported to: /exports/contacts_2025-01-15.csv'
                );
            });
        });

        test('creates download link with correct attributes on export', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.exportContacts.mockResolvedValue({
                contact_export_dir: '/exports',
                contact_export_file: 'contacts_export.csv',
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

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Export Contacts')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Contacts');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(createdLink.href).toBe('http://api.test.com/v1/files/exports/contacts_export.csv');
                expect(createdLink.download).toBe('contacts_export.csv');
                expect(createdLink.setAttribute).toHaveBeenCalledWith('target', '_blank');
                expect(createdLink.click).toHaveBeenCalled();
            });
        });

        test('handles export error gracefully', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);
            apiService.exportContacts.mockRejectedValue(new Error('Export failed'));

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('Export Contacts')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Contacts');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error exporting contacts:',
                    expect.any(Error)
                );
                expect(window.alert).toHaveBeenCalledWith('Failed to export contacts');
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles contacts with missing optional fields', async () => {
            const contactsWithMissingData = [
                {
                    contact_id: 1,
                    first_name: 'John',
                    last_name: 'Doe',
                    job_title: null,
                    email: null,
                    phone: null,
                    company: null,
                    linkedin: null,
                },
            ];

            apiService.getAllContacts.mockResolvedValue(contactsWithMissingData);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
                expect(screen.getByText('Doe')).toBeInTheDocument();
            });

            // Should not have LinkedIn link
            expect(screen.queryByText('linkedin')).not.toBeInTheDocument();
        });

        test('displays all contacts when search is cleared', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');

            // Search
            fireEvent.change(searchInput, { target: { value: 'John' } });

            await waitFor(() => {
                expect(screen.queryByText('Jane')).not.toBeInTheDocument();
            });

            // Clear search
            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
                expect(screen.getByText('Jane')).toBeInTheDocument();
                expect(screen.getByText('Bob')).toBeInTheDocument();
            });
        });

        test('handles rapid search input changes', async () => {
            apiService.getAllContacts.mockResolvedValue(mockContacts);

            render(<Contacts />);

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search contacts...');

            fireEvent.change(searchInput, { target: { value: 'J' } });
            fireEvent.change(searchInput, { target: { value: 'Jo' } });
            fireEvent.change(searchInput, { target: { value: 'Joh' } });
            fireEvent.change(searchInput, { target: { value: 'John' } });

            await waitFor(() => {
                expect(screen.getByText('John')).toBeInTheDocument();
                expect(screen.queryByText('Bob')).not.toBeInTheDocument();
            });
        });
    });
});
