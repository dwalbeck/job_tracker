import logger from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

class ApiService {
  get baseURL() {
    return API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Log the request
    logger.logAPIRequest(method, endpoint, options.body);

    try {
      const response = await fetch(url, config);
      const duration = performance.now() - startTime;

      // Log the response
      logger.logAPIResponse(method, endpoint, response.status, duration);

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
      const duration = performance.now() - startTime;
      logger.logAPIResponse(method, endpoint, 0, duration);
      logger.logError(error, `API request to ${endpoint}`);
      throw error;
    }
  }

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

  async getAllContacts() {
    return this.request('/v1/contacts');
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

  async getJobList() {
    return this.request('/v1/job/list');
  }

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

  async getBaselineResumeList() {
    return this.request('/v1/resume/baseline/list');
  }

  async getBaselineResumes() {
    return this.request('/v1/resume/baseline');
  }

  async extractJobData(jobId) {
    return this.request('/v1/job/extract', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId }),
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

  async convertHtmlToDocx(jobId) {
    return this.request(`/v1/convert/html2docx?job_id=${jobId}`);
  }

  async getPersonalInfo() {
    return this.request('/v1/personal');
  }

  async savePersonalInfo(personalData) {
    return this.request('/v1/personal', {
      method: 'POST',
      body: JSON.stringify(personalData),
    });
  }

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
      body: JSON.stringify({ cover_id: coverId }),
    });
  }

  async convertLetter(coverId, format) {
    return this.request('/v1/letter/convert', {
      method: 'POST',
      body: JSON.stringify({ cover_id: coverId, format: format }),
    });
  }

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
}

export default new ApiService();