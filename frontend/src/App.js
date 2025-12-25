import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {JobProvider} from './context/JobContext';
import {ReminderProvider, useReminder} from './context/ReminderContext';
import Navigation from './components/Navigation/Navigation';
import ReminderAlert from './components/ReminderAlert/ReminderAlert';
import Home from './pages/Home/Home';
import JobTracker from './pages/JobTracker/JobTracker';
import JobDetails from './pages/JobDetails/JobDetails';
import JobForm from './components/JobForm/JobForm';
import Contacts from './pages/Contacts/Contacts';
import ContactDetails from './pages/ContactDetails/ContactDetails';
import ContactForm from './components/ContactForm/ContactForm';
import Calendar from './pages/Calendar/Calendar';
import CalendarForm from './components/CalendarForm/CalendarForm';
import Notes from './pages/Notes/Notes';
import NotesForm from './components/NotesForm/NotesForm';
import Documents from './pages/Documents/Documents';
import Resume from './pages/Resume/Resume';
import ResumeForm from './pages/ResumeForm/ResumeForm';
import ViewResume from './pages/ViewResume/ViewResume';
import EditResume from './pages/EditResume/EditResume';
import ManuallyEditResume from './pages/ManuallyEditResume/ManuallyEditResume';
import CoverLetter from './pages/CoverLetter/CoverLetter';
import CreateCoverLetter from './pages/CreateCoverLetter/CreateCoverLetter';
import Personal from './pages/Personal/Personal';
import JobAnalysis from './pages/JobAnalysis/JobAnalysis';
import OptimizedResume from './pages/OptimizedResume/OptimizedResume';
import CompanyResearch from './pages/CompanyResearch/CompanyResearch';
import ViewCompanyReport from './pages/ViewCompanyReport/ViewCompanyReport';
import logger from './utils/logger';
import './styles/App.css';

const AppContent = () => {
    const {activeReminder, dismissReminder} = useReminder();

    return (
        <Router>
            <div className="app">
                <Navigation/>
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/job-tracker" element={<JobTracker/>}/>
                        <Route path="/job-details/:id" element={<JobDetails/>}/>
                        <Route path="/job-form" element={<JobForm/>}/>
                        <Route path="/job-form/:id" element={<JobForm/>}/>
                        <Route path="/contacts" element={<Contacts/>}/>
                        <Route path="/contact-details/:id" element={<ContactDetails/>}/>
                        <Route path="/contact-form" element={<ContactForm/>}/>
                        <Route path="/contact-form/:id" element={<ContactForm/>}/>
                        <Route path="/calendar" element={<Calendar/>}/>
                        <Route path="/calendar-form" element={<CalendarForm/>}/>
                        <Route path="/calendar-form/:id" element={<CalendarForm/>}/>
                        <Route path="/notes" element={<Notes/>}/>
                        <Route path="/notes-form" element={<NotesForm/>}/>
                        <Route path="/notes-form/:id" element={<NotesForm/>}/>
                        <Route path="/documents" element={<Documents/>}/>
                        <Route path="/resume" element={<Resume/>}/>
                        <Route path="/resume-form" element={<ResumeForm/>}/>
                        <Route path="/resume-form/:id" element={<ResumeForm/>}/>
                        <Route path="/view-resume" element={<ViewResume/>}/>
                        <Route path="/edit-resume" element={<EditResume/>}/>
                        <Route path="/manually-edit-resume" element={<ManuallyEditResume/>}/>
                        <Route path="/cover-letter" element={<CoverLetter/>}/>
                        <Route path="/create-cover-letter" element={<CreateCoverLetter/>}/>
                        <Route path="/personal" element={<Personal/>}/>
                        <Route path="/job-analysis/:id" element={<JobAnalysis/>}/>
                        <Route path="/optimized-resume/:id" element={<OptimizedResume/>}/>
                        <Route path="/company-research" element={<CompanyResearch/>}/>
                        <Route path="/company-report/:id" element={<ViewCompanyReport/>}/>
                    </Routes>
                </div>

                {activeReminder && (
                    <ReminderAlert
                        reminder={activeReminder}
                        onDismiss={dismissReminder}
                    />
                )}
            </div>
        </Router>
    );
};

function App() {
    useEffect(() => {
        logger.info('Job Tracker Portal application started', {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });

        // Log any unhandled errors
        const handleError = (event) => {
            logger.logError(event.error, 'Unhandled application error');
        };

        const handleUnhandledRejection = (event) => {
            logger.error('Unhandled promise rejection', {
                reason: event.reason,
                type: 'unhandled_rejection'
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    return (
        <JobProvider>
            <ReminderProvider>
                <AppContent/>
            </ReminderProvider>
        </JobProvider>
    );
}

export default App;