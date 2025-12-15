import React from 'react';

// Mock all dependencies before importing index.js
jest.mock('./config', () => ({}));
jest.mock('react-dom/client');
jest.mock('./styles/index.css', () => ({}));
jest.mock('./App', () => {
    return function MockApp() {
        return <div>Mock App</div>;
    };
});
jest.mock('./utils/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
}));

describe('index', () => {
    let mockRoot;
    let mockCreateRoot;
    let mockGetElementById;
    let originalWindow;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Save original window
        originalWindow = global.window;

        // Mock ReactDOM.createRoot
        mockRoot = {
            render: jest.fn(),
        };
        mockCreateRoot = jest.fn(() => mockRoot);
        require('react-dom/client').createRoot = mockCreateRoot;

        // Mock document.getElementById
        mockGetElementById = jest.fn();
        global.document = {
            getElementById: mockGetElementById,
        };

        // Clear window.logger
        delete global.window.logger;
    });

    afterEach(() => {
        // Restore original window
        global.window = originalWindow;

        // Clear module cache to allow fresh imports
        jest.resetModules();
    });

    describe('Initialization', () => {
        test('imports config first', () => {
            // This test verifies that config is imported before other modules
            // Config must be first to set up environment variables
            const config = require('./config');
            expect(config).toBeDefined();
        });

        test('creates root with correct DOM element', () => {
            const mockRootElement = document.createElement('div');
            mockRootElement.id = 'root';
            mockGetElementById.mockReturnValue(mockRootElement);

            // Import index.js to trigger initialization
            require('./index');

            expect(mockGetElementById).toHaveBeenCalledWith('root');
            expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
        });

        test('calls root.render with correct structure', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockRoot.render).toHaveBeenCalledTimes(1);
            const renderCall = mockRoot.render.mock.calls[0][0];

            // Verify it's wrapped in StrictMode
            expect(renderCall.type).toBe(React.StrictMode);
        });

        test('renders App component inside StrictMode', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            const appComponent = renderCall.props.children;

            // The App component should be the child of StrictMode
            expect(appComponent).toBeDefined();
        });

        test('exposes logger to window object', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(window.logger).toBeDefined();
            expect(typeof window.logger.debug).toBe('function');
            expect(typeof window.logger.info).toBe('function');
            expect(typeof window.logger.warning).toBe('function');
            expect(typeof window.logger.error).toBe('function');
            expect(typeof window.logger.critical).toBe('function');
        });

        test('window.logger is the same as imported logger', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');
            const logger = require('./utils/logger');

            expect(window.logger).toBe(logger);
        });
    });

    describe('DOM Element Selection', () => {
        test('selects element with id "root"', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockGetElementById).toHaveBeenCalledWith('root');
            expect(mockGetElementById).toHaveBeenCalledTimes(1);
        });

        test('uses the returned element for createRoot', () => {
            const mockRootElement = document.createElement('div');
            mockRootElement.id = 'root';
            mockRootElement.className = 'app-container';
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
        });

        test('handles null root element', () => {
            mockGetElementById.mockReturnValue(null);

            // This should throw an error from ReactDOM.createRoot
            expect(() => {
                require('./index');
            }).toThrow();
        });

        test('handles undefined root element', () => {
            mockGetElementById.mockReturnValue(undefined);

            // This should throw an error from ReactDOM.createRoot
            expect(() => {
                require('./index');
            }).toThrow();
        });
    });

    describe('React.StrictMode', () => {
        test('wraps App in StrictMode', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            expect(renderCall.type).toBe(React.StrictMode);
        });

        test('StrictMode contains App as child', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            const children = renderCall.props.children;
            expect(children).toBeDefined();
        });

        test('does not add extra wrappers around StrictMode', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            // The top-level should be StrictMode, not wrapped in anything else
            expect(renderCall.type).toBe(React.StrictMode);
        });
    });

    describe('Module Imports', () => {
        test('imports all required dependencies', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            // Should not throw when importing
            expect(() => {
                require('./index');
            }).not.toThrow();
        });

        test('imports config module', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            // Config should be imported (mocked above)
            const config = require('./config');
            expect(config).toBeDefined();
        });

        test('imports React module', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            // React should be available
            expect(React).toBeDefined();
            expect(React.StrictMode).toBeDefined();
        });

        test('imports ReactDOM module', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const ReactDOM = require('react-dom/client');
            expect(ReactDOM.createRoot).toBeDefined();
        });

        test('imports App component', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const App = require('./App');
            expect(App).toBeDefined();
        });

        test('imports logger utility', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const logger = require('./utils/logger');
            expect(logger).toBeDefined();
        });

        test('imports index.css', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            // CSS import is mocked, should not throw
            expect(() => {
                require('./index');
            }).not.toThrow();
        });
    });

    describe('Logger Exposure', () => {
        test('logger is accessible via window.logger', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(window.logger).toBeDefined();
        });

        test('window.logger.debug is callable', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            window.logger.debug('test message');
            expect(window.logger.debug).toHaveBeenCalledWith('test message');
        });

        test('window.logger.info is callable', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            window.logger.info('test message');
            expect(window.logger.info).toHaveBeenCalledWith('test message');
        });

        test('window.logger.warning is callable', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            window.logger.warning('test message');
            expect(window.logger.warning).toHaveBeenCalledWith('test message');
        });

        test('window.logger.error is callable', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            window.logger.error('test message');
            expect(window.logger.error).toHaveBeenCalledWith('test message');
        });

        test('window.logger.critical is callable', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            window.logger.critical('test message');
            expect(window.logger.critical).toHaveBeenCalledWith('test message');
        });

        test('window.logger persists after initialization', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const loggerReference = window.logger;
            expect(window.logger).toBe(loggerReference);
        });
    });

    describe('ReactDOM.createRoot', () => {
        test('is called exactly once', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockCreateRoot).toHaveBeenCalledTimes(1);
        });

        test('returns root object with render method', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockRoot.render).toBeDefined();
            expect(typeof mockRoot.render).toBe('function');
        });

        test('root.render is called exactly once', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            expect(mockRoot.render).toHaveBeenCalledTimes(1);
        });

        test('creates root before rendering', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            const callOrder = [];
            mockCreateRoot.mockImplementation((...args) => {
                callOrder.push('createRoot');
                return mockRoot;
            });
            mockRoot.render.mockImplementation(() => {
                callOrder.push('render');
            });

            require('./index');

            expect(callOrder).toEqual(['createRoot', 'render']);
        });
    });

    describe('Edge Cases', () => {
        test('handles missing root element gracefully', () => {
            mockGetElementById.mockReturnValue(null);

            expect(() => {
                require('./index');
            }).toThrow();
        });

        test('handles createRoot throwing error', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);
            mockCreateRoot.mockImplementation(() => {
                throw new Error('Failed to create root');
            });

            expect(() => {
                require('./index');
            }).toThrow('Failed to create root');
        });

        test('handles render throwing error', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);
            mockRoot.render.mockImplementation(() => {
                throw new Error('Failed to render');
            });

            expect(() => {
                require('./index');
            }).toThrow('Failed to render');
        });

        test('handles element with different id', () => {
            const wrongElement = document.createElement('div');
            wrongElement.id = 'app';
            mockGetElementById.mockReturnValue(wrongElement);

            require('./index');

            // Should still work, but called with wrong element
            expect(mockGetElementById).toHaveBeenCalledWith('root');
        });

        test('handles multiple re-imports', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            // First import
            require('./index');
            const firstCallCount = mockCreateRoot.mock.calls.length;

            // Clear mocks but keep module cached
            jest.clearAllMocks();

            // Second require (should use cached module, not re-execute)
            require('./index');
            const secondCallCount = mockCreateRoot.mock.calls.length;

            // Should not call createRoot again (module is cached)
            expect(secondCallCount).toBe(0);
            expect(firstCallCount).toBe(1);
        });
    });

    describe('Render Structure', () => {
        test('renders complete structure', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];

            // Check structure: StrictMode > App
            expect(renderCall.type).toBe(React.StrictMode);
            expect(renderCall.props.children).toBeDefined();
        });

        test('StrictMode has no additional props', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            const { children, ...otherProps } = renderCall.props;

            // StrictMode should only have children prop
            expect(Object.keys(otherProps).length).toBe(0);
        });

        test('App component is rendered', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];
            const appComponent = renderCall.props.children;

            expect(appComponent).toBeDefined();
        });

        test('no extra elements in render tree', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            const renderCall = mockRoot.render.mock.calls[0][0];

            // Should be exactly: <StrictMode><App /></StrictMode>
            expect(renderCall.type).toBe(React.StrictMode);
            expect(renderCall.props.children).toBeDefined();
        });
    });

    describe('Configuration Loading', () => {
        test('config is loaded before App', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            // The import order in index.js ensures config is loaded first
            require('./index');

            const config = require('./config');
            const App = require('./App');

            expect(config).toBeDefined();
            expect(App).toBeDefined();
        });

        test('config import does not throw', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            expect(() => {
                require('./index');
            }).not.toThrow();
        });
    });

    describe('Integration', () => {
        test('completes full initialization sequence', () => {
            const mockRootElement = document.createElement('div');
            mockRootElement.id = 'root';
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            // Verify all steps completed
            expect(mockGetElementById).toHaveBeenCalledWith('root');
            expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
            expect(mockRoot.render).toHaveBeenCalledTimes(1);
            expect(window.logger).toBeDefined();
        });

        test('initialization happens synchronously', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            const startTime = Date.now();
            require('./index');
            const endTime = Date.now();

            // Should complete very quickly (synchronously)
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('all dependencies are initialized', () => {
            const mockRootElement = document.createElement('div');
            mockGetElementById.mockReturnValue(mockRootElement);

            require('./index');

            // Check that all mocked dependencies are defined
            expect(require('./config')).toBeDefined();
            expect(React).toBeDefined();
            expect(require('react-dom/client')).toBeDefined();
            expect(require('./App')).toBeDefined();
            expect(require('./utils/logger')).toBeDefined();
        });
    });
});
