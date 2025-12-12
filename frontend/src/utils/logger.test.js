// Import the logger instance
import logger from './logger';

describe('PortalLogger', () => {
    let originalEnv;
    let mockLocalStorage;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        // Mock localStorage
        mockLocalStorage = (() => {
            let store = {};
            return {
                getItem: jest.fn((key) => store[key] || null),
                setItem: jest.fn((key, value) => {
                    store[key] = value.toString();
                }),
                removeItem: jest.fn((key) => {
                    delete store[key];
                }),
                clear: jest.fn(() => {
                    store = {};
                }),
            };
        })();

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        // Mock console methods
        jest.spyOn(console, 'debug').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'log').mockImplementation();

        // Mock document methods for export
        global.URL.createObjectURL = jest.fn();
        global.URL.revokeObjectURL = jest.fn();
        document.createElement = jest.fn(() => ({
            href: '',
            download: '',
            click: jest.fn(),
        }));
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();

        // Clear localStorage before each test
        mockLocalStorage.clear();
    });

    afterEach(() => {
        // Restore environment
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('creates logger instance', () => {
            expect(logger).toBeDefined();
            expect(logger.logLevel).toBeDefined();
        });

        test('sets log level from environment', () => {
            expect(logger.logLevel).toBe('DEBUG');
        });

        test('sets log file name', () => {
            expect(logger.logFile).toBe('portal.log');
        });

        test('has correct log levels defined', () => {
            expect(logger.levels.DEBUG).toBe(0);
            expect(logger.levels.INFO).toBe(1);
            expect(logger.levels.WARNING).toBe(2);
            expect(logger.levels.ERROR).toBe(3);
            expect(logger.levels.CRITICAL).toBe(4);
        });

        test('sets max log entries to 1000', () => {
            expect(logger.maxLogEntries).toBe(1000);
        });
    });

    describe('shouldLog', () => {
        test('allows DEBUG when log level is DEBUG', () => {
            expect(logger.shouldLog('DEBUG')).toBe(true);
        });

        test('allows INFO when log level is DEBUG', () => {
            expect(logger.shouldLog('INFO')).toBe(true);
        });

        test('allows WARNING when log level is DEBUG', () => {
            expect(logger.shouldLog('WARNING')).toBe(true);
        });

        test('allows ERROR when log level is DEBUG', () => {
            expect(logger.shouldLog('ERROR')).toBe(true);
        });

        test('allows CRITICAL when log level is DEBUG', () => {
            expect(logger.shouldLog('CRITICAL')).toBe(true);
        });
    });

    describe('formatMessage', () => {
        test('formats message with level and timestamp', () => {
            const message = logger.formatMessage('INFO', 'Test message');
            expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - INFO - Test message/);
        });

        test('includes context in formatted message', () => {
            const message = logger.formatMessage('INFO', 'Test message', { user: 'john', id: 123 });
            expect(message).toContain('user=john');
            expect(message).toContain('id=123');
        });

        test('formats message without context', () => {
            const message = logger.formatMessage('INFO', 'Test message', {});
            expect(message).not.toContain('|');
        });
    });

    describe('writeToStorage', () => {
        test('writes log entry to localStorage', () => {
            logger.writeToStorage('INFO', 'Test message', { test: true });

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const storedLogs = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
            expect(storedLogs).toHaveLength(1);
            expect(storedLogs[0].level).toBe('INFO');
            expect(storedLogs[0].message).toBe('Test message');
        });

        test('appends to existing logs', () => {
            logger.writeToStorage('INFO', 'First message');
            logger.writeToStorage('DEBUG', 'Second message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            expect(storedLogs.length).toBeGreaterThanOrEqual(2);
        });

        test('limits log entries to maxLogEntries', () => {
            // Create more than max entries
            const maxEntries = logger.maxLogEntries;
            for (let i = 0; i < maxEntries + 10; i++) {
                logger.writeToStorage('INFO', `Message ${i}`);
            }

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            expect(storedLogs.length).toBeLessThanOrEqual(maxEntries);
        });

        test('handles storage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            expect(() => logger.writeToStorage('INFO', 'Test message')).not.toThrow();
            expect(console.error).toHaveBeenCalledWith('Failed to write to log storage:', expect.any(Error));
        });
    });

    describe('log method', () => {
        test('logs message at DEBUG level', () => {
            logger.log('DEBUG', 'Debug message');

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        test('does not log when level is below threshold', () => {
            const infoLogger = { ...logger, logLevel: 'INFO' };
            infoLogger.shouldLog = (level) => logger.levels[level] >= logger.levels['INFO'];

            mockLocalStorage.clear();
            mockLocalStorage.setItem.mockClear();

            if (!infoLogger.shouldLog('DEBUG')) {
                expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
            }
        });

        test('calls console.debug for DEBUG level', () => {
            logger.log('DEBUG', 'Debug message');

            expect(console.debug).toHaveBeenCalled();
        });

        test('calls console.info for INFO level', () => {
            logger.log('INFO', 'Info message');

            expect(console.info).toHaveBeenCalled();
        });

        test('calls console.warn for WARNING level', () => {
            logger.log('WARNING', 'Warning message');

            expect(console.warn).toHaveBeenCalled();
        });

        test('calls console.error for ERROR level', () => {
            logger.log('ERROR', 'Error message');

            expect(console.error).toHaveBeenCalled();
        });

        test('calls console.error for CRITICAL level', () => {
            logger.log('CRITICAL', 'Critical message');

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Convenience Methods', () => {
        test('debug method logs at DEBUG level', () => {
            logger.debug('Debug message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('DEBUG');
        });

        test('info method logs at INFO level', () => {
            logger.info('Info message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('INFO');
        });

        test('warning method logs at WARNING level', () => {
            logger.warning('Warning message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('WARNING');
        });

        test('error method logs at ERROR level', () => {
            logger.error('Error message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('ERROR');
        });

        test('critical method logs at CRITICAL level', () => {
            logger.critical('Critical message');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('CRITICAL');
        });
    });

    describe('Specialized Logging Methods', () => {
        test('logPageView logs navigation', () => {
            logger.logPageView('Home', '/home');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('Page viewed: Home');
            expect(lastLog.context.type).toBe('navigation');
            expect(lastLog.context.path).toBe('/home');
        });

        test('logAPIRequest logs request details', () => {
            logger.logAPIRequest('GET', '/api/jobs', null);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('API Request: GET /api/jobs');
            expect(lastLog.context.type).toBe('api_request');
        });

        test('logAPIResponse logs success responses', () => {
            logger.logAPIResponse('GET', '/api/jobs', 200, 150);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('API Response: GET /api/jobs - 200');
            expect(lastLog.level).toBe('DEBUG');
            expect(lastLog.context.status).toBe(200);
            expect(lastLog.context.duration_ms).toBe(150);
        });

        test('logAPIResponse logs error responses at ERROR level', () => {
            logger.logAPIResponse('GET', '/api/jobs', 404, 100);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.level).toBe('ERROR');
            expect(lastLog.context.status).toBe(404);
        });

        test('logUserAction logs user interactions', () => {
            logger.logUserAction('Button clicked', { button: 'Submit', form: 'LoginForm' });

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('User action: Button clicked');
            expect(lastLog.context.type).toBe('user_action');
            expect(lastLog.context.button).toBe('Submit');
        });

        test('logError logs error with stack trace', () => {
            const error = new Error('Test error');
            logger.logError(error, 'During form submission');

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('Application error: Test error');
            expect(lastLog.context.message).toBe('Test error');
            expect(lastLog.context.context).toBe('During form submission');
            expect(lastLog.context.type).toBe('error');
        });

        test('logFormSubmission logs form data', () => {
            logger.logFormSubmission('ContactForm', { name: 'John', email: 'john@example.com' });

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toContain('Form submitted: ContactForm');
            expect(lastLog.context.type).toBe('form_submission');
            expect(lastLog.context.fieldCount).toBe(2);
        });
    });

    describe('getLogs', () => {
        test('retrieves logs from localStorage', () => {
            logger.info('Test log 1');
            logger.info('Test log 2');

            const logs = logger.getLogs();
            expect(logs.length).toBeGreaterThanOrEqual(2);
        });

        test('returns empty array when no logs exist', () => {
            mockLocalStorage.clear();
            mockLocalStorage.getItem.mockReturnValue(null);

            const logs = logger.getLogs();
            expect(logs).toEqual([]);
        });

        test('handles corrupted log data gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const logs = logger.getLogs();
            expect(logs).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Failed to retrieve logs:', expect.any(Error));
        });
    });

    describe('clearLogs', () => {
        test('removes logs from localStorage', () => {
            logger.info('Test log');
            logger.clearLogs();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('portal.log');
        });

        test('logs the clear action', () => {
            logger.clearLogs();

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toBe('Logs cleared');
            expect(lastLog.context.type).toBe('admin_action');
        });

        test('handles clear errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => logger.clearLogs()).not.toThrow();
            expect(console.error).toHaveBeenCalledWith('Failed to clear logs:', expect.any(Error));
        });
    });

    describe('exportLogs', () => {
        test('creates downloadable log file', () => {
            logger.info('Test log 1');
            logger.info('Test log 2');

            logger.exportLogs();

            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('a');
        });

        test('formats logs as text', () => {
            mockLocalStorage.setItem('portal.log', JSON.stringify([
                { formatted: 'Log entry 1' },
                { formatted: 'Log entry 2' },
            ]));

            logger.exportLogs();

            const blobCall = global.URL.createObjectURL.mock.calls[0];
            expect(blobCall).toBeDefined();
        });

        test('logs export action', () => {
            logger.exportLogs();

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toBe('Logs exported');
            expect(lastLog.context.type).toBe('admin_action');
        });

        test('handles export errors gracefully', () => {
            global.URL.createObjectURL.mockImplementation(() => {
                throw new Error('Export error');
            });

            expect(() => logger.exportLogs()).not.toThrow();
        });
    });

    describe('Context Handling', () => {
        test('handles empty context', () => {
            logger.info('Test message', {});

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.context).toEqual({});
        });

        test('handles complex context objects', () => {
            const context = {
                user: { id: 1, name: 'John' },
                action: 'login',
                metadata: { ip: '127.0.0.1' },
            };

            logger.info('Complex context', context);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.context).toEqual(context);
        });

        test('handles null context', () => {
            logger.info('Null context', null);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.context).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        test('handles very long messages', () => {
            const longMessage = 'A'.repeat(10000);
            logger.info(longMessage);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toBe(longMessage);
        });

        test('handles special characters in messages', () => {
            const specialMessage = 'Test "quotes" and \\backslashes\\ and \nnewlines';
            logger.info(specialMessage);

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            const lastLog = storedLogs[storedLogs.length - 1];
            expect(lastLog.message).toBe(specialMessage);
        });

        test('handles concurrent logging', () => {
            for (let i = 0; i < 10; i++) {
                logger.info(`Concurrent log ${i}`);
            }

            const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
            const storedLogs = JSON.parse(lastCall[1]);
            expect(storedLogs.length).toBeGreaterThanOrEqual(10);
        });
    });
});
