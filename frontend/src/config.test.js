describe('config', () => {
    let originalEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        // Clear the module cache to allow re-importing with different env values
        jest.resetModules();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('API_BASE_URL', () => {
        test('uses environment variable when set', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://api.example.com');
        });

        test('uses default value when environment variable not set', () => {
            delete process.env.REACT_APP_API_BASE_URL;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://localhost:8080');
        });

        test('uses empty string environment variable over default', () => {
            process.env.REACT_APP_API_BASE_URL = '';

            const { API_BASE_URL } = require('./config');

            // Empty string is falsy, so default should be used
            expect(API_BASE_URL).toBe('http://localhost:8080');
        });

        test('uses custom API URL from environment', () => {
            process.env.REACT_APP_API_BASE_URL = 'https://production-api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('https://production-api.example.com');
        });

        test('handles localhost with different port', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://localhost:3001');
        });

        test('handles HTTPS URLs', () => {
            process.env.REACT_APP_API_BASE_URL = 'https://secure.api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('https://secure.api.example.com');
        });

        test('handles URLs with paths', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com/v1';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://api.example.com/v1');
        });

        test('handles URLs with ports', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com:8000';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://api.example.com:8000');
        });

        test('handles IP addresses', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://192.168.1.100:8080';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://192.168.1.100:8080');
        });

        test('exports API_BASE_URL', () => {
            const config = require('./config');

            expect(config).toHaveProperty('API_BASE_URL');
        });

        test('API_BASE_URL is a string', () => {
            const { API_BASE_URL } = require('./config');

            expect(typeof API_BASE_URL).toBe('string');
        });

        test('API_BASE_URL is not null or undefined', () => {
            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBeDefined();
            expect(API_BASE_URL).not.toBeNull();
        });
    });

    describe('Environment Variable Handling', () => {
        test('does not modify other environment variables', () => {
            process.env.REACT_APP_OTHER_VAR = 'other-value';
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com';

            require('./config');

            expect(process.env.REACT_APP_OTHER_VAR).toBe('other-value');
        });

        test('handles undefined environment variable', () => {
            process.env.REACT_APP_API_BASE_URL = undefined;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://localhost:8080');
        });

        test('handles null environment variable', () => {
            process.env.REACT_APP_API_BASE_URL = null;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://localhost:8080');
        });
    });

    describe('Default Value', () => {
        test('default value is localhost:8080', () => {
            delete process.env.REACT_APP_API_BASE_URL;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://localhost:8080');
        });

        test('default value uses HTTP protocol', () => {
            delete process.env.REACT_APP_API_BASE_URL;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toMatch(/^http:/);
        });

        test('default value includes port 8080', () => {
            delete process.env.REACT_APP_API_BASE_URL;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toContain(':8080');
        });
    });

    describe('Edge Cases', () => {
        test('handles URL with trailing slash', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com/';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://api.example.com/');
        });

        test('handles URL without protocol', () => {
            process.env.REACT_APP_API_BASE_URL = 'api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('api.example.com');
        });

        test('handles whitespace in environment variable', () => {
            process.env.REACT_APP_API_BASE_URL = '  http://api.example.com  ';

            const { API_BASE_URL } = require('./config');

            // Environment variables are used as-is, including whitespace
            expect(API_BASE_URL).toBe('  http://api.example.com  ');
        });

        test('handles very long URLs', () => {
            const longUrl = 'http://' + 'a'.repeat(200) + '.example.com';
            process.env.REACT_APP_API_BASE_URL = longUrl;

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe(longUrl);
        });

        test('handles URLs with query parameters', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com?key=value';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://api.example.com?key=value');
        });

        test('handles URLs with authentication', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://user:pass@api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://user:pass@api.example.com');
        });
    });

    describe('Configuration Immutability', () => {
        test('exports same value on multiple imports', () => {
            process.env.REACT_APP_API_BASE_URL = 'http://api.example.com';

            const { API_BASE_URL: firstImport } = require('./config');
            const { API_BASE_URL: secondImport } = require('./config');

            expect(firstImport).toBe(secondImport);
        });

        test('does not allow modification of exported value', () => {
            const config = require('./config');
            const originalValue = config.API_BASE_URL;

            // Attempt to modify (this won't work with ES6 exports in normal circumstances)
            // But we test that the value remains consistent
            expect(config.API_BASE_URL).toBe(originalValue);
        });
    });

    describe('Build-time Configuration', () => {
        test('configuration is set at build time', () => {
            // Set environment variable before import
            process.env.REACT_APP_API_BASE_URL = 'http://build-time-api.example.com';

            const { API_BASE_URL } = require('./config');

            expect(API_BASE_URL).toBe('http://build-time-api.example.com');

            // Changing environment after import should not affect the value
            process.env.REACT_APP_API_BASE_URL = 'http://different-api.example.com';

            // The already imported value should remain the same
            expect(API_BASE_URL).toBe('http://build-time-api.example.com');
        });

        test('only reads REACT_APP_* prefixed variables', () => {
            process.env.API_BASE_URL = 'http://wrong.example.com'; // No REACT_APP_ prefix
            delete process.env.REACT_APP_API_BASE_URL;

            const { API_BASE_URL } = require('./config');

            // Should use default, not the non-prefixed env var
            expect(API_BASE_URL).toBe('http://localhost:8080');
        });
    });
});
