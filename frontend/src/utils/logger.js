/**
 * Frontend logging utility for the Job Tracker Portal
 * Logs to both console (development) and file storage (localStorage-based)
 */

class PortalLogger {
    constructor() {
        this.logLevel = this.getLogLevel();
        this.logFile = process.env.REACT_APP_LOG_FILE || 'portal.log';
        this.enableConsole = process.env.REACT_APP_ENABLE_CONSOLE_LOGGING === 'true';
        this.maxLogEntries = 1000; // Limit stored logs to prevent memory issues

        // Define log levels
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARNING: 2,
            ERROR: 3,
            CRITICAL: 4
        };
    }

    getLogLevel() {
        const envLevel = process.env.REACT_APP_LOG_LEVEL || 'DEBUG';
        return envLevel.toUpperCase();
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0
            ? ` | ${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')}`
            : '';

        return `${timestamp} - ${level} - ${message}${contextStr}`;
    }

    writeToStorage(level, message, context = {}) {
        try {
            const formattedMessage = this.formatMessage(level, message, context);

            // Get existing logs
            const existingLogs = JSON.parse(localStorage.getItem(this.logFile) || '[]');

            // Add new log entry
            existingLogs.push({
                timestamp: new Date().toISOString(),
                level,
                message,
                context,
                formatted: formattedMessage
            });

            // Limit log entries
            if (existingLogs.length > this.maxLogEntries) {
                existingLogs.splice(0, existingLogs.length - this.maxLogEntries);
            }

            // Save back to localStorage
            localStorage.setItem(this.logFile, JSON.stringify(existingLogs));
        } catch (error) {
            console.error('Failed to write to log storage:', error);
        }
    }

    log(level, message, context = {}) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, context);

        // Console logging
        if (this.enableConsole) {
            switch (level) {
                case 'DEBUG':
                    console.debug(formattedMessage);
                    break;
                case 'INFO':
                    console.info(formattedMessage);
                    break;
                case 'WARNING':
                    console.warn(formattedMessage);
                    break;
                case 'ERROR':
                case 'CRITICAL':
                    console.error(formattedMessage);
                    break;
                default:
                    console.log(formattedMessage);
            }
        }

        // File storage logging
        this.writeToStorage(level, message, context);
    }

    debug(message, context = {}) {
        this.log('DEBUG', message, context);
    }

    info(message, context = {}) {
        this.log('INFO', message, context);
    }

    warning(message, context = {}) {
        this.log('WARNING', message, context);
    }

    error(message, context = {}) {
        this.log('ERROR', message, context);
    }

    critical(message, context = {}) {
        this.log('CRITICAL', message, context);
    }

    // Specialized logging methods
    logPageView(pageName, path) {
        this.info(`Page viewed: ${pageName}`, {path, type: 'navigation'});
    }

    logAPIRequest(method, url, data = null) {
        this.debug(`API Request: ${method} ${url}`, {
            method,
            url,
            hasData: !!data,
            type: 'api_request'
        });
    }

    logAPIResponse(method, url, status, duration = null) {
        const level = status >= 400 ? 'ERROR' : 'DEBUG';
        this.log(level, `API Response: ${method} ${url} - ${status}`, {
            method,
            url,
            status,
            duration_ms: duration,
            type: 'api_response'
        });
    }

    logUserAction(action, details = {}) {
        this.info(`User action: ${action}`, {...details, type: 'user_action'});
    }

    logError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            type: 'error'
        };

        this.error(`Application error: ${error.message}`, errorInfo);
    }

    logFormSubmission(formName, data = {}) {
        this.info(`Form submitted: ${formName}`, {
            formName,
            fieldCount: Object.keys(data).length,
            type: 'form_submission'
        });
    }

    // Utility methods
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.logFile) || '[]');
        } catch (error) {
            console.error('Failed to retrieve logs:', error);
            return [];
        }
    }

    clearLogs() {
        try {
            localStorage.removeItem(this.logFile);
            this.info('Logs cleared', {type: 'admin_action'});
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }

    exportLogs() {
        try {
            const logs = this.getLogs();
            const logText = logs.map(log => log.formatted).join('\n');

            const blob = new Blob([logText], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.logFile}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.info('Logs exported', {type: 'admin_action'});
        } catch (error) {
            this.error('Failed to export logs', {error: error.message});
        }
    }
}

// Create and export singleton instance
const logger = new PortalLogger();

// Initialize logging
logger.info('Portal logger initialized', {
    logLevel: logger.logLevel,
    consoleEnabled: logger.enableConsole,
    logFile: logger.logFile
});

export default logger;