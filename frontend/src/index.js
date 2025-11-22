// Load configuration first to initialize environment variables
import './config';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import logger from './utils/logger';

// Expose logger to window for console access
window.logger = logger;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);