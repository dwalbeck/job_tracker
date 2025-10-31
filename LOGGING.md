# Logging Implementation Summary

## Backend API Logging

### Configuration
- **Environment Variables:**
  - `LOG_LEVEL=DEBUG` - Controls log verbosity (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  - `LOG_FILE=api.log` - Log file name in document root

### Features
- **Automatic Request/Response Logging:** All API requests and responses are logged via middleware
- **Database Operation Logging:** All CRUD operations are logged with table and record ID
- **Error Logging:** All errors include context and stack traces
- **File Logging:** Logs written to `api.log` in backend document root with rotation (10MB, 5 backups)
- **Console Logging:** Parallel console output for development

### Implementation Files
- `/backend/app/utils/logger.py` - Core logging utility
- `/backend/app/middleware/logging_middleware.py` - Request/response middleware
- `/backend/app/main.py` - Logging middleware integration
- Updated API endpoints in `/backend/app/api/` with logging calls

### Log Format
```
YYYY-MM-DD HH:MM:SS - LEVEL - LOGGER_NAME - MESSAGE | context=value
```

## Frontend Portal Logging

### Configuration
- **Environment Variables:**
  - `REACT_APP_LOG_LEVEL=DEBUG` - Controls log verbosity
  - `REACT_APP_LOG_FILE=portal.log` - Log file name (stored in localStorage)
  - `REACT_APP_ENABLE_CONSOLE_LOGGING=true` - Enable/disable console output

### Features
- **Page View Logging:** All page navigations are tracked
- **API Request/Response Logging:** All API calls are logged with timing
- **User Action Logging:** User interactions and form submissions
- **Error Logging:** Unhandled errors and promise rejections
- **Browser Storage:** Logs stored in localStorage with 1000 entry limit
- **Export Function:** Logs can be exported as text file

### Implementation Files
- `/frontend/src/utils/logger.js` - Core logging utility
- `/frontend/src/services/api.js` - API request/response logging
- `/frontend/src/App.js` - Application-level error handling
- Updated pages with page view logging

### Log Storage
- Logs stored in browser localStorage as JSON
- Accessible via `logger.getLogs()`, `logger.clearLogs()`, `logger.exportLogs()`

## Usage Examples

### Backend
```python
from app.utils.logger import logger

# Basic logging
logger.info("User action completed", user_id=123)
logger.error("Database connection failed", database="jobtracker")

# Specialized logging
logger.log_database_operation("INSERT", "jobs", 456)
logger.log_error_with_context(exception, "Job creation process")
```

### Frontend
```javascript
import logger from '../utils/logger';

// Page views (automatic on key pages)
logger.logPageView('Job Tracker', '/job-tracker');

// User actions
logger.logUserAction('Job Created', { jobId: 123, company: 'TechCorp' });

// Form submissions
logger.logFormSubmission('JobForm', formData);

// Errors
logger.logError(error, 'Job form submission');
```

## Monitoring
- **Backend:** Check `api.log` in backend document root
- **Frontend:** Access browser localStorage or use `logger.exportLogs()`
- **Production:** Consider log aggregation services for centralized monitoring

## Performance Impact
- **Backend:** Minimal overhead with async file operations
- **Frontend:** localStorage operations are fast, 1000 entry limit prevents memory issues

Both implementations provide comprehensive logging coverage for debugging, monitoring, and audit trails.