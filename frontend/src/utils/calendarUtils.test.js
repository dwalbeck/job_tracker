import {
    formatDateForAPI,
    formatTimeForAPI,
    formatMonthForAPI,
    getWeekStart,
    getMonthCalendarDays,
    isToday,
    getHours,
    calculateDuration,
    formatTimeDisplay,
    getTimeSlots,
    isBusinessHour,
} from './calendarUtils';

describe('calendarUtils', () => {
    describe('formatDateForAPI', () => {
        test('formats date to YYYY-MM-DD format', () => {
            const date = new Date('2025-03-15T10:30:00');
            expect(formatDateForAPI(date)).toBe('2025-03-15');
        });

        test('formats date at midnight', () => {
            const date = new Date('2025-01-01T00:00:00');
            expect(formatDateForAPI(date)).toBe('2025-01-01');
        });

        test('formats date at end of day', () => {
            const date = new Date('2025-12-31T23:59:59');
            expect(formatDateForAPI(date)).toBe('2025-12-31');
        });

        test('handles leap year date', () => {
            const date = new Date('2024-02-29T12:00:00');
            expect(formatDateForAPI(date)).toBe('2024-02-29');
        });
    });

    describe('formatTimeForAPI', () => {
        test('formats time to HH:MM format', () => {
            const time = new Date('2025-03-15T14:30:00');
            expect(formatTimeForAPI(time)).toBe('14:30');
        });

        test('formats midnight correctly', () => {
            const time = new Date('2025-03-15T00:00:00');
            expect(formatTimeForAPI(time)).toBe('00:00');
        });

        test('formats afternoon time correctly', () => {
            const time = new Date('2025-03-15T17:45:00');
            expect(formatTimeForAPI(time)).toBe('17:45');
        });

        test('pads single digit hours', () => {
            const time = new Date('2025-03-15T09:05:00');
            expect(formatTimeForAPI(time)).toBe('09:05');
        });
    });

    describe('formatMonthForAPI', () => {
        test('formats month to YYYY-MM format', () => {
            const date = new Date('2025-03-15');
            expect(formatMonthForAPI(date)).toBe('2025-03');
        });

        test('pads single digit months', () => {
            const date = new Date('2025-01-15');
            expect(formatMonthForAPI(date)).toBe('2025-01');
        });

        test('formats December correctly', () => {
            const date = new Date('2025-12-15');
            expect(formatMonthForAPI(date)).toBe('2025-12');
        });

        test('handles year change', () => {
            const date = new Date('2024-11-15');
            expect(formatMonthForAPI(date)).toBe('2024-11');
        });
    });

    describe('getWeekStart', () => {
        test('returns Monday when given a Monday', () => {
            const monday = new Date('2025-03-10'); // Monday
            const result = getWeekStart(monday);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getDate()).toBe(10);
        });

        test('returns Monday when given a Tuesday', () => {
            const tuesday = new Date('2025-03-11'); // Tuesday
            const result = getWeekStart(tuesday);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getDate()).toBe(10);
        });

        test('returns Monday when given a Sunday', () => {
            const sunday = new Date('2025-03-16'); // Sunday
            const result = getWeekStart(sunday);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getDate()).toBe(10);
        });

        test('returns Monday when given a Saturday', () => {
            const saturday = new Date('2025-03-15'); // Saturday
            const result = getWeekStart(saturday);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getDate()).toBe(10);
        });

        test('handles month boundary', () => {
            const date = new Date('2025-04-01'); // Tuesday, April 1
            const result = getWeekStart(date);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getMonth()).toBe(2); // March (0-indexed)
            expect(result.getDate()).toBe(31);
        });

        test('handles year boundary', () => {
            const date = new Date('2025-01-02'); // Thursday, Jan 2
            const result = getWeekStart(date);
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(11); // December
            expect(result.getDate()).toBe(30);
        });
    });

    describe('getMonthCalendarDays', () => {
        test('returns 42 days for calendar grid', () => {
            const date = new Date('2025-03-15');
            const days = getMonthCalendarDays(date);
            expect(days).toHaveLength(42);
        });

        test('includes days from previous month', () => {
            const date = new Date('2025-03-01'); // March 1, 2025 is a Saturday
            const days = getMonthCalendarDays(date);
            const previousMonthDays = days.filter(day => !day.isCurrentMonth && day.date < date);
            expect(previousMonthDays.length).toBeGreaterThan(0);
        });

        test('includes days from next month', () => {
            const date = new Date('2025-03-01');
            const days = getMonthCalendarDays(date);
            const lastDayOfMonth = new Date(2025, 2, 31);
            const nextMonthDays = days.filter(day => !day.isCurrentMonth && day.date > lastDayOfMonth);
            expect(nextMonthDays.length).toBeGreaterThan(0);
        });

        test('marks current month days correctly', () => {
            const date = new Date('2025-03-15');
            const days = getMonthCalendarDays(date);
            const currentMonthDays = days.filter(day => day.isCurrentMonth);
            expect(currentMonthDays.length).toBe(31); // March has 31 days
        });

        test('marks today correctly', () => {
            const today = new Date();
            const days = getMonthCalendarDays(today);
            const todayDay = days.find(day => day.isToday);
            expect(todayDay).toBeDefined();
            expect(todayDay.date.getDate()).toBe(today.getDate());
        });

        test('starts calendar on Sunday', () => {
            const date = new Date('2025-03-15');
            const days = getMonthCalendarDays(date);
            expect(days[0].date.getDay()).toBe(0); // Sunday
        });
    });

    describe('isToday', () => {
        test('returns true for today', () => {
            const today = new Date();
            expect(isToday(today)).toBe(true);
        });

        test('returns false for yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(isToday(yesterday)).toBe(false);
        });

        test('returns false for tomorrow', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(isToday(tomorrow)).toBe(false);
        });

        test('returns true for today at different time', () => {
            const today = new Date();
            today.setHours(23, 59, 59);
            expect(isToday(today)).toBe(true);
        });
    });

    describe('getHours', () => {
        test('returns 24 hours', () => {
            const hours = getHours();
            expect(hours).toHaveLength(24);
        });

        test('includes midnight as 12 AM', () => {
            const hours = getHours();
            expect(hours[0].display).toBe('12:00 AM');
            expect(hours[0].value).toBe(0);
        });

        test('includes noon as 12 PM', () => {
            const hours = getHours();
            expect(hours[12].display).toBe('12:00 PM');
            expect(hours[12].value).toBe(12);
        });

        test('formats morning hours correctly', () => {
            const hours = getHours();
            expect(hours[9].display).toBe('9:00 AM');
            expect(hours[9].value).toBe(9);
        });

        test('formats afternoon hours correctly', () => {
            const hours = getHours();
            expect(hours[15].display).toBe('3:00 PM');
            expect(hours[15].value).toBe(15);
        });

        test('includes 24-hour format', () => {
            const hours = getHours();
            expect(hours[0].is24).toBe('00:00');
            expect(hours[9].is24).toBe('09:00');
            expect(hours[15].is24).toBe('15:00');
        });
    });

    describe('calculateDuration', () => {
        test('calculates duration of 1 hour', () => {
            const duration = calculateDuration('2025-03-15', '10:00', '2025-03-15', '11:00');
            expect(duration).toBe(1);
        });

        test('calculates duration of 30 minutes', () => {
            const duration = calculateDuration('2025-03-15', '10:00', '2025-03-15', '10:30');
            expect(duration).toBe(0.5);
        });

        test('calculates duration across multiple hours', () => {
            const duration = calculateDuration('2025-03-15', '10:00', '2025-03-15', '14:30');
            expect(duration).toBe(4.5);
        });

        test('calculates duration across days', () => {
            const duration = calculateDuration('2025-03-15', '22:00', '2025-03-16', '02:00');
            expect(duration).toBe(4);
        });

        test('rounds to 2 decimal places', () => {
            const duration = calculateDuration('2025-03-15', '10:00', '2025-03-15', '10:20');
            expect(duration).toBe(0.33);
        });

        test('handles zero duration', () => {
            const duration = calculateDuration('2025-03-15', '10:00', '2025-03-15', '10:00');
            expect(duration).toBe(0);
        });
    });

    describe('formatTimeDisplay', () => {
        test('formats morning time without minutes', () => {
            expect(formatTimeDisplay('09:00')).toBe('9am');
        });

        test('formats afternoon time without minutes', () => {
            expect(formatTimeDisplay('14:00')).toBe('2pm');
        });

        test('formats time with minutes', () => {
            expect(formatTimeDisplay('09:30')).toBe('9:30am');
        });

        test('formats midnight correctly', () => {
            expect(formatTimeDisplay('00:00')).toBe('12am');
        });

        test('formats noon correctly', () => {
            expect(formatTimeDisplay('12:00')).toBe('12pm');
        });

        test('formats time with minutes in PM', () => {
            expect(formatTimeDisplay('15:45')).toBe('3:45pm');
        });

        test('returns empty string for null', () => {
            expect(formatTimeDisplay(null)).toBe('');
        });

        test('returns empty string for undefined', () => {
            expect(formatTimeDisplay(undefined)).toBe('');
        });

        test('returns empty string for empty string', () => {
            expect(formatTimeDisplay('')).toBe('');
        });
    });

    describe('getTimeSlots', () => {
        test('returns 96 time slots (24 hours * 4 quarters)', () => {
            const slots = getTimeSlots();
            expect(slots).toHaveLength(96);
        });

        test('includes 15-minute intervals', () => {
            const slots = getTimeSlots();
            expect(slots[0].value).toBe('00:00');
            expect(slots[1].value).toBe('00:15');
            expect(slots[2].value).toBe('00:30');
            expect(slots[3].value).toBe('00:45');
        });

        test('formats midnight slots correctly', () => {
            const slots = getTimeSlots();
            expect(slots[0].display).toBe('12:00 AM');
        });

        test('formats noon slots correctly', () => {
            const slots = getTimeSlots();
            const noonSlot = slots.find(slot => slot.value === '12:00');
            expect(noonSlot.display).toBe('12:00 PM');
        });

        test('formats afternoon slots correctly', () => {
            const slots = getTimeSlots();
            const afternoonSlot = slots.find(slot => slot.value === '15:30');
            expect(afternoonSlot.display).toBe('3:30 PM');
        });

        test('pads minutes correctly', () => {
            const slots = getTimeSlots();
            expect(slots[0].display).toBe('12:00 AM');
            expect(slots[1].display).toBe('12:15 AM');
        });
    });

    describe('isBusinessHour', () => {
        test('returns true for 8 AM', () => {
            expect(isBusinessHour(8)).toBe(true);
        });

        test('returns true for noon', () => {
            expect(isBusinessHour(12)).toBe(true);
        });

        test('returns true for 5 PM (17:00)', () => {
            expect(isBusinessHour(17)).toBe(true);
        });

        test('returns false for 6 PM (18:00)', () => {
            expect(isBusinessHour(18)).toBe(false);
        });

        test('returns false for 7 AM', () => {
            expect(isBusinessHour(7)).toBe(false);
        });

        test('returns false for midnight', () => {
            expect(isBusinessHour(0)).toBe(false);
        });

        test('returns false for late evening', () => {
            expect(isBusinessHour(22)).toBe(false);
        });

        test('returns true for all hours 8-17', () => {
            for (let hour = 8; hour < 18; hour++) {
                expect(isBusinessHour(hour)).toBe(true);
            }
        });

        test('returns false for hours before 8', () => {
            for (let hour = 0; hour < 8; hour++) {
                expect(isBusinessHour(hour)).toBe(false);
            }
        });

        test('returns false for hours after 17', () => {
            for (let hour = 18; hour < 24; hour++) {
                expect(isBusinessHour(hour)).toBe(false);
            }
        });
    });
});
