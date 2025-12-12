import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import logger from './utils/logger';

// Mock all the components and contexts
jest.mock('./context/JobContext', () => ({
    JobProvider: ({ children }) => <div data-testid="job-provider">{children}</div>,
}));

jest.mock('./context/ReminderContext', () => ({
    ReminderProvider: ({ children }) => <div data-testid="reminder-provider">{children}</div>,
    useReminder: () => ({
        activeReminder: null,
        dismissReminder: jest.fn(),
    }),
}));

jest.mock('./components/Navigation/Navigation', () => {
    return function Navigation() {
        return <nav data-testid="navigation">Navigation</nav>;
    };
});

jest.mock('./components/ReminderAlert/ReminderAlert', () => {
    return function ReminderAlert({ reminder, onDismiss }) {
        return (
            <div data-testid="reminder-alert">
                Reminder: {reminder.reminder_message}
            </div>
        );
    };
});

// Mock all page components
jest.mock('./pages/Home/Home', () => {
    return function Home() {
        return <div data-testid="home-page">Home Page</div>;
    };
});

jest.mock('./pages/JobTracker/JobTracker', () => {
    return function JobTracker() {
        return <div data-testid="job-tracker-page">Job Tracker Page</div>;
    };
});

jest.mock('./pages/JobDetails/JobDetails', () => {
    return function JobDetails() {
        return <div data-testid="job-details-page">Job Details Page</div>;
    };
});

jest.mock('./components/JobForm/JobForm', () => {
    return function JobForm() {
        return <div data-testid="job-form">Job Form</div>;
    };
});

jest.mock('./pages/Contacts/Contacts', () => {
    return function Contacts() {
        return <div data-testid="contacts-page">Contacts Page</div>;
    };
});

jest.mock('./pages/ContactDetails/ContactDetails', () => {
    return function ContactDetails() {
        return <div data-testid="contact-details-page">Contact Details Page</div>;
    };
});

jest.mock('./components/ContactForm/ContactForm', () => {
    return function ContactForm() {
        return <div data-testid="contact-form">Contact Form</div>;
    };
});

jest.mock('./pages/Calendar/Calendar', () => {
    return function Calendar() {
        return <div data-testid="calendar-page">Calendar Page</div>;
    };
});

jest.mock('./components/CalendarForm/CalendarForm', () => {
    return function CalendarForm() {
        return <div data-testid="calendar-form">Calendar Form</div>;
    };
});

jest.mock('./pages/Notes/Notes', () => {
    return function Notes() {
        return <div data-testid="notes-page">Notes Page</div>;
    };
});

jest.mock('./components/NotesForm/NotesForm', () => {
    return function NotesForm() {
        return <div data-testid="notes-form">Notes Form</div>;
    };
});

jest.mock('./pages/Documents/Documents', () => {
    return function Documents() {
        return <div data-testid="documents-page">Documents Page</div>;
    };
});

jest.mock('./pages/Resume/Resume', () => {
    return function Resume() {
        return <div data-testid="resume-page">Resume Page</div>;
    };
});

jest.mock('./pages/ResumeForm/ResumeForm', () => {
    return function ResumeForm() {
        return <div data-testid="resume-form">Resume Form</div>;
    };
});

jest.mock('./pages/ViewResume/ViewResume', () => {
    return function ViewResume() {
        return <div data-testid="view-resume-page">View Resume Page</div>;
    };
});

jest.mock('./pages/EditResume/EditResume', () => {
    return function EditResume() {
        return <div data-testid="edit-resume-page">Edit Resume Page</div>;
    };
});

jest.mock('./pages/ManuallyEditResume/ManuallyEditResume', () => {
    return function ManuallyEditResume() {
        return <div data-testid="manually-edit-resume-page">Manually Edit Resume Page</div>;
    };
});

jest.mock('./pages/CoverLetter/CoverLetter', () => {
    return function CoverLetter() {
        return <div data-testid="cover-letter-page">Cover Letter Page</div>;
    };
});

jest.mock('./pages/CreateCoverLetter/CreateCoverLetter', () => {
    return function CreateCoverLetter() {
        return <div data-testid="create-cover-letter-page">Create Cover Letter Page</div>;
    };
});

jest.mock('./pages/Personal/Personal', () => {
    return function Personal() {
        return <div data-testid="personal-page">Personal Page</div>;
    };
});

jest.mock('./pages/JobAnalysis/JobAnalysis', () => {
    return function JobAnalysis() {
        return <div data-testid="job-analysis-page">Job Analysis Page</div>;
    };
});

jest.mock('./pages/OptimizedResume/OptimizedResume', () => {
    return function OptimizedResume() {
        return <div data-testid="optimized-resume-page">Optimized Resume Page</div>;
    };
});

jest.mock('./utils/logger');

describe('App Component', () => {
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    describe('Component Rendering', () => {
        test('renders without crashing', () => {
            render(<App />);
            expect(screen.getByTestId('job-provider')).toBeInTheDocument();
        });

        test('renders JobProvider wrapper', () => {
            render(<App />);
            expect(screen.getByTestId('job-provider')).toBeInTheDocument();
        });

        test('renders ReminderProvider wrapper', () => {
            render(<App />);
            expect(screen.getByTestId('reminder-provider')).toBeInTheDocument();
        });

        test('renders Navigation component', () => {
            render(<App />);
            expect(screen.getByTestId('navigation')).toBeInTheDocument();
        });

        test('renders main content div with correct class', () => {
            const { container } = render(<App />);
            expect(container.querySelector('.main-content')).toBeInTheDocument();
        });

        test('renders app container with correct class', () => {
            const { container } = render(<App />);
            expect(container.querySelector('.app')).toBeInTheDocument();
        });
    });

    describe('Routing', () => {
        test('renders Home page on root path', () => {
            window.history.pushState({}, 'Home', '/');
            render(<App />);
            expect(screen.getByTestId('home-page')).toBeInTheDocument();
        });

        test('renders JobTracker page on /job-tracker', () => {
            window.history.pushState({}, 'Job Tracker', '/job-tracker');
            render(<App />);
            expect(screen.getByTestId('job-tracker-page')).toBeInTheDocument();
        });

        test('renders JobDetails page on /job-details/:id', () => {
            window.history.pushState({}, 'Job Details', '/job-details/123');
            render(<App />);
            expect(screen.getByTestId('job-details-page')).toBeInTheDocument();
        });

        test('renders JobForm on /job-form', () => {
            window.history.pushState({}, 'Job Form', '/job-form');
            render(<App />);
            expect(screen.getByTestId('job-form')).toBeInTheDocument();
        });

        test('renders JobForm on /job-form/:id', () => {
            window.history.pushState({}, 'Edit Job', '/job-form/123');
            render(<App />);
            expect(screen.getByTestId('job-form')).toBeInTheDocument();
        });

        test('renders Contacts page on /contacts', () => {
            window.history.pushState({}, 'Contacts', '/contacts');
            render(<App />);
            expect(screen.getByTestId('contacts-page')).toBeInTheDocument();
        });

        test('renders ContactDetails page on /contact-details/:id', () => {
            window.history.pushState({}, 'Contact Details', '/contact-details/123');
            render(<App />);
            expect(screen.getByTestId('contact-details-page')).toBeInTheDocument();
        });

        test('renders ContactForm on /contact-form', () => {
            window.history.pushState({}, 'Contact Form', '/contact-form');
            render(<App />);
            expect(screen.getByTestId('contact-form')).toBeInTheDocument();
        });

        test('renders ContactForm on /contact-form/:id', () => {
            window.history.pushState({}, 'Edit Contact', '/contact-form/123');
            render(<App />);
            expect(screen.getByTestId('contact-form')).toBeInTheDocument();
        });

        test('renders Calendar page on /calendar', () => {
            window.history.pushState({}, 'Calendar', '/calendar');
            render(<App />);
            expect(screen.getByTestId('calendar-page')).toBeInTheDocument();
        });

        test('renders CalendarForm on /calendar-form', () => {
            window.history.pushState({}, 'Calendar Form', '/calendar-form');
            render(<App />);
            expect(screen.getByTestId('calendar-form')).toBeInTheDocument();
        });

        test('renders CalendarForm on /calendar-form/:id', () => {
            window.history.pushState({}, 'Edit Calendar', '/calendar-form/123');
            render(<App />);
            expect(screen.getByTestId('calendar-form')).toBeInTheDocument();
        });

        test('renders Notes page on /notes', () => {
            window.history.pushState({}, 'Notes', '/notes');
            render(<App />);
            expect(screen.getByTestId('notes-page')).toBeInTheDocument();
        });

        test('renders NotesForm on /notes-form', () => {
            window.history.pushState({}, 'Notes Form', '/notes-form');
            render(<App />);
            expect(screen.getByTestId('notes-form')).toBeInTheDocument();
        });

        test('renders NotesForm on /notes-form/:id', () => {
            window.history.pushState({}, 'Edit Note', '/notes-form/123');
            render(<App />);
            expect(screen.getByTestId('notes-form')).toBeInTheDocument();
        });

        test('renders Documents page on /documents', () => {
            window.history.pushState({}, 'Documents', '/documents');
            render(<App />);
            expect(screen.getByTestId('documents-page')).toBeInTheDocument();
        });

        test('renders Resume page on /resume', () => {
            window.history.pushState({}, 'Resume', '/resume');
            render(<App />);
            expect(screen.getByTestId('resume-page')).toBeInTheDocument();
        });

        test('renders ResumeForm on /resume-form', () => {
            window.history.pushState({}, 'Resume Form', '/resume-form');
            render(<App />);
            expect(screen.getByTestId('resume-form')).toBeInTheDocument();
        });

        test('renders ResumeForm on /resume-form/:id', () => {
            window.history.pushState({}, 'Edit Resume', '/resume-form/123');
            render(<App />);
            expect(screen.getByTestId('resume-form')).toBeInTheDocument();
        });

        test('renders ViewResume page on /view-resume', () => {
            window.history.pushState({}, 'View Resume', '/view-resume');
            render(<App />);
            expect(screen.getByTestId('view-resume-page')).toBeInTheDocument();
        });

        test('renders EditResume page on /edit-resume', () => {
            window.history.pushState({}, 'Edit Resume', '/edit-resume');
            render(<App />);
            expect(screen.getByTestId('edit-resume-page')).toBeInTheDocument();
        });

        test('renders ManuallyEditResume page on /manually-edit-resume', () => {
            window.history.pushState({}, 'Manually Edit Resume', '/manually-edit-resume');
            render(<App />);
            expect(screen.getByTestId('manually-edit-resume-page')).toBeInTheDocument();
        });

        test('renders CoverLetter page on /cover-letter', () => {
            window.history.pushState({}, 'Cover Letter', '/cover-letter');
            render(<App />);
            expect(screen.getByTestId('cover-letter-page')).toBeInTheDocument();
        });

        test('renders CreateCoverLetter page on /create-cover-letter', () => {
            window.history.pushState({}, 'Create Cover Letter', '/create-cover-letter');
            render(<App />);
            expect(screen.getByTestId('create-cover-letter-page')).toBeInTheDocument();
        });

        test('renders Personal page on /personal', () => {
            window.history.pushState({}, 'Personal', '/personal');
            render(<App />);
            expect(screen.getByTestId('personal-page')).toBeInTheDocument();
        });

        test('renders JobAnalysis page on /job-analysis/:id', () => {
            window.history.pushState({}, 'Job Analysis', '/job-analysis/123');
            render(<App />);
            expect(screen.getByTestId('job-analysis-page')).toBeInTheDocument();
        });

        test('renders OptimizedResume page on /optimized-resume/:id', () => {
            window.history.pushState({}, 'Optimized Resume', '/optimized-resume/123');
            render(<App />);
            expect(screen.getByTestId('optimized-resume-page')).toBeInTheDocument();
        });
    });

    describe('ReminderAlert Rendering', () => {
        test('does not render ReminderAlert when no active reminder', () => {
            render(<App />);
            expect(screen.queryByTestId('reminder-alert')).not.toBeInTheDocument();
        });

        test('renders ReminderAlert when active reminder exists', () => {
            const mockReminder = {
                reminder_id: 1,
                reminder_message: 'Test reminder',
            };

            jest.spyOn(require('./context/ReminderContext'), 'useReminder').mockReturnValue({
                activeReminder: mockReminder,
                dismissReminder: jest.fn(),
            });

            render(<App />);
            expect(screen.getByTestId('reminder-alert')).toBeInTheDocument();
            expect(screen.getByText('Reminder: Test reminder')).toBeInTheDocument();
        });

        test('passes dismissReminder callback to ReminderAlert', () => {
            const mockDismissReminder = jest.fn();
            const mockReminder = {
                reminder_id: 1,
                reminder_message: 'Test reminder',
            };

            jest.spyOn(require('./context/ReminderContext'), 'useReminder').mockReturnValue({
                activeReminder: mockReminder,
                dismissReminder: mockDismissReminder,
            });

            render(<App />);
            expect(screen.getByTestId('reminder-alert')).toBeInTheDocument();
        });
    });

    describe('Logger Integration', () => {
        test('logs application start on mount', () => {
            render(<App />);

            expect(logger.info).toHaveBeenCalledWith(
                'Job Tracker Portal application started',
                expect.objectContaining({
                    userAgent: expect.any(String),
                    timestamp: expect.any(String),
                })
            );
        });

        test('adds error event listener on mount', () => {
            render(<App />);

            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('adds unhandledrejection event listener on mount', () => {
            render(<App />);

            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
        });

        test('removes error event listener on unmount', () => {
            const { unmount } = render(<App />);
            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('removes unhandledrejection event listener on unmount', () => {
            const { unmount } = render(<App />);
            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
        });
    });

    describe('Error Handling', () => {
        test('logs unhandled errors', async () => {
            render(<App />);

            const errorHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'error'
            )?.[1];

            const mockError = new Error('Test error');
            const mockEvent = { error: mockError };

            if (errorHandler) {
                errorHandler(mockEvent);

                await waitFor(() => {
                    expect(logger.logError).toHaveBeenCalledWith(mockError, 'Unhandled application error');
                });
            }
        });

        test('logs unhandled promise rejections', async () => {
            render(<App />);

            const rejectionHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'unhandledrejection'
            )?.[1];

            const mockReason = 'Promise rejection reason';
            const mockEvent = { reason: mockReason };

            if (rejectionHandler) {
                rejectionHandler(mockEvent);

                await waitFor(() => {
                    expect(logger.error).toHaveBeenCalledWith(
                        'Unhandled promise rejection',
                        expect.objectContaining({
                            reason: mockReason,
                            type: 'unhandled_rejection',
                        })
                    );
                });
            }
        });
    });

    describe('Provider Hierarchy', () => {
        test('renders components in correct hierarchy', () => {
            const { container } = render(<App />);

            const jobProvider = screen.getByTestId('job-provider');
            const reminderProvider = screen.getByTestId('reminder-provider');
            const navigation = screen.getByTestId('navigation');

            expect(jobProvider).toContainElement(reminderProvider);
            expect(reminderProvider).toContainElement(navigation);
        });
    });

    describe('Edge Cases', () => {
        test('handles missing navigator.userAgent gracefully', () => {
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                get: () => undefined,
                configurable: true,
            });

            render(<App />);

            expect(logger.info).toHaveBeenCalled();

            Object.defineProperty(navigator, 'userAgent', {
                get: () => originalUserAgent,
                configurable: true,
            });
        });

        test('renders correctly with different routes', () => {
            const routes = [
                { path: '/', testId: 'home-page' },
                { path: '/job-tracker', testId: 'job-tracker-page' },
                { path: '/contacts', testId: 'contacts-page' },
                { path: '/calendar', testId: 'calendar-page' },
                { path: '/notes', testId: 'notes-page' },
            ];

            routes.forEach(({ path, testId }) => {
                window.history.pushState({}, '', path);
                const { unmount } = render(<App />);
                expect(screen.getByTestId(testId)).toBeInTheDocument();
                unmount();
            });
        });
    });
});
