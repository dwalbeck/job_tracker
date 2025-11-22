import logger from '../utils/logger';
import {API_BASE_URL} from '../config';

class ApiService {
    get baseURL() {
        return API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const method = options.method || 'GET';
        const startTime = performance.now();

        // Extract custom timeout (default: 30 seconds, or use options.timeout)
        const timeout = options.timeout || 30000;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                ...options.headers,
            },
            signal: controller.signal,
            ...options,
        };

        // Remove timeout from options so it doesn't get passed to fetch
        delete config.timeout;

        // Log the request
        if (endpoint !== '/health') {
            logger.logAPIRequest(method, endpoint, options.body);
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId); // Clear timeout on successful response
            const duration = performance.now() - startTime;

            // Log the response
            if (endpoint !== '/health') {
                logger.logAPIResponse(method, endpoint, response.status, duration);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.detail = errorData.detail;
                throw error;
            }
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId); // Clear timeout on error
            const duration = performance.now() - startTime;

            // Handle timeout errors more clearly
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${timeout}ms`);
                timeoutError.isTimeout = true;
                logger.logAPIResponse(method, endpoint, 0, duration);
                logger.logError(timeoutError, `API request to ${endpoint}`);
                throw timeoutError;
            }

            logger.logAPIResponse(method, endpoint, 0, duration);
            logger.logError(error, `API request to ${endpoint}`);
            throw error;
        }
    }



    // ***** calendar ***************************************************************************
    async getCalendarMonth(date) {
        return this.request(`/v1/calendar/month?date=${date}`);
    }

    async getCalendarWeek(date) {
        return this.request(`/v1/calendar/week?date=${date}`);
    }

    async getCalendarDay(date) {
        return this.request(`/v1/calendar/day?date=${date}`);
    }

    async getCalendarEvent(calendarId) {
        return this.request(`/v1/calendar/${calendarId}`);
    }

    async getAppointments(id) {
        return this.request(`/v1/calendar/appt?job_id=${id}`)
    }

    async createCalendarEvent(eventData) {
        return this.request('/v1/calendar', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async updateCalendarEvent(eventData) {
        return this.request('/v1/calendar', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async deleteCalendarEvent(calendarId) {
        return this.request(`/v1/calendar/${calendarId}`, {
            method: 'DELETE',
        });
    }

    async deleteCalendarAppointment(appointmentId) {
        return this.request(`/v1/calendar/appt?appointment_id=${appointmentId}`, {
            method: 'DELETE',
        });
    }

    // ----- reminder ----------------------------
    async saveReminder(reminderData) {
        return this.request('/v1/reminder', {
            method: 'POST',
            body: JSON.stringify(reminderData),
        });
    }

    async deleteReminder(reminderId) {
        return this.request(`/v1/reminder?reminder_id=${reminderId}`, {
            method: 'DELETE',
        });
    }

    async getReminderList(listRequest) {
        return this.request('/v1/reminder/list', {
            method: 'POST',
            body: JSON.stringify(listRequest),
        });
    }

    // ***** contacts ***************************************************************************
    async getAllContacts(jobId = null) {
        const queryParam = jobId ? `?job_id=${jobId}` : '';
        return this.request(`/v1/contacts${queryParam}`);
    }

    async getContact(contactId) {
        return this.request(`/v1/contact/${contactId}`);
    }

    async createContact(contactData) {
        return this.request('/v1/contact', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async updateContact(contactData) {
        return this.request('/v1/contact', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async deleteContact(contactId) {
        return this.request(`/v1/contact/${contactId}`, {
            method: 'DELETE',
        });
    }

    // ***** cover letter ***********************************************************************
    async getLetterList() {
        return this.request('/v1/letter/list');
    }

    async getLetter(coverId) {
        return this.request(`/v1/letter?cover_id=${coverId}`);
    }

    async saveLetter(letterData) {
        return this.request('/v1/letter', {
            method: 'POST',
            body: JSON.stringify(letterData),
        });
    }

    async deleteLetter(coverId) {
        return this.request(`/v1/letter?cover_id=${coverId}`, {
            method: 'DELETE',
        });
    }

    async writeLetter(coverId) {
        return this.request('/v1/letter/write', {
            method: 'POST',
            body: JSON.stringify({cover_id: coverId}),
            timeout: 90000, // 90 second timeout for AI letter writing
        });
    }

    async convertLetter(coverId, format) {
        return this.request('/v1/letter/convert', {
            method: 'POST',
            body: JSON.stringify({cover_id: coverId, format: format}),
        });
    }


    // ***** jobs ***************************************************************************
    async getAllJobs() {
        return this.request('/v1/jobs');
    }

    async getJob(jobId) {
        return this.request(`/v1/job/${jobId}`);
    }

    async createJob(jobData) {
        return this.request('/v1/job', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    }

    async updateJob(jobData) {
        return this.request('/v1/job', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    }

    async deleteJob(jobId) {
        return this.request(`/v1/job/${jobId}`, {
            method: 'DELETE',
        });
    }

    async getJobList() {
        return this.request('/v1/job/list');
    }

    async extractJobData(jobId) {
        return this.request('/v1/job/extract', {
            method: 'POST',
            body: JSON.stringify({job_id: jobId}),
            timeout: 90000, // 90 second timeout for AI job extraction
        });
    }

    // ***** notes ***************************************************************************
    async getNotes(jobId = null) {
        const queryParam = jobId ? `?job_id=${jobId}` : '';
        return this.request(`/v1/notes${queryParam}`);
    }

    async createNote(noteData) {
        return this.request('/v1/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async updateNote(noteData) {
        return this.request('/v1/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async deleteNote(noteId) {
        return this.request(`/v1/note/${noteId}`, {
            method: 'DELETE',
        });
    }

    // ***** personal ***************************************************************************
    async getPersonalInfo() {
        return this.request('/v1/personal');
    }

    async savePersonalInfo(personalData) {
        return this.request('/v1/personal', {
            method: 'POST',
            body: JSON.stringify(personalData),
        });
    }

    // ***** resume ***************************************************************************
    async getBaselineResumeList() {
        return this.request('/v1/resume/baseline/list');
    }

    async getBaselineResumes() {
        return this.request('/v1/resume/baseline');
    }

    async getResume(resumeId) {
        return this.request(`/v1/resume/${resumeId}`);
    }

    async updateResume(resumeData) {
        console.log('RESUME_DATA', resumeData);
        return this.request('/v1/resume', {
            method: 'POST',
            body: JSON.stringify(resumeData),
        });
    }

    async rewriteResume(jobId, resumeId, keywordFinal, focusFinal) {
        return this.request('/v1/resume/rewrite', {
            method: 'POST',
            body: JSON.stringify({
                job_id: jobId,
                resume_id: resumeId,
                keyword_final: keywordFinal,
                focus_final: focusFinal,
            }),
            timeout: 150000, // 150 second (2.5 minute) timeout for resume rewrite
        });
    }

    async updateResumeDetail(detailData) {
        return this.request('/v1/resume/detail', {
            method: 'POST',
            body: JSON.stringify(detailData),
        });
    }

    async getResumeDetail(resumeId) {
        return this.request(`/v1/resume/detail/${resumeId}`);
    }

    async extractResume(formData) {
        return this.request('/v1/resume/extract', {
            method: 'POST',
            body: JSON.stringify(formData),
            timeout: 150000, // 150 second (2.5 min) timeout for AI resume extraction
        });
    }

    // ***** convert **************************************************************************

    async convertHtmlToDocx(jobId) {
        return this.request(`/v1/convert/html2docx?job_id=${jobId}`);
    }

    async convertXxxToMarkdown(format, fileName) {
        return this.request(`/v1/convert/${format}2md`, {
            method: 'POST',
            body: JSON.stringify({ file_name: fileName }),
        });
    }

    async convertXxxToHtml(format, fileName) {
        return this.request(`/v1/convert/${format}2html`, {
            method: 'POST',
            body: JSON.stringify({file_name: fileName})
        });
    }

    async convertFinal(body) {
        return this.request(`/v1/convert/final`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // ***** export ***************************************************************************
    async exportJobs() {
        return this.request('/v1/export/job');
    }

    async exportContacts() {
        return this.request('/v1/export/contacts');
    }

    async exportNotes() {
        return this.request('/v1/export/notes');
    }

    async exportCalendar() {
        return this.request('/v1/export/calendar');
    }

    async exportResumes() {
        return this.request('/v1/export/resumes');
    }
}

const apiService = new ApiService();
export default apiService;