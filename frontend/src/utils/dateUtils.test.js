import {
    calculateDateSpan,
    calculateLastContact,
    formatDateForInput,
    getTodayDate,
    formatTimestamp,
} from './dateUtils';

describe('dateUtils', () => {
    // Mock Date for consistent testing
    const mockNow = new Date('2025-03-15T12:00:00');

    beforeEach(() => {
        jest.spyOn(global, 'Date').mockImplementation((...args) => {
            if (args.length === 0) {
                return mockNow;
            }
            return new (jest.requireActual('Date'))(...args);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('calculateDateSpan', () => {
        test('returns "No date" for null', () => {
            expect(calculateDateSpan(null)).toBe('No date');
        });

        test('returns "No date" for undefined', () => {
            expect(calculateDateSpan(undefined)).toBe('No date');
        });

        test('returns "Added 0 days ago" for today', () => {
            expect(calculateDateSpan('2025-03-15')).toBe('Added 0 days ago');
        });

        test('returns "Added 1 day ago" for yesterday', () => {
            expect(calculateDateSpan('2025-03-14')).toBe('Added 1 day ago');
        });

        test('returns "Added X days ago" for days 2-13', () => {
            expect(calculateDateSpan('2025-03-13')).toBe('Added 2 days ago');
            expect(calculateDateSpan('2025-03-10')).toBe('Added 5 days ago');
            expect(calculateDateSpan('2025-03-02')).toBe('Added 13 days ago');
        });

        test('returns "Added 1 week ago" for 14 days', () => {
            expect(calculateDateSpan('2025-03-01')).toBe('Added 2 weeks ago');
        });

        test('returns "Added X weeks ago" for 14-55 days', () => {
            expect(calculateDateSpan('2025-02-22')).toBe('Added 3 weeks ago');
            expect(calculateDateSpan('2025-02-15')).toBe('Added 4 weeks ago');
        });

        test('returns "Added 1 month ago" for 56+ days', () => {
            expect(calculateDateSpan('2025-01-19')).toBe('Added 1 month ago');
        });

        test('returns "Added X months ago" for multiple months', () => {
            expect(calculateDateSpan('2024-12-15')).toBe('Added 3 months ago');
            expect(calculateDateSpan('2024-09-15')).toBe('Added 6 months ago');
        });
    });

    describe('calculateLastContact', () => {
        test('returns "No contact date" for null', () => {
            expect(calculateLastContact(null)).toBe('No contact date');
        });

        test('returns "No contact date" for undefined', () => {
            expect(calculateLastContact(undefined)).toBe('No contact date');
        });

        test('returns "Last contact today" for today', () => {
            expect(calculateLastContact('2025-03-15')).toBe('Last contact today');
        });

        test('returns "Last contact 1 day ago" for yesterday', () => {
            expect(calculateLastContact('2025-03-14')).toBe('Last contact 1 day ago');
        });

        test('returns "Last contact X days ago" for days 2-13', () => {
            expect(calculateLastContact('2025-03-13')).toBe('Last contact 2 days ago');
            expect(calculateLastContact('2025-03-10')).toBe('Last contact 5 days ago');
            expect(calculateLastContact('2025-03-02')).toBe('Last contact 13 days ago');
        });

        test('returns "Last contact 1 week ago" for 14 days', () => {
            expect(calculateLastContact('2025-03-01')).toBe('Last contact 2 weeks ago');
        });

        test('returns "Last contact X weeks ago" for 14-55 days', () => {
            expect(calculateLastContact('2025-02-22')).toBe('Last contact 3 weeks ago');
            expect(calculateLastContact('2025-02-15')).toBe('Last contact 4 weeks ago');
        });

        test('returns "Last contact 1 month ago" for 56+ days', () => {
            expect(calculateLastContact('2025-01-19')).toBe('Last contact 1 month ago');
        });

        test('returns "Last contact X months ago" for multiple months', () => {
            expect(calculateLastContact('2024-12-15')).toBe('Last contact 3 months ago');
            expect(calculateLastContact('2024-09-15')).toBe('Last contact 6 months ago');
        });
    });

    describe('formatDateForInput', () => {
        test('formats date to YYYY-MM-DD', () => {
            const result = formatDateForInput('2025-03-15T10:30:00');
            expect(result).toBe('2025-03-15');
        });

        test('formats date object to YYYY-MM-DD', () => {
            const date = new Date('2025-03-15T10:30:00');
            const result = formatDateForInput(date);
            expect(result).toBe('2025-03-15');
        });

        test('returns today for null', () => {
            const result = formatDateForInput(null);
            expect(result).toBe('2025-03-15');
        });

        test('returns today for undefined', () => {
            const result = formatDateForInput(undefined);
            expect(result).toBe('2025-03-15');
        });

        test('returns today for empty string', () => {
            const result = formatDateForInput('');
            expect(result).toBe('2025-03-15');
        });

        test('handles leap year dates', () => {
            const result = formatDateForInput('2024-02-29T12:00:00');
            expect(result).toBe('2024-02-29');
        });

        test('pads single digit months', () => {
            const result = formatDateForInput('2025-01-05T12:00:00');
            expect(result).toBe('2025-01-05');
        });

        test('pads single digit days', () => {
            const result = formatDateForInput('2025-03-05T12:00:00');
            expect(result).toBe('2025-03-05');
        });
    });

    describe('getTodayDate', () => {
        test('returns today in YYYY-MM-DD format', () => {
            expect(getTodayDate()).toBe('2025-03-15');
        });

        test('pads single digit months', () => {
            const mockJan = new Date('2025-01-15T12:00:00');
            jest.spyOn(global, 'Date').mockImplementation((...args) => {
                if (args.length === 0) {
                    return mockJan;
                }
                return new (jest.requireActual('Date'))(...args);
            });

            expect(getTodayDate()).toBe('2025-01-15');
        });

        test('pads single digit days', () => {
            const mockDay = new Date('2025-03-05T12:00:00');
            jest.spyOn(global, 'Date').mockImplementation((...args) => {
                if (args.length === 0) {
                    return mockDay;
                }
                return new (jest.requireActual('Date'))(...args);
            });

            expect(getTodayDate()).toBe('2025-03-05');
        });

        test('handles year change', () => {
            const mockNewYear = new Date('2026-01-01T12:00:00');
            jest.spyOn(global, 'Date').mockImplementation((...args) => {
                if (args.length === 0) {
                    return mockNewYear;
                }
                return new (jest.requireActual('Date'))(...args);
            });

            expect(getTodayDate()).toBe('2026-01-01');
        });
    });

    describe('formatTimestamp', () => {
        test('returns "Not specified" for null', () => {
            expect(formatTimestamp(null)).toBe('Not specified');
        });

        test('returns "Not specified" for undefined', () => {
            expect(formatTimestamp(undefined)).toBe('Not specified');
        });

        test('returns "Not specified" for empty string', () => {
            expect(formatTimestamp('')).toBe('Not specified');
        });

        test('formats timestamp with date and time', () => {
            const timestamp = '2025-03-15T14:30:45';
            expect(formatTimestamp(timestamp)).toBe('2025-03-15 14:30:45');
        });

        test('formats timestamp at midnight', () => {
            const timestamp = '2025-03-15T00:00:00';
            expect(formatTimestamp(timestamp)).toBe('2025-03-15 00:00:00');
        });

        test('pads single digit months', () => {
            const timestamp = '2025-01-15T10:30:45';
            expect(formatTimestamp(timestamp)).toBe('2025-01-15 10:30:45');
        });

        test('pads single digit days', () => {
            const timestamp = '2025-03-05T10:30:45';
            expect(formatTimestamp(timestamp)).toBe('2025-03-05 10:30:45');
        });

        test('pads single digit hours', () => {
            const timestamp = '2025-03-15T09:30:45';
            expect(formatTimestamp(timestamp)).toBe('2025-03-15 09:30:45');
        });

        test('pads single digit minutes', () => {
            const timestamp = '2025-03-15T10:05:45';
            expect(formatTimestamp(timestamp)).toBe('2025-03-15 10:05:45');
        });

        test('pads single digit seconds', () => {
            const timestamp = '2025-03-15T10:30:05';
            expect(formatTimestamp(timestamp)).toBe('2025-03-15 10:30:05');
        });

        test('formats timestamp at end of day', () => {
            const timestamp = '2025-12-31T23:59:59';
            expect(formatTimestamp(timestamp)).toBe('2025-12-31 23:59:59');
        });

        test('handles Date objects', () => {
            const date = new Date('2025-03-15T14:30:45');
            const result = formatTimestamp(date);
            expect(result).toMatch(/2025-03-15 \d{2}:\d{2}:\d{2}/);
        });
    });

    describe('Edge Cases', () => {
        test('calculateDateSpan handles very old dates', () => {
            expect(calculateDateSpan('2020-01-01')).toMatch(/Added \d+ months ago/);
        });

        test('calculateLastContact handles very old dates', () => {
            expect(calculateLastContact('2020-01-01')).toMatch(/Last contact \d+ months ago/);
        });

        test('formatDateForInput handles different date formats', () => {
            expect(formatDateForInput('2025-03-15')).toBe('2025-03-15');
            expect(formatDateForInput('2025-03-15T00:00:00Z')).toBe('2025-03-15');
        });

        test('formatTimestamp handles different timestamp formats', () => {
            const timestamp1 = '2025-03-15T14:30:45Z';
            const result1 = formatTimestamp(timestamp1);
            expect(result1).toMatch(/2025-03-15 \d{2}:\d{2}:\d{2}/);

            const timestamp2 = new Date('2025-03-15T14:30:45');
            const result2 = formatTimestamp(timestamp2);
            expect(result2).toMatch(/2025-03-15 \d{2}:\d{2}:\d{2}/);
        });
    });

    describe('Date Boundary Cases', () => {
        test('calculateDateSpan at 13-14 day boundary', () => {
            expect(calculateDateSpan('2025-03-02')).toBe('Added 13 days ago');
            expect(calculateDateSpan('2025-03-01')).toBe('Added 2 weeks ago');
        });

        test('calculateDateSpan at 7-8 week boundary', () => {
            const sevenWeeksAgo = new Date('2025-03-15');
            sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);
            expect(calculateDateSpan(sevenWeeksAgo.toISOString())).toBe('Added 7 weeks ago');

            const eightWeeksAgo = new Date('2025-03-15');
            eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
            expect(calculateDateSpan(eightWeeksAgo.toISOString())).toBe('Added 1 month ago');
        });

        test('calculateLastContact at 13-14 day boundary', () => {
            expect(calculateLastContact('2025-03-02')).toBe('Last contact 13 days ago');
            expect(calculateLastContact('2025-03-01')).toBe('Last contact 2 weeks ago');
        });

        test('calculateLastContact at 7-8 week boundary', () => {
            const sevenWeeksAgo = new Date('2025-03-15');
            sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);
            expect(calculateLastContact(sevenWeeksAgo.toISOString())).toBe('Last contact 7 weeks ago');

            const eightWeeksAgo = new Date('2025-03-15');
            eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
            expect(calculateLastContact(eightWeeksAgo.toISOString())).toBe('Last contact 1 month ago');
        });
    });
});
