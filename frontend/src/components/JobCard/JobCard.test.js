import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import JobCard from './JobCard';
import { calculateDateSpan, calculateLastContact } from '../../utils/dateUtils';

// Mock utility functions
jest.mock('../../utils/dateUtils');

// Helper component to wrap JobCard with required DnD context
const DnDWrapper = ({ children }) => (
    <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="test-droppable">
            {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                    {children}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </DragDropContext>
);

describe('JobCard Component', () => {
    const mockOnClick = jest.fn();

    const mockJob = {
        job_id: 1,
        job_title: 'Senior Software Engineer',
        company: 'TechCorp',
        last_activity: '2025-03-10',
        average_score: 7.5,
        date_applied: '2025-03-01',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock utility function implementations
        calculateLastContact.mockReturnValue('5 days ago');
        calculateDateSpan.mockReturnValue('14 days');
    });

    describe('Component Rendering', () => {
        test('renders job card with all job details', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('TechCorp')).toBeInTheDocument();
            expect(screen.getByText('5 days ago')).toBeInTheDocument();
            expect(screen.getByText('Avg Score: 7.5')).toBeInTheDocument();
            expect(screen.getByText('14 days')).toBeInTheDocument();
        });

        test('renders job title correctly', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobTitle = screen.getByText('Senior Software Engineer');
            expect(jobTitle).toHaveClass('job-title');
        });

        test('renders company name correctly', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const companyName = screen.getByText('TechCorp');
            expect(companyName).toHaveClass('company-name');
        });

        test('renders last contact information', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const lastContact = screen.getByText('5 days ago');
            expect(lastContact).toHaveClass('last-contact');
        });

        test('renders date span information', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const dateSpan = screen.getByText('14 days');
            expect(dateSpan).toHaveClass('date-span');
        });
    });

    describe('Average Score Display', () => {
        test('displays average score when value is provided', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: 7.5')).toBeInTheDocument();
        });

        test('displays average score of 0 when value is 0', () => {
            const jobWithZeroScore = { ...mockJob, average_score: 0 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithZeroScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: 0')).toBeInTheDocument();
        });

        test('does not display average score when value is null', () => {
            const jobWithNullScore = { ...mockJob, average_score: null };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithNullScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.queryByText(/Avg Score/)).not.toBeInTheDocument();
        });

        test('does not display average score when value is undefined', () => {
            const jobWithUndefinedScore = { ...mockJob, average_score: undefined };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithUndefinedScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.queryByText(/Avg Score/)).not.toBeInTheDocument();
        });

        test('displays decimal average score correctly', () => {
            const jobWithDecimalScore = { ...mockJob, average_score: 8.75 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithDecimalScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: 8.75')).toBeInTheDocument();
        });

        test('displays integer average score correctly', () => {
            const jobWithIntegerScore = { ...mockJob, average_score: 9 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithIntegerScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: 9')).toBeInTheDocument();
        });
    });

    describe('Click Interaction', () => {
        test('calls onClick handler when card is clicked', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');
            fireEvent.click(jobCard);

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        test('does not crash when onClick is not provided', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={undefined} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');

            // Should not crash when clicked without onClick handler
            expect(() => fireEvent.click(jobCard)).not.toThrow();
        });
    });

    describe('Utility Function Integration', () => {
        test('calls calculateLastContact with last_activity date', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(calculateLastContact).toHaveBeenCalledWith('2025-03-10');
        });

        test('calls calculateDateSpan with date_applied', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(calculateDateSpan).toHaveBeenCalledWith('2025-03-01');
        });

        test('displays formatted last contact from utility', () => {
            calculateLastContact.mockReturnValue('2 weeks ago');

            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
        });

        test('displays formatted date span from utility', () => {
            calculateDateSpan.mockReturnValue('30 days');

            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('30 days')).toBeInTheDocument();
        });
    });

    describe('Draggable Functionality', () => {
        test('renders with draggable props', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');

            // Verify draggable attributes are present
            expect(jobCard).toHaveAttribute('data-rbd-draggable-context-id');
            expect(jobCard).toHaveAttribute('data-rbd-draggable-id');
        });

        test('uses job_id as draggableId', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');
            expect(jobCard).toHaveAttribute('data-rbd-draggable-id', '1');
        });

        test('handles different job_id types correctly', () => {
            const jobWithLargeId = { ...mockJob, job_id: 12345 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithLargeId} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');
            expect(jobCard).toHaveAttribute('data-rbd-draggable-id', '12345');
        });

        test('renders at correct index position', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={5} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');
            expect(jobCard).toBeInTheDocument();
        });
    });

    describe('CSS Classes', () => {
        test('applies job-card class', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Senior Software Engineer').closest('.job-card');
            expect(jobCard).toHaveClass('job-card');
        });

        test('applies correct classes to all child elements', () => {
            render(
                <DnDWrapper>
                    <JobCard job={mockJob} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(document.querySelector('.job-title')).toBeInTheDocument();
            expect(document.querySelector('.company-name')).toBeInTheDocument();
            expect(document.querySelector('.last-contact')).toBeInTheDocument();
            expect(document.querySelector('.bottom-row')).toBeInTheDocument();
            expect(document.querySelector('.score-average')).toBeInTheDocument();
            expect(document.querySelector('.date-span')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles very long job titles', () => {
            const jobWithLongTitle = {
                ...mockJob,
                job_title: 'Senior Principal Staff Software Engineering Architect Lead Developer Manager',
            };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithLongTitle} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(
                screen.getByText('Senior Principal Staff Software Engineering Architect Lead Developer Manager')
            ).toBeInTheDocument();
        });

        test('handles very long company names', () => {
            const jobWithLongCompany = {
                ...mockJob,
                company: 'International Business Machines Corporation Technologies Limited Inc.',
            };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithLongCompany} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(
                screen.getByText('International Business Machines Corporation Technologies Limited Inc.')
            ).toBeInTheDocument();
        });

        test('handles empty string values gracefully', () => {
            const jobWithEmptyStrings = {
                ...mockJob,
                job_title: '',
                company: '',
            };

            calculateLastContact.mockReturnValue('');
            calculateDateSpan.mockReturnValue('');

            render(
                <DnDWrapper>
                    <JobCard job={jobWithEmptyStrings} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            const jobCard = screen.getByText('Avg Score: 7.5').closest('.job-card');
            expect(jobCard).toBeInTheDocument();
        });

        test('handles negative average scores', () => {
            const jobWithNegativeScore = { ...mockJob, average_score: -1 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithNegativeScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: -1')).toBeInTheDocument();
        });

        test('handles very high average scores', () => {
            const jobWithHighScore = { ...mockJob, average_score: 100 };

            render(
                <DnDWrapper>
                    <JobCard job={jobWithHighScore} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Avg Score: 100')).toBeInTheDocument();
        });
    });

    describe('Different Job Data', () => {
        test('renders different jobs with unique data', () => {
            const job1 = {
                job_id: 1,
                job_title: 'Frontend Developer',
                company: 'StartupCo',
                last_activity: '2025-03-15',
                average_score: 8,
                date_applied: '2025-03-01',
            };

            const job2 = {
                job_id: 2,
                job_title: 'Backend Engineer',
                company: 'BigCorp',
                last_activity: '2025-03-14',
                average_score: 6.5,
                date_applied: '2025-02-28',
            };

            calculateLastContact.mockReturnValueOnce('1 day ago').mockReturnValueOnce('2 days ago');
            calculateDateSpan.mockReturnValueOnce('14 days').mockReturnValueOnce('15 days');

            const { rerender } = render(
                <DnDWrapper>
                    <JobCard job={job1} index={0} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
            expect(screen.getByText('StartupCo')).toBeInTheDocument();
            expect(screen.getByText('Avg Score: 8')).toBeInTheDocument();

            rerender(
                <DnDWrapper>
                    <JobCard job={job2} index={1} onClick={mockOnClick} />
                </DnDWrapper>
            );

            expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
            expect(screen.getByText('BigCorp')).toBeInTheDocument();
            expect(screen.getByText('Avg Score: 6.5')).toBeInTheDocument();
        });
    });
});
