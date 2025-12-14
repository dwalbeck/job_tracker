import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ContactForm from './ContactForm';
import apiService from '../../services/api';
import { formatPhoneNumber } from '../../utils/phoneUtils';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../utils/phoneUtils');

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [mockSearchParams],
}));

// Mock console.error
const originalConsoleError = console.error;

describe('ContactForm Component', () => {
    const mockJobs = [
        { job_id: 1, company: 'TechCorp', job_title: 'Senior Developer' },
        { job_id: 2, company: 'StartupXYZ', job_title: 'Backend Engineer' },
        { job_id: 3, company: 'BigCompany', job_title: 'Frontend Developer' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
        mockSearchParams.delete('job_id');

        // Mock phone formatter
        formatPhoneNumber.mockImplementation((value) => {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length <= 3) return cleaned;
            if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        });

        // Mock API calls
        apiService.getJobList.mockResolvedValue(mockJobs);
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Add Mode - Component Rendering', () => {
        test('renders form in add mode with correct title', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Add New Contact')).toBeInTheDocument();
            });
        });

        test('renders all form fields', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
            expect(screen.getByLabelText(/LinkedIn/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Link to Job/)).toBeInTheDocument();
            expect(screen.getByLabelText(/Note/)).toBeInTheDocument();
        });

        test('renders required field indicators', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name \*/)).toBeInTheDocument();
            });

            expect(screen.getByLabelText(/Last Name \*/)).toBeInTheDocument();
        });

        test('renders action buttons', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            expect(screen.getByText('Add Contact')).toBeInTheDocument();
        });

        test('initializes with empty values', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toHaveValue('');
            });

            expect(screen.getByLabelText(/Last Name/)).toHaveValue('');
            expect(screen.getByLabelText(/Email/)).toHaveValue('');
            expect(screen.getByLabelText(/Phone Number/)).toHaveValue('');
        });

        test('does not show loading state initially in add mode', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Loading contact data...')).not.toBeInTheDocument();
            });
        });
    });

    describe('Job List Population', () => {
        test('fetches job list on mount', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getJobList).toHaveBeenCalled();
            });
        });

        test('populates job dropdown with fetched jobs', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('TechCorp - Senior Developer')).toBeInTheDocument();
            });

            expect(screen.getByText('StartupXYZ - Backend Engineer')).toBeInTheDocument();
            expect(screen.getByText('BigCompany - Frontend Developer')).toBeInTheDocument();
        });

        test('displays "No job selected" as default option', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('No job selected')).toBeInTheDocument();
            });
        });

        test('handles job list fetch error gracefully', async () => {
            apiService.getJobList.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith('Error fetching jobs:', expect.any(Error));
            });

            // Should still render the form
            expect(screen.getByText('Add New Contact')).toBeInTheDocument();
        });

        test('sets empty array when job list returns null', async () => {
            apiService.getJobList.mockResolvedValue(null);

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('No job selected')).toBeInTheDocument();
            });

            // Should only have the default "No job selected" option
            const jobSelect = screen.getByLabelText(/Link to Job/);
            const options = jobSelect.querySelectorAll('option');
            expect(options).toHaveLength(1);
        });
    });

    describe('Job Pre-selection via Query Parameter', () => {
        test('pre-selects job when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '2');

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Link to Job/);
                expect(jobSelect).toHaveValue('2');
            });
        });

        test('does not pre-select job when job_id is not in query params', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobSelect = screen.getByLabelText(/Link to Job/);
                expect(jobSelect).toHaveValue('');
            });
        });
    });

    describe('Edit Mode - Component Rendering', () => {
        const mockContactData = {
            contact_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            job_title: 'Recruiter',
            email: 'john.doe@example.com',
            phone: '555-123-4567',
            company: 'TechCorp',
            linkedin: 'https://linkedin.com/in/johndoe',
            contact_note: 'Very helpful recruiter',
            job_id: 1,
        };

        beforeEach(() => {
            apiService.getContact.mockResolvedValue(mockContactData);
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('renders form in edit mode with correct title', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Contact')).toBeInTheDocument();
            });
        });

        test('shows loading state while fetching contact data', () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            expect(screen.getByText('Loading contact data...')).toBeInTheDocument();
        });

        test('fetches contact data on mount in edit mode', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(apiService.getContact).toHaveBeenCalledWith('1');
            });
        });

        test('populates form with fetched contact data', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toHaveValue('John');
            });

            expect(screen.getByLabelText(/Last Name/)).toHaveValue('Doe');
            expect(screen.getByLabelText(/Job Title/)).toHaveValue('Recruiter');
            expect(screen.getByLabelText(/Email/)).toHaveValue('john.doe@example.com');
            expect(screen.getByLabelText(/Phone Number/)).toHaveValue('555-123-4567');
            expect(screen.getByLabelText(/Company Name/)).toHaveValue('TechCorp');
            expect(screen.getByLabelText(/LinkedIn/)).toHaveValue('https://linkedin.com/in/johndoe');
            expect(screen.getByLabelText(/Note/)).toHaveValue('Very helpful recruiter');
            expect(screen.getByLabelText(/Link to Job/)).toHaveValue('1');
        });

        test('displays Update Contact button in edit mode', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Update Contact')).toBeInTheDocument();
            });
        });

        test('handles fetch error gracefully', async () => {
            apiService.getContact.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Failed to load contact data')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error fetching contact:', expect.any(Error));
        });
    });

    describe('Form Field Interactions', () => {
        test('updates first name field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            const firstNameInput = screen.getByLabelText(/First Name/);
            fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

            expect(firstNameInput).toHaveValue('Jane');
        });

        test('updates last name field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
            });

            const lastNameInput = screen.getByLabelText(/Last Name/);
            fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

            expect(lastNameInput).toHaveValue('Smith');
        });

        test('updates job title field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
            });

            const jobTitleInput = screen.getByLabelText(/Job Title/);
            fireEvent.change(jobTitleInput, { target: { value: 'Hiring Manager' } });

            expect(jobTitleInput).toHaveValue('Hiring Manager');
        });

        test('updates company field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
            });

            const companyInput = screen.getByLabelText(/Company Name/);
            fireEvent.change(companyInput, { target: { value: 'NewCorp' } });

            expect(companyInput).toHaveValue('NewCorp');
        });

        test('updates email field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
            });

            const emailInput = screen.getByLabelText(/Email/);
            fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

            expect(emailInput).toHaveValue('jane@example.com');
        });

        test('formats phone number on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
            });

            const phoneInput = screen.getByLabelText(/Phone Number/);
            fireEvent.change(phoneInput, { target: { value: '5551234567' } });

            expect(formatPhoneNumber).toHaveBeenCalledWith('5551234567');
            expect(phoneInput).toHaveValue('555-123-4567');
        });

        test('updates linkedin field on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/LinkedIn/)).toBeInTheDocument();
            });

            const linkedinInput = screen.getByLabelText(/LinkedIn/);
            fireEvent.change(linkedinInput, { target: { value: 'https://linkedin.com/in/janesmith' } });

            expect(linkedinInput).toHaveValue('https://linkedin.com/in/janesmith');
        });

        test('updates job selection on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Link to Job/)).toBeInTheDocument();
            });

            const jobSelect = screen.getByLabelText(/Link to Job/);
            fireEvent.change(jobSelect, { target: { value: '2' } });

            expect(jobSelect).toHaveValue('2');
        });

        test('updates contact note on change', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note/)).toBeInTheDocument();
            });

            const noteTextarea = screen.getByLabelText(/Note/);
            fireEvent.change(noteTextarea, { target: { value: 'Very responsive and helpful' } });

            expect(noteTextarea).toHaveValue('Very responsive and helpful');
        });
    });

    describe('Phone Number Formatting', () => {
        test('calls formatPhoneNumber utility when phone changes', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
            });

            const phoneInput = screen.getByLabelText(/Phone Number/);
            fireEvent.change(phoneInput, { target: { value: '1234567890' } });

            expect(formatPhoneNumber).toHaveBeenCalledWith('1234567890');
        });

        test('applies formatted phone number to field', async () => {
            formatPhoneNumber.mockReturnValue('123-456-7890');

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
            });

            const phoneInput = screen.getByLabelText(/Phone Number/);
            fireEvent.change(phoneInput, { target: { value: '1234567890' } });

            expect(phoneInput).toHaveValue('123-456-7890');
        });

        test('handles partial phone numbers correctly', async () => {
            formatPhoneNumber.mockReturnValue('555-12');

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
            });

            const phoneInput = screen.getByLabelText(/Phone Number/);
            fireEvent.change(phoneInput, { target: { value: '55512' } });

            expect(phoneInput).toHaveValue('555-12');
        });
    });

    describe('Form Submission - Add Mode', () => {
        test('submits form with correct data in add mode', async () => {
            apiService.createContact.mockResolvedValue({ contact_id: 1 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });
            fireEvent.change(screen.getByLabelText(/Link to Job/), { target: { value: '1' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john@example.com',
                        job_id: 1,
                    })
                );
            });
        });

        test('converts job_id to integer when submitting', async () => {
            apiService.createContact.mockResolvedValue({ contact_id: 1 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Link to Job/), { target: { value: '2' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: 2,
                    })
                );
            });
        });

        test('sets job_id to null when no job selected', async () => {
            apiService.createContact.mockResolvedValue({ contact_id: 1 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        job_id: null,
                    })
                );
            });
        });

        test('navigates to contact details after successful submission without job_id param', async () => {
            apiService.createContact.mockResolvedValue({ contact_id: 5 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/contact-details/5');
            });
        });

        test('navigates to job details when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '3');
            apiService.createContact.mockResolvedValue({ contact_id: 5 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/3');
            });
        });

        test('shows loading state during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createContact.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeInTheDocument();

            resolvePromise({ contact_id: 1 });
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalled();
            });
        });

        test('disables buttons during submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            apiService.createContact.mockReturnValue(promise);

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            expect(screen.getByText('Saving...')).toBeDisabled();
            expect(screen.getByText('Cancel')).toBeDisabled();

            resolvePromise({ contact_id: 1 });
        });

        test('handles submission error gracefully', async () => {
            apiService.createContact.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save contact')).toBeInTheDocument();
            });

            expect(console.error).toHaveBeenCalledWith('Error saving contact:', expect.any(Error));
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test('re-enables buttons after submission error', async () => {
            apiService.createContact.mockRejectedValue(new Error('Network error'));

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            const submitButton = screen.getByText('Add Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save contact')).toBeInTheDocument();
            });

            expect(screen.getByText('Add Contact')).not.toBeDisabled();
            expect(screen.getByText('Cancel')).not.toBeDisabled();
        });
    });

    describe('Form Submission - Edit Mode', () => {
        const mockContactData = {
            contact_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            job_title: 'Recruiter',
            email: 'john.doe@example.com',
            phone: '555-123-4567',
            company: 'TechCorp',
            linkedin: 'https://linkedin.com/in/johndoe',
            contact_note: 'Very helpful',
            job_id: 1,
        };

        beforeEach(() => {
            apiService.getContact.mockResolvedValue(mockContactData);
            apiService.updateContact.mockResolvedValue({ contact_id: 1 });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
        });

        test('calls updateContact with modified data in edit mode', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toHaveValue('John');
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Jane' } });

            const submitButton = screen.getByText('Update Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(apiService.updateContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        contact_id: 1,
                        first_name: 'Jane',
                    })
                );
            });
        });

        test('navigates to contact details after successful update without job_id param', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toHaveValue('John');
            });

            const submitButton = screen.getByText('Update Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/contact-details/1');
            });
        });

        test('navigates to job details when job_id is in query params', async () => {
            mockSearchParams.set('job_id', '2');

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toHaveValue('John');
            });

            const submitButton = screen.getByText('Update Contact');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/job-details/2');
            });
        });
    });

    describe('Cancel Functionality', () => {
        test('navigates to contacts page when cancel clicked in add mode without job_id param', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contacts');
        });

        test('navigates to job details when cancel clicked in add mode with job_id param', async () => {
            mockSearchParams.set('job_id', '3');

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/3');
        });

        test('navigates to contact details when cancel clicked in edit mode without job_id param', async () => {
            apiService.getContact.mockResolvedValue({
                contact_id: 1,
                first_name: 'John',
                last_name: 'Doe',
            });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Contact')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/contact-details/1');
        });

        test('navigates to job details when cancel clicked in edit mode with job_id param', async () => {
            mockSearchParams.set('job_id', '2');
            apiService.getContact.mockResolvedValue({
                contact_id: 1,
                first_name: 'John',
                last_name: 'Doe',
            });
            jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Edit Contact')).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-details/2');
        });
    });

    describe('Field Placeholders and Attributes', () => {
        test('displays correct placeholder for job title field', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const jobTitleInput = screen.getByLabelText(/Job Title/);
                expect(jobTitleInput).toHaveAttribute('placeholder', 'e.g., Senior Software Engineer');
            });
        });

        test('displays correct placeholder for company field', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const companyInput = screen.getByLabelText(/Company Name/);
                expect(companyInput).toHaveAttribute('placeholder', 'e.g., Tech Corp Inc.');
            });
        });

        test('displays correct placeholder for email field', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const emailInput = screen.getByLabelText(/Email/);
                expect(emailInput).toHaveAttribute('placeholder', 'john.doe@example.com');
            });
        });

        test('displays correct placeholder for phone field', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const phoneInput = screen.getByLabelText(/Phone Number/);
                expect(phoneInput).toHaveAttribute('placeholder', '555-123-4567');
            });
        });

        test('displays correct placeholder for linkedin field', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const linkedinInput = screen.getByLabelText(/LinkedIn/);
                expect(linkedinInput).toHaveAttribute('placeholder', 'https://linkedin.com/in/johndoe');
            });
        });

        test('displays correct placeholder for note textarea', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const noteTextarea = screen.getByLabelText(/Note/);
                expect(noteTextarea).toHaveAttribute('placeholder', 'Additional notes about this contact...');
            });
        });

        test('phone field has maxLength attribute of 12', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const phoneInput = screen.getByLabelText(/Phone Number/);
                expect(phoneInput).toHaveAttribute('maxLength', '12');
            });
        });

        test('note textarea has 4 rows', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                const noteTextarea = screen.getByLabelText(/Note/);
                expect(noteTextarea).toHaveAttribute('rows', '4');
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles very long contact note', async () => {
            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Note/)).toBeInTheDocument();
            });

            const longNote = 'A'.repeat(2000);
            const noteTextarea = screen.getByLabelText(/Note/);
            fireEvent.change(noteTextarea, { target: { value: longNote } });

            expect(noteTextarea).toHaveValue(longNote);
        });

        test('clears error message on successful re-submission', async () => {
            apiService.createContact.mockRejectedValueOnce(new Error('Network error'));
            apiService.createContact.mockResolvedValueOnce({ contact_id: 1 });

            render(
                <BrowserRouter>
                    <ContactForm />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
            });

            fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });

            // First submission fails
            fireEvent.click(screen.getByText('Add Contact'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save contact')).toBeInTheDocument();
            });

            // Second submission succeeds
            fireEvent.click(screen.getByText('Add Contact'));

            await waitFor(() => {
                expect(screen.queryByText('Failed to save contact')).not.toBeInTheDocument();
            });
        });
    });
});
