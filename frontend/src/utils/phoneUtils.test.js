import { formatPhoneNumber, validatePhoneNumber } from './phoneUtils';

describe('phoneUtils', () => {
    describe('formatPhoneNumber', () => {
        describe('Basic Formatting', () => {
            test('returns value as-is for null', () => {
                expect(formatPhoneNumber(null)).toBeNull();
            });

            test('returns value as-is for undefined', () => {
                expect(formatPhoneNumber(undefined)).toBeUndefined();
            });

            test('returns value as-is for empty string', () => {
                expect(formatPhoneNumber('')).toBe('');
            });

            test('returns unformatted for 1-3 digits', () => {
                expect(formatPhoneNumber('5')).toBe('5');
                expect(formatPhoneNumber('55')).toBe('55');
                expect(formatPhoneNumber('555')).toBe('555');
            });

            test('formats 4-6 digits with first dash', () => {
                expect(formatPhoneNumber('5551')).toBe('555-1');
                expect(formatPhoneNumber('55512')).toBe('555-12');
                expect(formatPhoneNumber('555123')).toBe('555-123');
            });

            test('formats 7-10 digits with two dashes', () => {
                expect(formatPhoneNumber('5551234')).toBe('555-123-4');
                expect(formatPhoneNumber('55512345')).toBe('555-123-45');
                expect(formatPhoneNumber('555123456')).toBe('555-123-456');
                expect(formatPhoneNumber('5551234567')).toBe('555-123-4567');
            });

            test('truncates after 10 digits', () => {
                expect(formatPhoneNumber('55512345678')).toBe('555-123-4567');
                expect(formatPhoneNumber('555123456789')).toBe('555-123-4567');
            });
        });

        describe('Handling Pre-formatted Input', () => {
            test('removes existing dashes', () => {
                expect(formatPhoneNumber('555-123-4567')).toBe('555-123-4567');
            });

            test('removes spaces', () => {
                expect(formatPhoneNumber('555 123 4567')).toBe('555-123-4567');
            });

            test('removes parentheses', () => {
                expect(formatPhoneNumber('(555) 123-4567')).toBe('555-123-4567');
            });

            test('removes dots', () => {
                expect(formatPhoneNumber('555.123.4567')).toBe('555-123-4567');
            });

            test('removes mixed special characters', () => {
                expect(formatPhoneNumber('(555) 123.4567')).toBe('555-123-4567');
                expect(formatPhoneNumber('555-123.4567')).toBe('555-123-4567');
            });
        });

        describe('Handling Invalid Characters', () => {
            test('removes letters', () => {
                expect(formatPhoneNumber('555abc1234567')).toBe('555-123-4567');
            });

            test('removes special characters', () => {
                expect(formatPhoneNumber('555!@#123$%^4567')).toBe('555-123-4567');
            });

            test('handles only non-numeric input', () => {
                expect(formatPhoneNumber('abcdefg')).toBe('');
            });

            test('handles mixed valid and invalid input', () => {
                expect(formatPhoneNumber('5a5b5c1d2e3f4g5h6i7j')).toBe('555-123-4567');
            });
        });

        describe('Edge Cases', () => {
            test('handles input with only dashes', () => {
                expect(formatPhoneNumber('---')).toBe('');
            });

            test('handles input with country code prefix', () => {
                expect(formatPhoneNumber('+15551234567')).toBe('155-512-3456');
            });

            test('formats partial numbers correctly', () => {
                expect(formatPhoneNumber('1')).toBe('1');
                expect(formatPhoneNumber('12')).toBe('12');
                expect(formatPhoneNumber('123')).toBe('123');
                expect(formatPhoneNumber('1234')).toBe('123-4');
                expect(formatPhoneNumber('12345')).toBe('123-45');
                expect(formatPhoneNumber('123456')).toBe('123-456');
                expect(formatPhoneNumber('1234567')).toBe('123-456-7');
            });

            test('handles whitespace', () => {
                expect(formatPhoneNumber('   555 123 4567   ')).toBe('555-123-4567');
            });

            test('handles leading zeros', () => {
                expect(formatPhoneNumber('0001234567')).toBe('000-123-4567');
            });
        });

        describe('Real-world Scenarios', () => {
            test('formats US phone number from various inputs', () => {
                const inputs = [
                    '5551234567',
                    '555-123-4567',
                    '(555) 123-4567',
                    '555.123.4567',
                    '555 123 4567',
                ];

                inputs.forEach(input => {
                    expect(formatPhoneNumber(input)).toBe('555-123-4567');
                });
            });

            test('formats toll-free number', () => {
                expect(formatPhoneNumber('8001234567')).toBe('800-123-4567');
            });

            test('formats number typed character by character', () => {
                const steps = [
                    { input: '5', output: '5' },
                    { input: '55', output: '55' },
                    { input: '555', output: '555' },
                    { input: '5551', output: '555-1' },
                    { input: '55512', output: '555-12' },
                    { input: '555123', output: '555-123' },
                    { input: '5551234', output: '555-123-4' },
                    { input: '55512345', output: '555-123-45' },
                    { input: '555123456', output: '555-123-456' },
                    { input: '5551234567', output: '555-123-4567' },
                ];

                steps.forEach(({ input, output }) => {
                    expect(formatPhoneNumber(input)).toBe(output);
                });
            });
        });
    });

    describe('validatePhoneNumber', () => {
        describe('Valid Phone Numbers', () => {
            test('validates 10-digit number without formatting', () => {
                expect(validatePhoneNumber('5551234567')).toBe(true);
            });

            test('validates formatted number with dashes', () => {
                expect(validatePhoneNumber('555-123-4567')).toBe(true);
            });

            test('validates formatted number with parentheses', () => {
                expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
            });

            test('validates formatted number with spaces', () => {
                expect(validatePhoneNumber('555 123 4567')).toBe(true);
            });

            test('validates formatted number with dots', () => {
                expect(validatePhoneNumber('555.123.4567')).toBe(true);
            });

            test('validates toll-free numbers', () => {
                expect(validatePhoneNumber('800-123-4567')).toBe(true);
                expect(validatePhoneNumber('888-123-4567')).toBe(true);
                expect(validatePhoneNumber('877-123-4567')).toBe(true);
            });
        });

        describe('Invalid Phone Numbers', () => {
            test('rejects number with fewer than 10 digits', () => {
                expect(validatePhoneNumber('555123456')).toBe(false);
                expect(validatePhoneNumber('55512345')).toBe(false);
                expect(validatePhoneNumber('5551234')).toBe(false);
            });

            test('rejects number with more than 10 digits', () => {
                expect(validatePhoneNumber('55512345678')).toBe(false);
                expect(validatePhoneNumber('555123456789')).toBe(false);
            });

            test('rejects empty string', () => {
                expect(validatePhoneNumber('')).toBe(false);
            });

            test('rejects string with no digits', () => {
                expect(validatePhoneNumber('abc-def-ghij')).toBe(false);
            });

            test('rejects partially formatted number with wrong digit count', () => {
                expect(validatePhoneNumber('555-123-456')).toBe(false);
                expect(validatePhoneNumber('555-123-45678')).toBe(false);
            });
        });

        describe('Edge Cases', () => {
            test('validates number with leading/trailing whitespace', () => {
                expect(validatePhoneNumber('  5551234567  ')).toBe(true);
                expect(validatePhoneNumber('  555-123-4567  ')).toBe(true);
            });

            test('rejects number with letters', () => {
                expect(validatePhoneNumber('555abc4567')).toBe(false);
            });

            test('validates number with extra characters but 10 digits', () => {
                expect(validatePhoneNumber('555-123-4567 ext. 123')).toBe(false);
            });

            test('handles numbers with country code', () => {
                expect(validatePhoneNumber('+15551234567')).toBe(false); // 11 digits
                expect(validatePhoneNumber('15551234567')).toBe(false); // 11 digits
            });

            test('handles all zeros', () => {
                expect(validatePhoneNumber('0000000000')).toBe(true);
            });

            test('handles all same digit', () => {
                expect(validatePhoneNumber('1111111111')).toBe(true);
                expect(validatePhoneNumber('9999999999')).toBe(true);
            });
        });

        describe('Real-world Scenarios', () => {
            test('validates various formatted inputs', () => {
                const validNumbers = [
                    '5551234567',
                    '555-123-4567',
                    '(555) 123-4567',
                    '555.123.4567',
                    '555 123 4567',
                    '(555)123-4567',
                    '555-1234567',
                ];

                validNumbers.forEach(number => {
                    expect(validatePhoneNumber(number)).toBe(true);
                });
            });

            test('rejects common invalid inputs', () => {
                const invalidNumbers = [
                    '123',
                    '123-4567',
                    '555-1234',
                    'phone number',
                    '555-123-456',
                    '555-123-45678',
                    '',
                    null,
                ];

                invalidNumbers.forEach(number => {
                    if (number === null) {
                        expect(() => validatePhoneNumber(number)).toThrow();
                    } else {
                        expect(validatePhoneNumber(number)).toBe(false);
                    }
                });
            });

            test('validates numbers as typed in a form', () => {
                const typingSequence = [
                    { input: '5', valid: false },
                    { input: '55', valid: false },
                    { input: '555', valid: false },
                    { input: '555-1', valid: false },
                    { input: '555-12', valid: false },
                    { input: '555-123', valid: false },
                    { input: '555-123-4', valid: false },
                    { input: '555-123-45', valid: false },
                    { input: '555-123-456', valid: false },
                    { input: '555-123-4567', valid: true },
                ];

                typingSequence.forEach(({ input, valid }) => {
                    expect(validatePhoneNumber(input)).toBe(valid);
                });
            });
        });

        describe('Integration with formatPhoneNumber', () => {
            test('validates formatted output', () => {
                const rawNumber = '5551234567';
                const formatted = formatPhoneNumber(rawNumber);
                expect(validatePhoneNumber(formatted)).toBe(true);
            });

            test('validates after removing non-digits', () => {
                const input = '(555) 123-4567';
                expect(validatePhoneNumber(input)).toBe(true);
            });

            test('rejects invalid input even after formatting attempt', () => {
                const invalidInput = '12345';
                const formatted = formatPhoneNumber(invalidInput);
                expect(validatePhoneNumber(formatted)).toBe(false);
            });
        });
    });
});
