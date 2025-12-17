// API Configuration
// Create React App automatically loads .env files and makes REACT_APP_* variables
// available via process.env at build time
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export { API_BASE_URL };
