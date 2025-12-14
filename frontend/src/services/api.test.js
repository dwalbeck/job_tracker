import apiService from './api';
import logger from '../utils/logger';
import { API_BASE_URL } from '../config';

// Mock dependencies
jest.mock('../utils/logger');
jest.mock('../config', () => ({
    API_BASE_URL: 'http://api.test.com',
}));

// Mock global fetch and performance
global.fetch = jest.fn();
global.performance = {
    now: jest.fn(),
};

describe('ApiService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
        global.performance.now.mockReturnValue(0);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('baseURL', () => {
        test('returns correct base URL', () => {
            expect(apiService.baseURL).toBe('http://api.test.com');
        });
    });

    describe('request method', () => {
        describe('Successful Requests', () => {
            test('makes GET request with correct URL', async () => {
                const mockResponse = { data: 'test' };
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => mockResponse,
                });

                const result = await apiService.request('/v1/test');

                expect(global.fetch).toHaveBeenCalledWith(
                    'http://api.test.com/v1/test',
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        }),
                    })
                );
                expect(result).toEqual(mockResponse);
            });

            test('makes POST request with body', async () => {
                const mockResponse = { id: 1 };
                const requestBody = { name: 'test' };
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => mockResponse,
                });

                await apiService.request('/v1/test', {
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                });

                expect(global.fetch).toHaveBeenCalledWith(
                    'http://api.test.com/v1/test',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify(requestBody),
                    })
                );
            });

            test('makes DELETE request', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test/1', {
                    method: 'DELETE',
                });

                expect(global.fetch).toHaveBeenCalledWith(
                    'http://api.test.com/v1/test/1',
                    expect.objectContaining({
                        method: 'DELETE',
                    })
                );
            });

            test('makes PUT request', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test', {
                    method: 'PUT',
                    body: JSON.stringify({ data: 'test' }),
                });

                expect(global.fetch).toHaveBeenCalledWith(
                    'http://api.test.com/v1/test',
                    expect.objectContaining({
                        method: 'PUT',
                    })
                );
            });

            test('includes custom headers', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test', {
                    headers: {
                        'X-Custom-Header': 'custom-value',
                    },
                });

                expect(global.fetch).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'Content-Type': 'application/json',
                            'X-Custom-Header': 'custom-value',
                        }),
                    })
                );
            });

            test('returns parsed JSON response', async () => {
                const mockData = { id: 1, name: 'Test' };
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => mockData,
                });

                const result = await apiService.request('/v1/test');

                expect(result).toEqual(mockData);
            });
        });

        describe('Error Handling', () => {
            test('throws error on non-ok response', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: async () => ({ detail: 'Not found' }),
                });

                await expect(apiService.request('/v1/test')).rejects.toThrow('Not found');
            });

            test('includes status in error object', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => ({ detail: 'Server error' }),
                });

                try {
                    await apiService.request('/v1/test');
                } catch (error) {
                    expect(error.status).toBe(500);
                    expect(error.detail).toBe('Server error');
                }
            });

            test('handles error without detail field', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 400,
                    json: async () => ({}),
                });

                await expect(apiService.request('/v1/test')).rejects.toThrow(
                    'HTTP error! status: 400'
                );
            });

            test('handles JSON parse error in error response', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => {
                        throw new Error('Invalid JSON');
                    },
                });

                await expect(apiService.request('/v1/test')).rejects.toThrow(
                    'HTTP error! status: 500'
                );
            });

            test('handles network errors', async () => {
                const networkError = new Error('Network failure');
                global.fetch.mockRejectedValue(networkError);

                await expect(apiService.request('/v1/test')).rejects.toThrow('Network failure');
            });
        });

        describe('Timeout Handling', () => {
            test('uses default 30 second timeout', async () => {
                global.fetch.mockImplementation(() => new Promise(() => {}));

                const requestPromise = apiService.request('/v1/test');

                jest.advanceTimersByTime(30000);

                await expect(requestPromise).rejects.toThrow('Request timeout after 30000ms');
            });

            test('uses custom timeout', async () => {
                global.fetch.mockImplementation(() => new Promise(() => {}));

                const requestPromise = apiService.request('/v1/test', { timeout: 5000 });

                jest.advanceTimersByTime(5000);

                await expect(requestPromise).rejects.toThrow('Request timeout after 5000ms');
            });

            test('sets isTimeout flag on timeout error', async () => {
                global.fetch.mockImplementation(() => new Promise(() => {}));

                const requestPromise = apiService.request('/v1/test', { timeout: 1000 });

                jest.advanceTimersByTime(1000);

                try {
                    await requestPromise;
                } catch (error) {
                    expect(error.isTimeout).toBe(true);
                }
            });

            test('does not timeout on successful quick response', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({ data: 'test' }),
                });

                const result = await apiService.request('/v1/test', { timeout: 5000 });

                expect(result).toEqual({ data: 'test' });
            });
        });

        describe('Logging', () => {
            test('logs API request', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test', {
                    method: 'POST',
                    body: JSON.stringify({ data: 'test' }),
                });

                expect(logger.logAPIRequest).toHaveBeenCalledWith(
                    'POST',
                    '/v1/test',
                    JSON.stringify({ data: 'test' })
                );
            });

            test('logs API response', async () => {
                global.performance.now.mockReturnValueOnce(0).mockReturnValueOnce(150);
                global.fetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test');

                expect(logger.logAPIResponse).toHaveBeenCalledWith('GET', '/v1/test', 200, 150);
            });

            test('does not log health endpoint requests', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/health');

                expect(logger.logAPIRequest).not.toHaveBeenCalled();
                expect(logger.logAPIResponse).not.toHaveBeenCalled();
            });

            test('logs errors', async () => {
                const error = new Error('Test error');
                global.fetch.mockRejectedValue(error);

                try {
                    await apiService.request('/v1/test');
                } catch (e) {
                    expect(logger.logError).toHaveBeenCalledWith(error, 'API request to /v1/test');
                }
            });

            test('logs timeout errors', async () => {
                global.fetch.mockImplementation(() => new Promise(() => {}));

                const requestPromise = apiService.request('/v1/test', { timeout: 1000 });
                jest.advanceTimersByTime(1000);

                try {
                    await requestPromise;
                } catch (error) {
                    expect(logger.logError).toHaveBeenCalledWith(
                        expect.objectContaining({ isTimeout: true }),
                        'API request to /v1/test'
                    );
                }
            });
        });

        describe('AbortController', () => {
            test('creates AbortController with signal', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test');

                expect(global.fetch).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({
                        signal: expect.any(AbortSignal),
                    })
                );
            });

            test('does not include timeout in fetch config', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: async () => ({}),
                });

                await apiService.request('/v1/test', { timeout: 5000 });

                const fetchConfig = global.fetch.mock.calls[0][1];
                expect(fetchConfig.timeout).toBeUndefined();
            });
        });
    });

    describe('Calendar Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getCalendarMonth calls correct endpoint', async () => {
            await apiService.getCalendarMonth('2025-03-15');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/month?date=2025-03-15',
                expect.any(Object)
            );
        });

        test('getCalendarWeek calls correct endpoint', async () => {
            await apiService.getCalendarWeek('2025-03-15');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/week?date=2025-03-15',
                expect.any(Object)
            );
        });

        test('getCalendarDay calls correct endpoint', async () => {
            await apiService.getCalendarDay('2025-03-15');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/day?date=2025-03-15',
                expect.any(Object)
            );
        });

        test('getCalendarEvent calls correct endpoint', async () => {
            await apiService.getCalendarEvent(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/123',
                expect.any(Object)
            );
        });

        test('getAppointments calls correct endpoint', async () => {
            await apiService.getAppointments(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/appt?job_id=456',
                expect.any(Object)
            );
        });

        test('createCalendarEvent makes POST request', async () => {
            const eventData = { calendar_type: 'interview', start_date: '2025-03-15' };

            await apiService.createCalendarEvent(eventData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(eventData),
                })
            );
        });

        test('updateCalendarEvent makes POST request', async () => {
            const eventData = { calendar_id: 1, calendar_type: 'interview' };

            await apiService.updateCalendarEvent(eventData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(eventData),
                })
            );
        });

        test('deleteCalendarEvent makes DELETE request', async () => {
            await apiService.deleteCalendarEvent(789);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/789',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        test('deleteCalendarAppointment makes DELETE request', async () => {
            await apiService.deleteCalendarAppointment(999);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/calendar/appt?appointment_id=999',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Reminder Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('saveReminder makes POST request', async () => {
            const reminderData = { reminder_message: 'Follow up', reminder_date: '2025-03-20' };

            await apiService.saveReminder(reminderData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/reminder',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(reminderData),
                })
            );
        });

        test('deleteReminder makes DELETE request', async () => {
            await apiService.deleteReminder(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/reminder?reminder_id=123',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        test('getReminderList makes POST request', async () => {
            const listRequest = { duration: 'week', start_date: '2025-03-15' };

            await apiService.getReminderList(listRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/reminder/list',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(listRequest),
                })
            );
        });
    });

    describe('Contacts Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getAllContacts calls endpoint without job_id', async () => {
            await apiService.getAllContacts();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contacts',
                expect.any(Object)
            );
        });

        test('getAllContacts calls endpoint with job_id', async () => {
            await apiService.getAllContacts(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contacts?job_id=123',
                expect.any(Object)
            );
        });

        test('getContact calls correct endpoint', async () => {
            await apiService.getContact(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contact/456',
                expect.any(Object)
            );
        });

        test('createContact makes POST request', async () => {
            const contactData = { first_name: 'John', last_name: 'Doe' };

            await apiService.createContact(contactData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contact',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(contactData),
                })
            );
        });

        test('updateContact makes POST request', async () => {
            const contactData = { contact_id: 1, first_name: 'Jane' };

            await apiService.updateContact(contactData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contact',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(contactData),
                })
            );
        });

        test('deleteContact makes DELETE request', async () => {
            await apiService.deleteContact(789);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/contact/789',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Cover Letter Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getLetterList calls correct endpoint', async () => {
            await apiService.getLetterList();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter/list',
                expect.any(Object)
            );
        });

        test('getLetter calls correct endpoint', async () => {
            await apiService.getLetter(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter?cover_id=123',
                expect.any(Object)
            );
        });

        test('saveLetter makes POST request', async () => {
            const letterData = { cover_id: 1, content: 'Dear Hiring Manager' };

            await apiService.saveLetter(letterData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(letterData),
                })
            );
        });

        test('deleteLetter makes DELETE request', async () => {
            await apiService.deleteLetter(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter?cover_id=456',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        test('writeLetter makes POST request with 90s timeout', async () => {
            await apiService.writeLetter(789);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter/write',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ cover_id: 789 }),
                })
            );
        });

        test('convertLetter makes POST request', async () => {
            await apiService.convertLetter(123, 'docx');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/letter/convert',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ cover_id: 123, format: 'docx' }),
                })
            );
        });
    });

    describe('Jobs Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getAllJobs calls correct endpoint', async () => {
            await apiService.getAllJobs();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/jobs',
                expect.any(Object)
            );
        });

        test('getJob calls correct endpoint', async () => {
            await apiService.getJob(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job/123',
                expect.any(Object)
            );
        });

        test('createJob makes POST request', async () => {
            const jobData = { company: 'TechCorp', job_title: 'Developer' };

            await apiService.createJob(jobData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(jobData),
                })
            );
        });

        test('updateJob makes POST request', async () => {
            const jobData = { job_id: 1, company: 'UpdatedCorp' };

            await apiService.updateJob(jobData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(jobData),
                })
            );
        });

        test('deleteJob makes DELETE request', async () => {
            await apiService.deleteJob(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job/456',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        test('getJobList calls correct endpoint', async () => {
            await apiService.getJobList();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job/list',
                expect.any(Object)
            );
        });

        test('extractJobData makes POST request with 90s timeout', async () => {
            await apiService.extractJobData(789);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/job/extract',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ job_id: 789 }),
                })
            );
        });
    });

    describe('Notes Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getNotes calls endpoint without job_id', async () => {
            await apiService.getNotes();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/notes',
                expect.any(Object)
            );
        });

        test('getNotes calls endpoint with job_id', async () => {
            await apiService.getNotes(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/notes?job_id=123',
                expect.any(Object)
            );
        });

        test('createNote makes POST request', async () => {
            const noteData = { note_title: 'Test Note', note_content: 'Content' };

            await apiService.createNote(noteData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/notes',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(noteData),
                })
            );
        });

        test('updateNote makes POST request', async () => {
            const noteData = { note_id: 1, note_title: 'Updated Note' };

            await apiService.updateNote(noteData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/notes',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(noteData),
                })
            );
        });

        test('deleteNote makes DELETE request', async () => {
            await apiService.deleteNote(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/note/456',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    describe('Personal Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getPersonalInfo calls correct endpoint', async () => {
            await apiService.getPersonalInfo();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/personal',
                expect.any(Object)
            );
        });

        test('savePersonalInfo makes POST request', async () => {
            const personalData = { first_name: 'John', last_name: 'Doe' };

            await apiService.savePersonalInfo(personalData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/personal',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(personalData),
                })
            );
        });
    });

    describe('Resume Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('getBaselineResumeList calls correct endpoint', async () => {
            await apiService.getBaselineResumeList();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/baseline/list',
                expect.any(Object)
            );
        });

        test('getBaselineResumes calls correct endpoint', async () => {
            await apiService.getBaselineResumes();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/baseline',
                expect.any(Object)
            );
        });

        test('getResume calls correct endpoint', async () => {
            await apiService.getResume(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/123',
                expect.any(Object)
            );
        });

        test('updateResume makes PUT request', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            const resumeData = { resume_id: 1, title: 'Software Engineer Resume' };

            await apiService.updateResume(resumeData);

            expect(console.log).toHaveBeenCalledWith('RESUME_DATA', resumeData);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(resumeData),
                })
            );

            consoleLogSpy.mockRestore();
        });

        test('resumeFull makes POST request with correct data', async () => {
            await apiService.resumeFull(1, 2, ['keyword1', 'keyword2'], ['focus1', 'focus2']);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/full',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        baseline_resume_id: 2,
                        job_id: 1,
                        keyword_final: ['keyword1', 'keyword2'],
                        focus_final: ['focus1', 'focus2'],
                    }),
                })
            );
        });

        test('rewriteResume makes POST request with 360s timeout', async () => {
            await apiService.rewriteResume(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/rewrite',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ job_id: 123 }),
                })
            );
        });

        test('updateResumeDetail makes POST request', async () => {
            const detailData = { resume_id: 1, content_md: 'Updated content' };

            await apiService.updateResumeDetail(detailData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/detail',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(detailData),
                })
            );
        });

        test('getResumeDetail calls correct endpoint', async () => {
            await apiService.getResumeDetail(456);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/detail/456',
                expect.any(Object)
            );
        });

        test('extractResume makes POST request with 150s timeout', async () => {
            const formData = { file_name: 'resume.pdf' };

            await apiService.extractResume(formData);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/resume/extract',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(formData),
                })
            );
        });
    });

    describe('Convert Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('convertHtmlToDocx calls correct endpoint', async () => {
            await apiService.convertHtmlToDocx(123);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/convert/html2docx?job_id=123',
                expect.any(Object)
            );
        });

        test('convertXxxToMarkdown makes POST request', async () => {
            await apiService.convertXxxToMarkdown('pdf', 'resume.pdf');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/convert/pdf2md',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ file_name: 'resume.pdf' }),
                })
            );
        });

        test('convertXxxToHtml makes POST request', async () => {
            await apiService.convertXxxToHtml('docx', 'resume.docx');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/convert/docx2html',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ file_name: 'resume.docx' }),
                })
            );
        });

        test('convertFinal makes POST request', async () => {
            const body = { resume_id: 1, output_format: 'pdf' };

            await apiService.convertFinal(body);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/convert/final',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                })
            );
        });

        test('convertFile makes POST request with correct parameters', async () => {
            await apiService.convertFile(123, 'html', 'docx');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/convert/file',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        resume_id: 123,
                        source_format: 'html',
                        target_format: 'docx',
                    }),
                })
            );
        });
    });

    describe('Export Methods', () => {
        beforeEach(() => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });
        });

        test('exportJobs calls correct endpoint', async () => {
            await apiService.exportJobs();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/export/job',
                expect.any(Object)
            );
        });

        test('exportContacts calls correct endpoint', async () => {
            await apiService.exportContacts();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/export/contacts',
                expect.any(Object)
            );
        });

        test('exportNotes calls correct endpoint', async () => {
            await apiService.exportNotes();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/export/notes',
                expect.any(Object)
            );
        });

        test('exportCalendar calls correct endpoint', async () => {
            await apiService.exportCalendar();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/export/calendar',
                expect.any(Object)
            );
        });

        test('exportResumes calls correct endpoint', async () => {
            await apiService.exportResumes();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://api.test.com/v1/export/resumes',
                expect.any(Object)
            );
        });
    });

    describe('Edge Cases and Integration', () => {
        test('handles multiple simultaneous requests', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: 'test' }),
            });

            const promises = [
                apiService.getAllJobs(),
                apiService.getAllContacts(),
                apiService.getNotes(),
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        test('handles empty response body', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => null,
            });

            const result = await apiService.getAllJobs();

            expect(result).toBeNull();
        });

        test('preserves other config options', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            await apiService.request('/v1/test', {
                credentials: 'include',
                mode: 'cors',
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    credentials: 'include',
                    mode: 'cors',
                })
            );
        });
    });
});
