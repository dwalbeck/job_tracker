import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Documents from './Documents';
import apiService from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

// Mock window.confirm
global.confirm = jest.fn();

// Mock document methods for download
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

const mockNavigate = jest.fn();

describe('Documents Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.confirm.mockReturnValue(true);
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        // Mock baseURL
        Object.defineProperty(apiService, 'baseURL', {
            value: 'http://localhost:8000',
            writable: true
        });
    });

    const mockCompanyReports = [
        {
            company_id: 1,
            company_name: 'Acme Corp',
            website_url: 'https://acme.com',
            linkedin_url: 'https://linkedin.com/company/acme',
            hq_city: 'San Francisco',
            hq_state: 'CA',
            industry: 'Technology',
            logo_file: 'acme_logo.png',
            report_created: '2025-01-15T10:00:00',
            report_html: '<html>Report</html>'
        },
        {
            company_id: 2,
            company_name: 'Beta Inc',
            website_url: 'https://beta.com',
            linkedin_url: 'https://linkedin.com/company/beta',
            hq_city: 'Boston',
            hq_state: 'MA',
            industry: 'Finance',
            logo_file: 'beta_logo.png',
            report_created: '2025-01-20T10:00:00',
            report_html: '<html>Report</html>'
        }
    ];

    describe('Initial Rendering', () => {
        test('renders loading state initially', () => {
            apiService.getCompanyList.mockReturnValue(new Promise(() => {}));

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            expect(screen.getByText('Loading company reports...')).toBeInTheDocument();
        });

        test('renders company reports after loading', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
                expect(screen.getByText('Beta Inc')).toBeInTheDocument();
            });
        });

        test('renders page title and controls', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Documents/i })).toBeInTheDocument();
                expect(screen.getByRole('heading', { name: /Company Reports/i })).toBeInTheDocument();
                expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });
        });

        test('displays no reports message when list is empty', async () => {
            apiService.getCompanyList.mockResolvedValue([]);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('No company reports found.')).toBeInTheDocument();
            });
        });

        test('handles error when fetching reports fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();
            apiService.getCompanyList.mockRejectedValue(new Error('API Error'));

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(
                    'Error fetching company reports:',
                    expect.any(Error)
                );
            });

            consoleError.mockRestore();
        });
    });

    describe('Search Functionality', () => {
        test('filters reports by company name', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
                expect(screen.getByText('Beta Inc')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('search');
            fireEvent.change(searchInput, { target: { value: 'Acme' } });

            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
        });

        test('search is case insensitive', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('search');
            fireEvent.change(searchInput, { target: { value: 'acme' } });

            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
        });

        test('shows clear button when search has text', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('search');

            // Clear button should not be visible initially
            expect(screen.queryByText('✕')).not.toBeInTheDocument();

            fireEvent.change(searchInput, { target: { value: 'test' } });

            // Clear button should be visible
            expect(screen.getByText('✕')).toBeInTheDocument();
        });

        test('clear button resets search', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('search');
            fireEvent.change(searchInput, { target: { value: 'Acme' } });

            expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();

            const clearButton = screen.getByText('✕');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        });

        test('shows no results when search matches nothing', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('search');
            fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

            expect(screen.getByText('No company reports found.')).toBeInTheDocument();
        });
    });

    describe('Create Report Button', () => {
        test('navigates to company research page when clicked', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            expect(mockNavigate).toHaveBeenCalledWith('/company-research');
        });
    });

    describe('Delete Functionality', () => {
        test('prompts for confirmation before deleting', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            expect(global.confirm).toHaveBeenCalledWith(
                'Are you sure you want to delete the report for Acme Corp?'
            );
        });

        test('deletes report when confirmed', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);
            apiService.deleteCompany.mockResolvedValue({ status: 'success' });
            global.confirm.mockReturnValue(true);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(apiService.deleteCompany).toHaveBeenCalledWith(1);
                expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
                expect(screen.getByText('Beta Inc')).toBeInTheDocument();
            });
        });

        test('does not delete report when cancelled', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);
            global.confirm.mockReturnValue(false);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            expect(apiService.deleteCompany).not.toHaveBeenCalled();
            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        });

        test('shows alert on delete error', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);
            apiService.deleteCompany.mockRejectedValue(new Error('Delete failed'));
            global.confirm.mockReturnValue(true);
            global.alert = jest.fn();

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText('Delete');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'Failed to delete company report. Please try again.'
                );
            });
        });
    });

    describe('Download Functionality', () => {
        test('downloads report when download button clicked', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);
            apiService.downloadCompanyReport.mockResolvedValue({
                file_name: 'acme_corp_company_report.docx'
            });

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(apiService.downloadCompanyReport).toHaveBeenCalledWith(1);
                expect(document.body.appendChild).toHaveBeenCalled();
                expect(document.body.removeChild).toHaveBeenCalled();
            });
        });

        test('shows alert on download error', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);
            apiService.downloadCompanyReport.mockRejectedValue(new Error('Download failed'));
            global.alert = jest.fn();

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
            });

            const downloadButtons = screen.getAllByText('Download');
            fireEvent.click(downloadButtons[0]);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'Failed to download company report. Please try again.'
                );
            });
        });
    });

    describe('Report Card Display', () => {
        test('displays company information correctly', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Acme Corp')).toBeInTheDocument();
                expect(screen.getByText('https://acme.com')).toBeInTheDocument();
                expect(screen.getByText('Linkedin Link')).toBeInTheDocument();
                expect(screen.getByText('Technology')).toBeInTheDocument();
                expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
                expect(screen.getByText('2025-01-15')).toBeInTheDocument();
            });
        });

        test('displays logo image when available', async () => {
            apiService.getCompanyList.mockResolvedValue(mockCompanyReports);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                const logos = screen.getAllByAltText(/logo/i);
                expect(logos.length).toBeGreaterThan(0);
                expect(logos[0]).toHaveAttribute(
                    'src',
                    'http://localhost:8000/v1/files/logos/acme_logo.png'
                );
            });
        });

        test('handles missing optional fields', async () => {
            const incompleteReport = [{
                company_id: 1,
                company_name: 'Minimal Corp',
                website_url: '',
                linkedin_url: '',
                hq_city: '',
                hq_state: '',
                industry: '',
                logo_file: '',
                report_created: '2025-01-15T10:00:00',
                report_html: '<html>Report</html>'
            }];

            apiService.getCompanyList.mockResolvedValue(incompleteReport);

            render(
                <BrowserRouter>
                    <Documents />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Minimal Corp')).toBeInTheDocument();
                expect(screen.getByText('2025-01-15')).toBeInTheDocument();
            });
        });
    });
});
