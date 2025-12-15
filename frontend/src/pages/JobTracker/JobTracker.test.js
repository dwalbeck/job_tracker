import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import JobTracker from './JobTracker';
import apiService from '../../services/api';
import { JobProvider } from '../../context/JobContext';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/api', () => ({
    ...jest.requireActual('../../services/api'),
    getAllJobs: jest.fn(),
    getPersonalInfo: jest.fn(),
    updateJob: jest.fn(),
    exportJobs: jest.fn(),
    baseURL: 'http://localhost:8000'
}));

jest.mock('../../utils/logger', () => ({
    logPageView: jest.fn()
}));

jest.mock('../../components/JobCard/JobCard', () => {
    return function MockJobCard({ job, onClick }) {
        return (
            <div
                data-testid={`job-card-${job.job_id}`}
                onClick={onClick}
                className="job-card"
            >
                <div>{job.company}</div>
                <div>{job.job_title}</div>
            </div>
        );
    };
});

jest.mock('../../components/ExportMenu/ExportMenu', () => {
    return function MockExportMenu({ label, onExport }) {
        return <button onClick={onExport}>{label}</button>;
    };
});

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
    DragDropContext: ({ children, onDragEnd }) => (
        <div data-testid="drag-drop-context" data-ondragend={onDragEnd}>
            {children}
        </div>
    ),
    Droppable: ({ children, droppableId }) => {
        const provided = {
            innerRef: jest.fn(),
            droppableProps: {},
            placeholder: null
        };
        const snapshot = { isDraggingOver: false };
        return (
            <div data-testid={`droppable-${droppableId}`}>
                {children(provided, snapshot)}
            </div>
        );
    }
}));

const mockNavigate = jest.fn();
const mockSelectJob = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

jest.mock('../../context/JobContext', () => ({
    ...jest.requireActual('../../context/JobContext'),
    useJob: () => ({ selectJob: mockSelectJob }),
    JobProvider: ({ children }) => <div>{children}</div>
}));

global.alert = jest.fn();

const renderWithProviders = (component) => {
    return render(
        <MemoryRouter>
            <JobProvider>
                {component}
            </JobProvider>
        </MemoryRouter>
    );
};

describe('JobTracker Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        mockSelectJob.mockClear();
        global.alert.mockClear();
    });

    const mockJobs = [
        {
            job_id: 1,
            company: 'Tech Corp',
            job_title: 'Software Engineer',
            job_status: 'applied',
            last_contact: '2025-01-20'
        },
        {
            job_id: 2,
            company: 'Data Inc',
            job_title: 'Data Scientist',
            job_status: 'interviewing',
            last_contact: '2025-01-25'
        },
        {
            job_id: 3,
            company: 'Web Solutions',
            job_title: 'Frontend Developer',
            job_status: 'rejected',
            last_contact: '2025-01-15'
        },
        {
            job_id: 4,
            company: 'Mobile Apps',
            job_title: 'iOS Developer',
            job_status: 'no response',
            last_contact: '2024-12-01'
        }
    ];

    const mockPersonalInfo = {
        no_response_week: 2
    };

    describe('Initial Rendering', () => {
        test('shows loading state initially', () => {
            apiService.getAllJobs.mockImplementation(() => new Promise(() => {}));
            apiService.getPersonalInfo.mockImplementation(() => new Promise(() => {}));

            renderWithProviders(<JobTracker />);

            expect(screen.getByText('Loading jobs...')).toBeInTheDocument();
        });

        test('logs page view on mount', () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            expect(logger.logPageView).toHaveBeenCalledWith('Job Posting', '/job-tracker');
        });

        test('renders page title and controls after loading', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Job Posting')).toBeInTheDocument();
            });

            expect(screen.getByPlaceholderText('Search companies...')).toBeInTheDocument();
            expect(screen.getByText('+ Add Job')).toBeInTheDocument();
            expect(screen.getByText('Export Jobs')).toBeInTheDocument();
        });

        test('fetches personal settings on mount', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(apiService.getPersonalInfo).toHaveBeenCalled();
            });
        });

        test('fetches jobs after personal settings loaded', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(apiService.getAllJobs).toHaveBeenCalled();
            });
        });
    });

    describe('Job Columns', () => {
        test('renders all job status columns', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Applied')).toBeInTheDocument();
            });

            expect(screen.getByText('Interviewing')).toBeInTheDocument();
            expect(screen.getByText('Rejected')).toBeInTheDocument();
            expect(screen.getByText('No Response')).toBeInTheDocument();
        });

        test('displays job count in each column', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('1 Job')).toBeInTheDocument(); // Applied
            });

            expect(screen.getByText('1 Job')).toBeInTheDocument(); // Interviewing
        });

        test('displays jobs in correct columns', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.getByText('Data Inc')).toBeInTheDocument();
            expect(screen.getByText('Web Solutions')).toBeInTheDocument();
            expect(screen.getByText('Mobile Apps')).toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        test('filters jobs by company name', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search companies...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            expect(screen.queryByText('Data Inc')).not.toBeInTheDocument();
            expect(screen.queryByText('Web Solutions')).not.toBeInTheDocument();
        });

        test('search is case insensitive', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search companies...');
            fireEvent.change(searchInput, { target: { value: 'tech' } });

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });
        });

        test('shows clear search button when searching', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search companies...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search companies...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('✕')).toBeInTheDocument();
            });
        });

        test('clears search when clicking clear button', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search companies...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search companies...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.getByText('✕')).toBeInTheDocument();
            });

            const clearButton = screen.getByText('✕');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
        });

        test('shows all jobs when search is cleared', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search companies...');
            fireEvent.change(searchInput, { target: { value: 'Tech' } });

            await waitFor(() => {
                expect(screen.queryByText('Data Inc')).not.toBeInTheDocument();
            });

            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('Data Inc')).toBeInTheDocument();
            });
        });
    });

    describe('Job Click Navigation', () => {
        test('navigates to job details on job click', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            });

            const jobCard = screen.getByTestId('job-card-1');
            fireEvent.click(jobCard);

            expect(mockSelectJob).toHaveBeenCalledWith(1);
            expect(mockNavigate).toHaveBeenCalledWith('/job-details/1');
        });
    });

    describe('Add Job', () => {
        test('navigates to job form on add job click', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('+ Add Job')).toBeInTheDocument();
            });

            const addJobButton = screen.getByText('+ Add Job');
            fireEvent.click(addJobButton);

            expect(mockNavigate).toHaveBeenCalledWith('/job-form');
        });
    });

    describe('Drag and Drop', () => {
        test('renders drag drop context', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
            });
        });

        test('renders droppable areas for each column', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByTestId('droppable-applied')).toBeInTheDocument();
            });

            expect(screen.getByTestId('droppable-interviewing')).toBeInTheDocument();
            expect(screen.getByTestId('droppable-rejected')).toBeInTheDocument();
            expect(screen.getByTestId('droppable-no response')).toBeInTheDocument();
        });
    });

    describe('Export Jobs', () => {
        test('exports jobs successfully', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.exportJobs.mockResolvedValue({
                job_export_dir: '/tmp',
                job_export_file: 'jobs.csv'
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

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Export Jobs')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Jobs');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(apiService.exportJobs).toHaveBeenCalled();
            });

            expect(mockLink.click).toHaveBeenCalled();
        });

        test('handles export error', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);
            apiService.exportJobs.mockRejectedValue(new Error('Export failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Export Jobs')).toBeInTheDocument();
            });

            const exportButton = screen.getByText('Export Jobs');
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to export jobs');
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Auto-move Old Jobs', () => {
        test('auto-moves old jobs to no response', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 21); // 3 weeks ago

            const jobsWithOld = [
                {
                    job_id: 1,
                    company: 'Old Corp',
                    job_title: 'Developer',
                    job_status: 'applied',
                    last_contact: oldDate.toISOString().split('T')[0]
                }
            ];

            apiService.getAllJobs.mockResolvedValue(jobsWithOld);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 2 });
            apiService.updateJob.mockResolvedValue({});

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(apiService.updateJob).toHaveBeenCalledWith(
                    expect.objectContaining({ job_status: 'no response' })
                );
            });
        });

        test('does not move recent jobs', async () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 7); // 1 week ago

            const jobsWithRecent = [
                {
                    job_id: 1,
                    company: 'Recent Corp',
                    job_title: 'Developer',
                    job_status: 'applied',
                    last_contact: recentDate.toISOString().split('T')[0]
                }
            ];

            apiService.getAllJobs.mockResolvedValue(jobsWithRecent);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 2 });

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Recent Corp')).toBeInTheDocument();
            });

            // Should not call updateJob for recent jobs
            expect(apiService.updateJob).not.toHaveBeenCalled();
        });

        test('does not move jobs already in no response', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 21);

            const jobsWithNoResponse = [
                {
                    job_id: 1,
                    company: 'No Response Corp',
                    job_title: 'Developer',
                    job_status: 'no response',
                    last_contact: oldDate.toISOString().split('T')[0]
                }
            ];

            apiService.getAllJobs.mockResolvedValue(jobsWithNoResponse);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 2 });

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('No Response Corp')).toBeInTheDocument();
            });

            expect(apiService.updateJob).not.toHaveBeenCalled();
        });

        test('does not move rejected jobs', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 21);

            const jobsWithRejected = [
                {
                    job_id: 1,
                    company: 'Rejected Corp',
                    job_title: 'Developer',
                    job_status: 'rejected',
                    last_contact: oldDate.toISOString().split('T')[0]
                }
            ];

            apiService.getAllJobs.mockResolvedValue(jobsWithRejected);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 2 });

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Rejected Corp')).toBeInTheDocument();
            });

            expect(apiService.updateJob).not.toHaveBeenCalled();
        });

        test('handles auto-move update error gracefully', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 21);

            const jobsWithOld = [
                {
                    job_id: 1,
                    company: 'Old Corp',
                    job_title: 'Developer',
                    job_status: 'applied',
                    last_contact: oldDate.toISOString().split('T')[0]
                }
            ];

            apiService.getAllJobs.mockResolvedValue(jobsWithOld);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 2 });
            apiService.updateJob.mockRejectedValue(new Error('Update failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Error updating job'),
                    expect.any(Error)
                );
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('handles jobs fetch error', async () => {
            apiService.getAllJobs.mockRejectedValue(new Error('Network error'));
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching jobs:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles personal settings fetch error', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockRejectedValue(new Error('Network error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching personal settings:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('sets empty jobs array on fetch error', async () => {
            apiService.getAllJobs.mockRejectedValue(new Error('Network error'));
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                // Should still render but with no jobs
                expect(screen.getByText('Job Posting')).toBeInTheDocument();
            });
        });
    });

    describe('Empty States', () => {
        test('displays empty columns when no jobs', async () => {
            apiService.getAllJobs.mockResolvedValue([]);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('0 Jobs')).toBeInTheDocument();
            });
        });

        test('displays zero count in all columns when no jobs', async () => {
            apiService.getAllJobs.mockResolvedValue([]);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                const zeroCounts = screen.getAllByText('0 Jobs');
                expect(zeroCounts.length).toBe(4); // One for each column
            });
        });
    });

    describe('Personal Settings', () => {
        test('uses no_response_week from personal settings', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: 4 });

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Job Posting')).toBeInTheDocument();
            });
        });

        test('handles null no_response_week', async () => {
            apiService.getAllJobs.mockResolvedValue(mockJobs);
            apiService.getPersonalInfo.mockResolvedValue({ no_response_week: null });

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('Job Posting')).toBeInTheDocument();
            });
        });
    });

    describe('Job Counts', () => {
        test('displays singular "Job" for count of 1', async () => {
            const singleJob = [mockJobs[0]];
            apiService.getAllJobs.mockResolvedValue(singleJob);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('1 Job')).toBeInTheDocument();
            });
        });

        test('displays plural "Jobs" for count > 1', async () => {
            const multipleJobs = [
                { ...mockJobs[0], job_id: 1 },
                { ...mockJobs[0], job_id: 2 }
            ];
            apiService.getAllJobs.mockResolvedValue(multipleJobs);
            apiService.getPersonalInfo.mockResolvedValue(mockPersonalInfo);

            renderWithProviders(<JobTracker />);

            await waitFor(() => {
                expect(screen.getByText('2 Jobs')).toBeInTheDocument();
            });
        });
    });
});
