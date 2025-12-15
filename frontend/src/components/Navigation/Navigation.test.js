import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './Navigation';
import { useJob } from '../../context/JobContext';

// Mock the JobContext
jest.mock('../../context/JobContext');

const mockNavigateToPage = jest.fn();

// Mock useLocation
const mockLocation = { pathname: '/' };
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => mockLocation,
}));

describe('Navigation Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useJob.mockReturnValue({
            navigateToPage: mockNavigateToPage,
        });
        mockLocation.pathname = '/';
    });

    describe('Component Rendering', () => {
        test('renders navigation component', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const nav = document.querySelector('.navigation');
            expect(nav).toBeInTheDocument();
        });

        test('renders logo images', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const logoImg = screen.getByAltText('Job Tracker Logo');
            const titleImg = screen.getByAltText('Job Tracker');

            expect(logoImg).toBeInTheDocument();
            expect(titleImg).toBeInTheDocument();
        });

        test('logo images have correct src attributes', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const logoImg = screen.getByAltText('Job Tracker Logo');
            const titleImg = screen.getByAltText('Job Tracker');

            expect(logoImg).toHaveAttribute('src', '/jt_logo-128.png');
            expect(titleImg).toHaveAttribute('src', '/job_track_now.png');
        });

        test('title image has correct width', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const titleImg = screen.getByAltText('Job Tracker');
            expect(titleImg).toHaveAttribute('width', '120');
        });

        test('renders all menu items', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Job Posting')).toBeInTheDocument();
            expect(screen.getByText('Contacts')).toBeInTheDocument();
            expect(screen.getByText('Calendar')).toBeInTheDocument();
            expect(screen.getByText('Notes')).toBeInTheDocument();
            expect(screen.getByText('Documents')).toBeInTheDocument();
            expect(screen.getByText('Resume')).toBeInTheDocument();
            expect(screen.getByText('Cover Letter')).toBeInTheDocument();
            expect(screen.getByText('Personal')).toBeInTheDocument();
        });

        test('renders exactly 9 menu items', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const navItems = document.querySelectorAll('.nav-item');
            expect(navItems).toHaveLength(9);
        });
    });

    describe('Menu Item Links', () => {
        test('Home link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const homeLink = screen.getByText('Home').closest('a');
            expect(homeLink).toHaveAttribute('href', '/');
        });

        test('Job Posting link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const jobLink = screen.getByText('Job Posting').closest('a');
            expect(jobLink).toHaveAttribute('href', '/job-tracker');
        });

        test('Contacts link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const contactsLink = screen.getByText('Contacts').closest('a');
            expect(contactsLink).toHaveAttribute('href', '/contacts');
        });

        test('Calendar link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const calendarLink = screen.getByText('Calendar').closest('a');
            expect(calendarLink).toHaveAttribute('href', '/calendar');
        });

        test('Notes link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const notesLink = screen.getByText('Notes').closest('a');
            expect(notesLink).toHaveAttribute('href', '/notes');
        });

        test('Documents link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const documentsLink = screen.getByText('Documents').closest('a');
            expect(documentsLink).toHaveAttribute('href', '/documents');
        });

        test('Resume link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const resumeLink = screen.getByText('Resume').closest('a');
            expect(resumeLink).toHaveAttribute('href', '/resume');
        });

        test('Cover Letter link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const coverLetterLink = screen.getByText('Cover Letter').closest('a');
            expect(coverLetterLink).toHaveAttribute('href', '/cover-letter');
        });

        test('Personal link has correct path', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const personalLink = screen.getByText('Personal').closest('a');
            expect(personalLink).toHaveAttribute('href', '/personal');
        });
    });

    describe('Active State', () => {
        test('highlights Home when on home page', () => {
            mockLocation.pathname = '/';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const homeLink = screen.getByText('Home').closest('a');
            expect(homeLink).toHaveClass('active');
        });

        test('highlights Job Posting when on job tracker page', () => {
            mockLocation.pathname = '/job-tracker';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const jobLink = screen.getByText('Job Posting').closest('a');
            expect(jobLink).toHaveClass('active');
        });

        test('highlights Contacts when on contacts page', () => {
            mockLocation.pathname = '/contacts';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const contactsLink = screen.getByText('Contacts').closest('a');
            expect(contactsLink).toHaveClass('active');
        });

        test('highlights Calendar when on calendar page', () => {
            mockLocation.pathname = '/calendar';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const calendarLink = screen.getByText('Calendar').closest('a');
            expect(calendarLink).toHaveClass('active');
        });

        test('highlights Notes when on notes page', () => {
            mockLocation.pathname = '/notes';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const notesLink = screen.getByText('Notes').closest('a');
            expect(notesLink).toHaveClass('active');
        });

        test('highlights Documents when on documents page', () => {
            mockLocation.pathname = '/documents';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const documentsLink = screen.getByText('Documents').closest('a');
            expect(documentsLink).toHaveClass('active');
        });

        test('highlights Resume when on resume page', () => {
            mockLocation.pathname = '/resume';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const resumeLink = screen.getByText('Resume').closest('a');
            expect(resumeLink).toHaveClass('active');
        });

        test('highlights Cover Letter when on cover letter page', () => {
            mockLocation.pathname = '/cover-letter';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const coverLetterLink = screen.getByText('Cover Letter').closest('a');
            expect(coverLetterLink).toHaveClass('active');
        });

        test('highlights Personal when on personal page', () => {
            mockLocation.pathname = '/personal';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const personalLink = screen.getByText('Personal').closest('a');
            expect(personalLink).toHaveClass('active');
        });

        test('only one menu item is active at a time', () => {
            mockLocation.pathname = '/contacts';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const activeLinks = document.querySelectorAll('.nav-item.active');
            expect(activeLinks).toHaveLength(1);
        });

        test('no menu item is active on unknown route', () => {
            mockLocation.pathname = '/unknown-route';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const activeLinks = document.querySelectorAll('.nav-item.active');
            expect(activeLinks).toHaveLength(0);
        });
    });

    describe('Click Handlers', () => {
        test('calls navigateToPage with "home" when Home clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const homeLink = screen.getByText('Home');
            fireEvent.click(homeLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('home');
        });

        test('calls navigateToPage with "job-tracker" when Job Posting clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const jobLink = screen.getByText('Job Posting');
            fireEvent.click(jobLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('job-tracker');
        });

        test('calls navigateToPage with "contacts" when Contacts clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const contactsLink = screen.getByText('Contacts');
            fireEvent.click(contactsLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('contacts');
        });

        test('calls navigateToPage with "calendar" when Calendar clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const calendarLink = screen.getByText('Calendar');
            fireEvent.click(calendarLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('calendar');
        });

        test('calls navigateToPage with "notes" when Notes clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const notesLink = screen.getByText('Notes');
            fireEvent.click(notesLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('notes');
        });

        test('calls navigateToPage with "documents" when Documents clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const documentsLink = screen.getByText('Documents');
            fireEvent.click(documentsLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('documents');
        });

        test('calls navigateToPage with "resume" when Resume clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const resumeLink = screen.getByText('Resume');
            fireEvent.click(resumeLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('resume');
        });

        test('calls navigateToPage with "cover-letter" when Cover Letter clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const coverLetterLink = screen.getByText('Cover Letter');
            fireEvent.click(coverLetterLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('cover-letter');
        });

        test('calls navigateToPage with "personal" when Personal clicked', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const personalLink = screen.getByText('Personal');
            fireEvent.click(personalLink);

            expect(mockNavigateToPage).toHaveBeenCalledWith('personal');
        });

        test('calls navigateToPage exactly once per click', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const homeLink = screen.getByText('Home');
            fireEvent.click(homeLink);

            expect(mockNavigateToPage).toHaveBeenCalledTimes(1);
        });
    });

    describe('CSS Classes', () => {
        test('applies nav-item class to all menu items', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const navItems = document.querySelectorAll('.nav-item');
            expect(navItems.length).toBeGreaterThan(0);
            navItems.forEach(item => {
                expect(item).toHaveClass('nav-item');
            });
        });

        test('applies nav-logo class to logo image', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const logoImg = screen.getByAltText('Job Tracker Logo');
            expect(logoImg).toHaveClass('nav-logo');
        });

        test('applies nav-title-image class to title image', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const titleImg = screen.getByAltText('Job Tracker');
            expect(titleImg).toHaveClass('nav-title-image');
        });

        test('applies nav-logo-container class', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const logoContainer = document.querySelector('.nav-logo-container');
            expect(logoContainer).toBeInTheDocument();
        });

        test('applies nav-container class', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const navContainer = document.querySelector('.nav-container');
            expect(navContainer).toBeInTheDocument();
        });
    });

    describe('JobContext Integration', () => {
        test('calls useJob hook', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            expect(useJob).toHaveBeenCalled();
        });

        test('handles missing navigateToPage gracefully', () => {
            useJob.mockReturnValue({
                navigateToPage: undefined,
            });

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const homeLink = screen.getByText('Home');

            // Should not crash when navigateToPage is undefined
            expect(() => fireEvent.click(homeLink)).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('renders correctly when location pathname has trailing slash', () => {
            mockLocation.pathname = '/contacts/';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const contactsLink = screen.getByText('Contacts').closest('a');
            // Should not be active because pathname doesn't match exactly
            expect(contactsLink).not.toHaveClass('active');
        });

        test('renders correctly when location pathname is nested', () => {
            mockLocation.pathname = '/job-tracker/123';

            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const jobLink = screen.getByText('Job Posting').closest('a');
            // Should not be active because it's a nested route
            expect(jobLink).not.toHaveClass('active');
        });

        test('all links have nav-item class', () => {
            render(
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            );

            const links = document.querySelectorAll('a.nav-item');
            expect(links).toHaveLength(9);
        });
    });
});
