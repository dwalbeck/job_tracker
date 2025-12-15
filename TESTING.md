# Testing Guide - Job Tracker Application

This comprehensive guide covers testing procedures, logging configuration, and CI/CD integration for the Job Tracker application.

## Table of Contents

1. [Overview](#overview)
2. [Backend Testing (Python/FastAPI)](#backend-testing-pythonfastapi)
3. [Frontend Testing (React/Jest)](#frontend-testing-reactjest)
4. [Logging Configuration](#logging-configuration)
5. [Viewing Logs](#viewing-logs)
6. [Understanding Test Results](#understanding-test-results)
7. [CI/CD Integration](#cicd-integration)

---

## Overview

The Job Tracker application uses different testing frameworks for frontend and backend:

- **Backend**: pytest (Python testing framework)
- **Frontend**: Jest + React Testing Library (JavaScript testing framework)

**Test Coverage**:
- Backend: 20 test files covering APIs, utilities, and core functionality
- Frontend: 35 test files covering components, pages, services, and utilities

---

## Backend Testing (Python/FastAPI)

### Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared fixtures and configuration
│   ├── test_*_api.py        # API endpoint tests
│   ├── test_*.py            # Utility and core tests
│   └── README.md            # Test documentation
├── pytest.ini               # pytest configuration
└── requirements.txt         # Test dependencies included
```

### Running Backend Tests

#### 1. Run All Tests

```bash
# Inside backend container
docker exec api.jobtracker.com pytest

# From host machine (if backend has shell access)
docker exec api.jobtracker.com bash -c "cd /app && pytest"
```

#### 2. Run Specific Test File

```bash
# Test a specific API module
docker exec api.jobtracker.com pytest tests/test_jobs_api.py

# Test conversion utilities
docker exec api.jobtracker.com pytest tests/test_conversion.py
```

#### 3. Run Tests in a Directory

```bash
# Run all API tests
docker exec api.jobtracker.com pytest tests/ -k "api"

# Run all utility tests
docker exec api.jobtracker.com pytest tests/ -k "test_" --ignore=tests/test_*_api.py
```

#### 4. Run Specific Test Function

```bash
# Run single test function
docker exec api.jobtracker.com pytest tests/test_jobs_api.py::test_create_job

# Run all tests matching a pattern
docker exec api.jobtracker.com pytest -k "test_create"
```

#### 5. Run with Coverage Report

```bash
# Generate coverage report
docker exec api.jobtracker.com pytest --cov=app --cov-report=term-missing

# Generate HTML coverage report
docker exec api.jobtracker.com pytest --cov=app --cov-report=html
```

### Backend Test Options

```bash
# Verbose output with detailed information
docker exec api.jobtracker.com pytest -v

# Extra verbose (show test names as they run)
docker exec api.jobtracker.com pytest -vv

# Stop on first failure
docker exec api.jobtracker.com pytest -x

# Run last failed tests only
docker exec api.jobtracker.com pytest --lf

# Show local variables in tracebacks
docker exec api.jobtracker.com pytest -l

# Run tests in parallel (if pytest-xdist installed)
docker exec api.jobtracker.com pytest -n auto

# Skip slow tests
docker exec api.jobtracker.com pytest -m "not slow"

# Run only integration tests
docker exec api.jobtracker.com pytest -m "integration"
```

### pytest.ini Configuration

Current configuration (`backend/pytest.ini`):

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
```

**Configuration Options**:
- `testpaths`: Directory containing tests
- `python_files`: Test file naming pattern
- `python_functions`: Test function naming pattern
- `addopts`: Default arguments for pytest
- `markers`: Custom test markers

---

## Frontend Testing (React/Jest)

### Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── */
│   │       ├── *.js
│   │       └── *.test.js    # Component tests
│   ├── pages/
│   │   └── */
│   │       ├── *.js
│   │       └── *.test.js    # Page tests
│   ├── services/
│   │   ├── api.js
│   │   └── api.test.js      # Service tests
│   ├── utils/
│   │   ├── *.js
│   │   └── *.test.js        # Utility tests
│   └── App.test.js          # App component test
└── package.json             # Test scripts
```

### Running Frontend Tests

#### 1. Run All Tests (Interactive Watch Mode)

```bash
# Inside frontend container
docker exec portal.jobtracker.com npm test

# From host machine
docker exec portal.jobtracker.com bash -c "cd /app && npm test"
```

**Interactive Mode Commands**:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit watch mode
- Press `Enter` to trigger test run

#### 2. Run All Tests Once (CI Mode)

```bash
# Run all tests without watch mode
docker exec portal.jobtracker.com npm test -- --watchAll=false

# Run with coverage
docker exec portal.jobtracker.com npm test -- --coverage --watchAll=false
```

#### 3. Run Specific Test File

```bash
# Test specific file
docker exec portal.jobtracker.com npm test -- JobCard.test.js --watchAll=false

# Test file by path
docker exec portal.jobtracker.com npm test -- src/components/JobCard/JobCard.test.js --watchAll=false
```

#### 4. Run Tests Matching Pattern

```bash
# Run tests matching "Calendar"
docker exec portal.jobtracker.com npm test -- --testNamePattern="Calendar" --watchAll=false

# Run tests in files matching pattern
docker exec portal.jobtracker.com npm test -- --testPathPattern="components" --watchAll=false
```

#### 5. Run Tests for Changed Files

```bash
# Run tests for files changed since last commit
docker exec portal.jobtracker.com npm test -- --onlyChanged --watchAll=false

# Run tests related to changed files
docker exec portal.jobtracker.com npm test -- --changedSince=main --watchAll=false
```

### Frontend Test Options

```bash
# Verbose output
docker exec portal.jobtracker.com npm test -- --verbose --watchAll=false

# Update snapshots
docker exec portal.jobtracker.com npm test -- --updateSnapshot --watchAll=false

# Run tests with coverage threshold
docker exec portal.jobtracker.com npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}' --watchAll=false

# Run tests in band (no parallel)
docker exec portal.jobtracker.com npm test -- --runInBand --watchAll=false

# Clear cache before running
docker exec portal.jobtracker.com npm test -- --clearCache
```

### package.json Test Script

Current configuration (`frontend/package.json`):

```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:ci": "react-scripts test --watchAll=false --coverage",
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  }
}
```

---

## Logging Configuration

### Backend Logging

**Configuration Location**: `backend/.env`

```bash
# Logging Configuration
LOG_LEVEL=DEBUG        # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE=api.log       # Log file name
```

**Log Levels Explained**:
- `DEBUG`: Detailed information for diagnosing problems (most verbose)
- `INFO`: Confirmation that things are working as expected
- `WARNING`: Indication that something unexpected happened
- `ERROR`: Serious problem, software cannot perform function
- `CRITICAL`: Very serious error, program may not continue (least verbose)

**Changing Backend Log Level**:

1. Edit `backend/.env`:
   ```bash
   LOG_LEVEL=INFO  # Change from DEBUG to INFO
   ```

2. Restart backend container:
   ```bash
   docker compose restart backend
   ```

3. Verify new log level:
   ```bash
   docker exec api.jobtracker.com bash -c "grep 'LOG_LEVEL' /app/.env"
   ```

**Backend Logger Features**:
- Rotating file logs (10MB per file, 5 backup files)
- Console output in development
- Structured logging with timestamps
- Database operation tracking
- Request/response logging via middleware

### Frontend Logging

**Configuration Location**: `frontend/.env`

```bash
# Logging Configuration
REACT_APP_LOG_LEVEL=DEBUG                   # DEBUG, INFO, WARN, ERROR
REACT_APP_ENABLE_CONSOLE_LOGGING=true      # true or false
```

**Log Levels Explained**:
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARN`: Warning messages for potentially harmful situations
- `ERROR`: Error messages for failures

**Changing Frontend Log Level**:

1. Edit `frontend/.env`:
   ```bash
   REACT_APP_LOG_LEVEL=INFO
   REACT_APP_ENABLE_CONSOLE_LOGGING=false
   ```

2. Rebuild and restart frontend:
   ```bash
   docker compose build frontend
   docker compose restart frontend
   ```

**Frontend Logger Features**:
- Browser localStorage persistence
- Exportable log history
- Console logging toggle
- API request/response logging
- Client-side error tracking

---

## Viewing Logs

### Backend Logs

#### 1. View Live Logs (Follow Mode)

```bash
# Follow all backend logs
docker logs -f api.jobtracker.com

# Follow last 100 lines
docker logs -f --tail 100 api.jobtracker.com
```

#### 2. View Log File Inside Container

```bash
# View entire log file
docker exec api.jobtracker.com cat /app/api.log

# View last 50 lines
docker exec api.jobtracker.com tail -n 50 /app/api.log

# Follow log file in real-time
docker exec api.jobtracker.com tail -f /app/api.log

# Search logs for specific pattern
docker exec api.jobtracker.com grep "ERROR" /app/api.log

# View logs with timestamps
docker exec api.jobtracker.com tail -n 100 /app/api.log | grep "2025-12-13"
```

#### 3. Copy Log File to Host

```bash
# Copy log file from container to current directory
docker cp api.jobtracker.com:/app/api.log ./backend-api.log

# Copy with timestamp
docker cp api.jobtracker.com:/app/api.log ./backend-api-$(date +%Y%m%d-%H%M%S).log
```

#### 4. Filter Logs by Level

```bash
# View only ERROR logs
docker exec api.jobtracker.com grep "ERROR" /app/api.log

# View WARNING and ERROR logs
docker exec api.jobtracker.com grep -E "WARNING|ERROR" /app/api.log

# View DEBUG logs only
docker exec api.jobtracker.com grep "DEBUG" /app/api.log

# Exclude DEBUG logs
docker exec api.jobtracker.com grep -v "DEBUG" /app/api.log
```

#### 5. View Logs by Time Range

```bash
# Logs from today
docker exec api.jobtracker.com grep "$(date +%Y-%m-%d)" /app/api.log

# Logs from specific time range
docker exec api.jobtracker.com awk '/2025-12-13 14:00/,/2025-12-13 15:00/' /app/api.log
```

### Frontend Logs

#### 1. View Browser Console Logs

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Filter by log level (Info, Warn, Error)
4. Search for specific messages

#### 2. View localStorage Logs

**In Browser Console**:

```javascript
// Get all logs
logger.getLogs()

// Export logs to file
logger.exportLogs()

// Clear logs
logger.clearLogs()

// Get logs from last hour
const oneHourAgo = Date.now() - (60 * 60 * 1000);
const recentLogs = logger.getLogs().filter(log => log.timestamp > oneHourAgo);
console.table(recentLogs);
```

#### 3. View Docker Container Logs

```bash
# Follow frontend container logs
docker logs -f portal.jobtracker.com

# View last 100 lines
docker logs --tail 100 portal.jobtracker.com

# View logs with timestamps
docker logs -t portal.jobtracker.com
```

#### 4. View Nginx Access Logs

```bash
# View Nginx access logs
docker exec portal.jobtracker.com cat /var/log/nginx/access.log

# View Nginx error logs
docker exec portal.jobtracker.com cat /var/log/nginx/error.log

# Follow Nginx error logs
docker exec portal.jobtracker.com tail -f /var/log/nginx/error.log
```

---

## Understanding Test Results

### Backend Test Output (pytest)

#### Successful Test Run

```
================================ test session starts ================================
platform linux -- Python 3.11.0, pytest-7.4.3, pluggy-1.3.0 -- /usr/local/bin/python
rootdir: /app
configfile: pytest.ini
testpaths: tests
plugins: asyncio-0.21.1, mock-3.12.0
collected 156 items

tests/test_jobs_api.py::test_create_job PASSED                               [  1%]
tests/test_jobs_api.py::test_get_job PASSED                                  [  2%]
tests/test_jobs_api.py::test_update_job PASSED                               [  3%]
...
tests/test_conversion.py::test_html_to_docx PASSED                           [100%]

================================ 156 passed in 12.45s ================================
```

**Key Elements**:
- `collected 156 items`: Total tests found
- `PASSED`: Test succeeded
- `[100%]`: Progress percentage
- `156 passed in 12.45s`: Summary with execution time

#### Failed Test Run

```
================================ test session starts ================================
collected 156 items

tests/test_jobs_api.py::test_create_job PASSED                               [  1%]
tests/test_jobs_api.py::test_get_job FAILED                                  [  2%]

==================================== FAILURES =====================================
__________________________ test_get_job ___________________________

    def test_get_job():
        response = client.get("/v1/job/123")
>       assert response.status_code == 200
E       AssertionError: assert 404 == 200
E        +  where 404 = <Response [404]>.status_code

tests/test_jobs_api.py:45: AssertionError
========================= short test summary info =========================
FAILED tests/test_jobs_api.py::test_get_job - AssertionError: assert 404 == 200
==================== 1 failed, 155 passed in 12.45s ====================
```

**Key Elements**:
- `FAILED`: Test that failed
- `>`: Line where failure occurred
- `E`: Error/assertion details
- `AssertionError`: Type of failure
- `short test summary info`: Summary of failures
- `1 failed, 155 passed`: Final count

#### Test with Warnings

```
======================== 156 passed, 3 warnings in 12.45s ========================
============================= warnings summary ==============================
tests/test_ai_agent.py::test_openai_connection
  /usr/local/lib/python3.11/site-packages/openai/api.py:123: DeprecationWarning:
  This method is deprecated, use 'client.chat.completions.create' instead

-- Docs: https://docs.pytest.org/en/stable/how-to/warnings.html
```

**Key Elements**:
- `3 warnings`: Number of warnings
- `DeprecationWarning`: Type of warning
- Warnings don't fail tests but indicate potential issues

#### Coverage Report

```
---------- coverage: platform linux, python 3.11.0 -----------
Name                              Stmts   Miss  Cover   Missing
---------------------------------------------------------------
app/__init__.py                       0      0   100%
app/api/jobs.py                     156     12    92%   45-48, 123-127
app/api/resume.py                   234     45    81%   78-82, 156-189
app/utils/conversion.py             189     23    88%   234-256
---------------------------------------------------------------
TOTAL                              2847    234    92%
```

**Key Elements**:
- `Stmts`: Total statements in file
- `Miss`: Statements not covered by tests
- `Cover`: Percentage coverage
- `Missing`: Line numbers not covered

### Frontend Test Output (Jest)

#### Successful Test Run

```
PASS  src/components/JobCard/JobCard.test.js
  JobCard Component
    ✓ renders job card with job data (45 ms)
    ✓ displays company name (12 ms)
    ✓ displays job title (8 ms)
    ✓ handles click event (23 ms)

PASS  src/services/api.test.js
  API Service
    ✓ makes GET request (34 ms)
    ✓ makes POST request (28 ms)
    ✓ handles error responses (19 ms)

Test Suites: 35 passed, 35 total
Tests:       247 passed, 247 total
Snapshots:   12 passed, 12 total
Time:        18.456 s
Ran all test suites.
```

**Key Elements**:
- `PASS`: Test suite passed
- `✓`: Individual test passed
- `Test Suites`: Summary of test files
- `Tests`: Summary of individual tests
- `Snapshots`: UI snapshot comparisons
- `Time`: Total execution time

#### Failed Test Run

```
FAIL  src/components/JobCard/JobCard.test.js
  JobCard Component
    ✓ renders job card with job data (45 ms)
    ✕ displays company name (12 ms)

  ● JobCard Component › displays company name

    expect(element).toHaveTextContent()

    Expected element to have text content:
      Acme Corporation
    Received:


      23 |     render(<JobCard job={mockJob} />);
      24 |     const companyElement = screen.getByTestId('company-name');
    > 25 |     expect(companyElement).toHaveTextContent('Acme Corporation');
         |                            ^
      26 |   });

    at Object.<anonymous> (src/components/JobCard/JobCard.test.js:25:28)

Test Suites: 1 failed, 34 passed, 35 total
Tests:       1 failed, 246 passed, 247 total
Snapshots:   12 passed, 12 total
Time:        18.456 s
```

**Key Elements**:
- `FAIL`: Test suite with failures
- `✕`: Failed test
- `●`: Detailed failure information
- `Expected` vs `Received`: What was expected vs actual
- `>`: Line number of failure
- Line numbers with context code

#### Coverage Report

```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   87.45 |    82.31 |   89.12 |   87.89 |
 components/JobCard   |   92.50 |    88.89 |   95.00 |   92.30 | 45-48,67
 pages/JobTracker     |   85.20 |    78.50 |   87.50 |   85.40 | 123-145,234
 services             |   95.00 |    91.30 |   97.00 |   95.20 | 12,45
 utils                |   88.90 |    85.60 |   92.00 |   89.10 | 23,56,89-92
----------------------|---------|----------|---------|---------|-------------------
```

**Key Elements**:
- `% Stmts`: Statement coverage
- `% Branch`: Branch/condition coverage
- `% Funcs`: Function coverage
- `% Lines`: Line coverage
- `Uncovered Line #s`: Lines not tested

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml` for automated testing:

```yaml
name: Test and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:12
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Cache Python dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run backend tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          LOG_LEVEL: INFO
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term-missing

      - name: Upload backend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
          name: backend-coverage

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: frontend/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false

      - name: Upload frontend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend
          name: frontend-coverage

  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/job-tracker-backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/job-tracker-frontend:latest

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/job_tracker
            docker compose pull
            docker compose up -d
            docker compose ps
```

### Required GitHub Secrets

Configure these in GitHub repository settings → Secrets and variables → Actions:

```
OPENAI_API_KEY          - OpenAI API key for backend tests
DOCKER_USERNAME         - Docker Hub username
DOCKER_PASSWORD         - Docker Hub password/token
PRODUCTION_HOST         - Production server IP/hostname
PRODUCTION_USER         - SSH username for production
SSH_PRIVATE_KEY         - SSH private key for deployment
```

### Branch Protection Rules

Configure in GitHub repository settings → Branches → Branch protection rules:

1. **Require status checks to pass before merging**:
   - ✅ Backend Tests
   - ✅ Frontend Tests
   - ✅ Build Docker Images

2. **Require pull request reviews before merging**:
   - Number of required approvals: 1

3. **Require branches to be up to date before merging**:
   - ✅ Enabled

4. **Do not allow bypassing the above settings**:
   - ✅ Enabled

### Workflow Behavior

**On Pull Request**:
1. Run backend tests
2. Run frontend tests
3. Report test results in PR
4. ❌ **FAIL**: Block merge if any tests fail
5. ✅ **PASS**: Allow merge if all tests pass

**On Push to Main**:
1. Run backend tests
2. Run frontend tests
3. Build Docker images
4. Push to Docker Hub
5. Deploy to production
6. ❌ **FAIL**: Deployment aborted if tests fail
7. ✅ **PASS**: Deployment proceeds if tests pass

### Monitoring CI/CD

**View Workflow Status**:
- Go to GitHub repository → Actions tab
- Click on workflow run to see details
- View logs for each job
- Download artifacts (coverage reports, logs)

**Failed Workflow Notifications**:
- GitHub automatically sends email notifications
- Configure Slack/Discord webhooks for instant alerts
- Set up status badges in README.md

**Status Badge Example**:

```markdown
![Tests](https://github.com/username/job_tracker/workflows/Test%20and%20Deploy/badge.svg)
```

---

## Quick Reference

### Backend Commands

```bash
# Run all tests
docker exec api.jobtracker.com pytest

# Run specific test file
docker exec api.jobtracker.com pytest tests/test_jobs_api.py

# Run with coverage
docker exec api.jobtracker.com pytest --cov=app

# View logs
docker logs -f api.jobtracker.com
docker exec api.jobtracker.com tail -f /app/api.log
```

### Frontend Commands

```bash
# Run all tests (watch mode)
docker exec portal.jobtracker.com npm test

# Run all tests (CI mode)
docker exec portal.jobtracker.com npm test -- --watchAll=false

# Run with coverage
docker exec portal.jobtracker.com npm test -- --coverage --watchAll=false

# View logs
docker logs -f portal.jobtracker.com
```

### Log Level Changes

```bash
# Backend: Edit backend/.env
LOG_LEVEL=INFO  # Change to INFO, WARNING, ERROR, or CRITICAL

# Frontend: Edit frontend/.env
REACT_APP_LOG_LEVEL=INFO  # Change to INFO, WARN, or ERROR

# Restart containers
docker compose restart backend frontend
```

---

## Troubleshooting

### Tests Not Running

**Problem**: `pytest: command not found`

**Solution**:
```bash
# Install pytest in container
docker exec api.jobtracker.com pip install pytest pytest-asyncio pytest-mock

# Or rebuild container
docker compose build backend
```

**Problem**: `npm test` hangs or doesn't respond

**Solution**:
```bash
# Use CI mode instead
docker exec portal.jobtracker.com npm test -- --watchAll=false

# Or clear cache
docker exec portal.jobtracker.com npm test -- --clearCache
```

### Log Files Not Found

**Problem**: Cannot access `/app/api.log`

**Solution**:
```bash
# Check if log file exists
docker exec api.jobtracker.com ls -la /app/api.log

# Check LOG_FILE setting in .env
docker exec api.jobtracker.com cat /app/.env | grep LOG_FILE

# Check container working directory
docker exec api.jobtracker.com pwd
```

### Tests Failing in CI but Passing Locally

**Common Causes**:
1. Environment variables not set in CI
2. Database not initialized properly
3. External service dependencies (OpenAI API)
4. Timezone differences
5. File permissions

**Solution**:
- Review GitHub Actions workflow logs
- Ensure all secrets are configured
- Mock external services in tests
- Use consistent timezone (UTC) in CI

---

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Last Updated**: December 13, 2025
**Maintained By**: Development Team
