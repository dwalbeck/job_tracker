# TESTING.md

## Table of Contents
- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [CI/CD Integration (Future)](#cicd-integration-future)

---

## Overview

This document provides comprehensive testing procedures for the Job Tracker application, covering both frontend (React) and backend (FastAPI) services. It includes instructions for running tests locally, understanding test output, and integrating automated testing into a CI/CD pipeline using GitHub Actions.

**Testing Summary:**
- **Frontend:** Jest + React Testing Library (35 test files)
- **Backend:** pytest + pytest-asyncio + pytest-mock (22 test files)
- **Total Test Coverage:** 57 test files across frontend and backend

---

## Frontend Testing

### Testing Framework and Versions

The frontend uses **Jest** as the test runner (via Create React App's `react-scripts`) with React Testing Library for component testing.

**Packages and Versions** (from `frontend/package.json`):
```json
{
  "@testing-library/jest-dom": "^5.16.4",
  "@testing-library/react": "^13.3.0",
  "@testing-library/user-event": "^13.5.0",
  "react-scripts": "5.0.1"
}
```

**Key Testing Tools:**
- **Jest**: JavaScript testing framework (bundled with react-scripts)
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: Simulate user interactions

### Test File Locations

Test files are located throughout the `frontend/src/` directory, co-located with the code they test:

```
frontend/src/
├── App.test.js                           # Main App component tests
├── index.test.js                         # Entry point tests
├── config.test.js                        # Configuration tests
├── components/                           # Component tests
│   ├── Calendar/
│   │   ├── DayView.test.js
│   │   ├── MonthView.test.js
│   │   └── WeekView.test.js
│   ├── CalendarForm/CalendarForm.test.js
│   ├── ContactForm/ContactForm.test.js
│   ├── ExportMenu/ExportMenu.test.js
│   ├── JobCard/JobCard.test.js
│   ├── JobForm/JobForm.test.js
│   ├── Navigation/Navigation.test.js
│   ├── NotesForm/NotesForm.test.js
│   ├── ReminderAlert/ReminderAlert.test.js
│   └── ReminderModal/ReminderModal.test.js
├── pages/                                # Page component tests
│   ├── Calendar/Calendar.test.js
│   ├── ContactDetails/ContactDetails.test.js
│   ├── Contacts/Contacts.test.js
│   ├── CoverLetter/CoverLetter.test.js
│   ├── CreateCoverLetter/CreateCoverLetter.test.js
│   ├── EditResume/EditResume.test.js
│   ├── JobAnalysis/JobAnalysis.test.js
│   ├── JobDetails/JobDetails.test.js
│   ├── JobTracker/JobTracker.test.js
│   ├── ManuallyEditResume/ManuallyEditResume.test.js
│   ├── Notes/Notes.test.js
│   ├── OptimizedResume/OptimizedResume.test.js
│   ├── Resume/Resume.test.js
│   ├── ResumeForm/ResumeForm.test.js
│   └── ViewResume/ViewResume.test.js
├── services/
│   └── api.test.js                       # API service tests
└── utils/                                # Utility function tests
    ├── calendarUtils.test.js
    ├── dateUtils.test.js
    ├── logger.test.js
    └── phoneUtils.test.js
```

**Naming Convention:** `*.test.js` (e.g., `JobCard.test.js`)

### Running Frontend Tests

#### Prerequisites
Tests must be run from within the Docker container or with dependencies installed locally.

**Option 1: Run in Docker Container**
```bash
# Shell into the frontend container
docker exec -it portal.jobtracknow.com sh

# Navigate to app directory
cd /app
```

**Option 2: Run Locally (if not using Docker)**
```bash
cd frontend
npm install  # Install dependencies first
```

#### Test Execution Commands

**1. Run All Tests**
```bash
npm test -- --watchAll=false
```

**2. Run Tests in Watch Mode (Interactive)**
```bash
npm test
```
This starts Jest in watch mode, which:
- Re-runs tests when files change
- Provides interactive menu for filtering tests
- Useful during development

**3. Run Tests for a Specific File**
```bash
# Pattern matching
npm test -- JobCard.test.js --watchAll=false

# Or with full path
npm test -- src/components/JobCard/JobCard.test.js --watchAll=false
```

**4. Run Tests for a Specific Directory**
```bash
# Test all components
npm test -- src/components --watchAll=false

# Test all pages
npm test -- src/pages --watchAll=false

# Test utilities only
npm test -- src/utils --watchAll=false
```

**5. Run Tests with Coverage Report**
```bash
npm test -- --coverage --watchAll=false
```

**6. Run Tests Matching a Pattern**
```bash
# Run all calendar-related tests
npm test -- Calendar --watchAll=false

# Run all form tests
npm test -- Form --watchAll=false
```

### Test Output Explanation

#### Successful Test Run
```
PASS  src/components/JobCard/JobCard.test.js
  JobCard Component
    Component Rendering
      ✓ renders job card with all job details (45ms)
      ✓ displays company name correctly (12ms)
      ✓ displays job title correctly (10ms)
    User Interactions
      ✓ calls onClick when card is clicked (23ms)
      ✓ handles drag and drop (18ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        2.456s
Ran all test suites matching /JobCard.test.js/i.
```

**Key Elements:**
- `PASS`: Test suite passed
- `✓`: Individual test passed
- `Test Suites`: Number of test files
- `Tests`: Total number of individual tests
- `Time`: Execution time

#### Failed Test Run
```
FAIL  src/components/JobCard/JobCard.test.js
  JobCard Component
    Component Rendering
      ✕ renders job card with all job details (52ms)

  ● JobCard Component › Component Rendering › renders job card with all job details

    TestingLibraryElementError: Unable to find an element with the text: TechCorp

      48 |         render(
      49 |             <DnDWrapper>
    > 50 |                 <JobCard job={mockJob} index={0} onClick={mockOnClick} />
         |                 ^
      51 |             </DnDWrapper>
      52 |         );

    at Object.<anonymous> (src/components/JobCard/JobCard.test.js:50:17)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 4 passed, 5 total
```

**Key Elements:**
- `FAIL`: Test suite failed
- `✕`: Failed test
- `●`: Error details with stack trace
- Line numbers showing where the failure occurred

#### Coverage Report Output
```
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|-------------------
All files                  |   78.45 |    65.23 |   82.10 |   78.98 |
 components                |   82.15 |    70.45 |   85.30 |   82.67 |
  JobCard.js               |   95.00 |    88.89 |  100.00 |   95.00 | 45,78
  Navigation.js            |   72.50 |    60.00 |   75.00 |   73.25 | 23-28,45-50
 utils                     |   90.25 |    85.30 |   92.00 |   90.50 |
  dateUtils.js             |   95.00 |    90.00 |  100.00 |   95.00 | 67
---------------------------|---------|----------|---------|---------|-------------------
```

**Coverage Metrics:**
- **% Stmts**: Percentage of statements executed
- **% Branch**: Percentage of conditional branches tested
- **% Funcs**: Percentage of functions called
- **% Lines**: Percentage of lines executed
- **Uncovered Line #s**: Specific lines not covered by tests

### Available Test Options

Common Jest CLI options (use with `npm test --`):

```bash
# Run only tests that failed in the last run
npm test -- --onlyFailures --watchAll=false

# Run tests with verbose output
npm test -- --verbose --watchAll=false

# Run tests with coverage (detailed report)
npm test -- --coverage --watchAll=false

# Run tests in silent mode (suppress console output)
npm test -- --silent --watchAll=false

# Run tests with a specific timeout
npm test -- --testTimeout=10000 --watchAll=false

# Run tests in a specific order
npm test -- --runInBand --watchAll=false

# Run tests and update snapshots
npm test -- --updateSnapshot --watchAll=false

# Run tests and bail after first failure
npm test -- --bail --watchAll=false

# Run tests matching a pattern
npm test -- --testNamePattern="renders correctly" --watchAll=false

# Clear Jest cache before running
npm test -- --clearCache
```

### Handling Test Results

**1. All Tests Pass**
- ✅ Proceed with deployment or commit
- Review coverage report if generated
- Ensure coverage meets team standards (typically >80%)

**2. Tests Fail**
- ❌ Do NOT deploy or merge
- Review error messages and stack traces
- Fix the failing tests or code
- Re-run tests to verify fixes

**3. Low Test Coverage**
- ⚠️ Add tests for uncovered code paths
- Review "Uncovered Line #s" in coverage report
- Write tests for critical business logic first

**4. Flaky Tests (Intermittent Failures)**
- Investigate timing issues (use `waitFor`, `findBy` queries)
- Check for race conditions
- Review async operations
- Add appropriate timeouts or retries

### Example Test Structure

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCard from './JobCard';

describe('JobCard Component', () => {
    const mockJob = {
        job_id: 1,
        job_title: 'Software Engineer',
        company: 'TechCorp'
    };

    test('renders job card with job details', () => {
        render(<JobCard job={mockJob} />);

        expect(screen.getByText('TechCorp')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    test('calls onClick when clicked', () => {
        const handleClick = jest.fn();
        render(<JobCard job={mockJob} onClick={handleClick} />);

        fireEvent.click(screen.getByText('TechCorp'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
```

---

## Backend Testing

### Testing Framework and Versions

The backend uses **pytest** with additional plugins for async support and mocking.

**Packages and Versions** (from `backend/requirements.txt`):
```
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-mock==3.12.0
```

**Key Testing Tools:**
- **pytest**: Python testing framework
- **pytest-asyncio**: Async/await support for pytest
- **pytest-mock**: Mocking support
- **FastAPI TestClient**: HTTP client for testing API endpoints

### Test File Locations

Test files are located in the `backend/tests/` directory:

```
backend/tests/
├── conftest.py                    # Pytest configuration and fixtures
├── test_ai_agent.py              # AI agent utility tests
├── test_calendar_api.py          # Calendar endpoint tests
├── test_config.py                # Configuration tests
├── test_contacts_api.py          # Contacts endpoint tests
├── test_conversion.py            # File conversion utility tests
├── test_convert_api.py           # Convert endpoint tests
├── test_database.py              # Database connection tests
├── test_date_helpers.py          # Date utility tests
├── test_directory.py             # Directory operations tests
├── test_export_api.py            # Export endpoint tests
├── test_file_helpers.py          # File helper utility tests
├── test_files_api.py             # File endpoint tests
├── test_jobs_api.py              # Jobs endpoint tests
├── test_letter_api.py            # Cover letter endpoint tests
├── test_logger.py                # Logger utility tests
├── test_main.py                  # Main application tests
├── test_notes_api.py             # Notes endpoint tests
├── test_personal_api.py          # Personal settings endpoint tests
├── test_reminder_api.py          # Reminder endpoint tests
└── test_resume_api.py            # Resume endpoint tests
```

**Naming Convention:** `test_*.py` (e.g., `test_jobs_api.py`)

### Pytest Configuration

**Configuration File:** `backend/pytest.ini`
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

**Default Options:**
- `-v`: Verbose output
- `--tb=short`: Short traceback format
- `--strict-markers`: Require markers to be registered

### Test Database Setup

Tests use a **separate test database** to avoid affecting production data.

**Test Database:** `postgresql://apiuser:change_me@psql.jobtracknow.com:5432/jobtracker_test`

**Fixtures** (from `conftest.py`):
- `test_engine`: Session-scoped database engine
- `test_db`: Function-scoped database session (fresh for each test)
- `client`: FastAPI TestClient with database override
- `temp_dir`: Temporary directory for file operations
- `sample_files`: Sample test files (txt, md, html)

**Note:** Each test gets a clean database - all tables are truncated before each test.

### Running Backend Tests

#### Prerequisites
Tests must be run from within the Docker container or with dependencies installed locally.

**Option 1: Run in Docker Container**
```bash
# Shell into the backend container
docker exec -it api.jobtracknow.com bash

# Navigate to app directory
cd /app
```

**Option 2: Run Locally (if not using Docker)**
```bash
cd backend
pip install -r requirements.txt  # Install dependencies first
```

**Important:** Ensure the test database exists:
```bash
# Inside the PostgreSQL container
docker exec -it psql.jobtracknow.com bash
psql -U apiuser -d postgres
CREATE DATABASE jobtracker_test;
\q
```

#### Test Execution Commands

**1. Run All Tests**
```bash
pytest
```

**2. Run All Tests with Verbose Output**
```bash
pytest -v
```

**3. Run Tests for a Specific File**
```bash
# Specific file
pytest tests/test_jobs_api.py

# With verbose output
pytest tests/test_jobs_api.py -v
```

**4. Run Tests for a Specific Directory**
Since all tests are in the `tests/` directory, you can run subsets by pattern:
```bash
# Run all API tests (files ending with _api.py)
pytest tests/test_*_api.py

# Run all utility tests (files NOT ending with _api.py)
pytest tests/test_*.py --ignore=tests/test_*_api.py
```

**5. Run a Specific Test Function or Class**
```bash
# Run specific test class
pytest tests/test_jobs_api.py::TestGetAllJobs

# Run specific test function
pytest tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_empty

# Run tests matching a pattern
pytest -k "test_get_all"
```

**6. Run Tests with Coverage Report**
```bash
# Install coverage tool first
pip install pytest-cov

# Run with coverage
pytest --cov=app --cov-report=html

# Run with coverage and terminal report
pytest --cov=app --cov-report=term-missing
```

**7. Run Tests and Stop on First Failure**
```bash
pytest -x
```

**8. Run Only Failed Tests from Last Run**
```bash
pytest --lf
```

**9. Run Tests with Markers**
```bash
# Run only slow tests
pytest -m slow

# Run all except slow tests
pytest -m "not slow"

# Run only integration tests
pytest -m integration
```

### Test Output Explanation

#### Successful Test Run
```
============================= test session starts ==============================
platform linux -- Python 3.12.0, pytest-7.4.3, pluggy-1.3.0 -- /usr/local/bin/python
cachedir: .pytest_cache
rootdir: /app
configfile: pytest.ini
testpaths: tests
plugins: asyncio-0.21.1, mock-3.12.0
collected 87 items

tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_empty PASSED    [  1%]
tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_multiple PASSED [  2%]
tests/test_jobs_api.py::TestCreateJob::test_create_job_success PASSED     [  3%]
tests/test_jobs_api.py::TestCreateJob::test_create_job_duplicate PASSED   [  4%]
...

============================== 87 passed in 12.34s ==============================
```

**Key Elements:**
- **collected X items**: Number of tests discovered
- **PASSED**: Individual test passed
- **[X%]**: Progress percentage
- **X passed in Xs**: Summary with execution time

#### Failed Test Run
```
============================= test session starts ==============================
...
collected 87 items

tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_empty PASSED    [  1%]
tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_multiple FAILED [  2%]

=================================== FAILURES ===================================
______________ TestGetAllJobs.test_get_all_jobs_multiple ______________________

self = <test_jobs_api.TestGetAllJobs object at 0x7f8b4c5d6e80>
client = <fastapi.testclient.TestClient object at 0x7f8b4c5d7100>
test_db = <sqlalchemy.orm.session.Session object at 0x7f8b4c5d7220>

    def test_get_all_jobs_multiple(self, client, test_db):
        """Test retrieving multiple active jobs."""
        response = client.get("/v1/jobs")

        assert response.status_code == 200
>       assert len(response.json()) == 3
E       AssertionError: assert 2 == 3
E        +  where 2 = len([{'job_id': 1, 'company': 'Google', ...}, {...}])
E        +    where [{'job_id': 1, 'company': 'Google', ...}, {...}] = <bound method Response.json of <Response [200]>>()

tests/test_jobs_api.py:31: AssertionError
=========================== short test summary info ============================
FAILED tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_multiple - AssertionError: assert 2 == 3
========================= 85 passed, 2 failed in 11.23s =========================
```

**Key Elements:**
- `FAILED`: Test failed
- `FAILURES`: Detailed failure information
- `AssertionError`: The assertion that failed
- `>`: Line where failure occurred
- `E`: Expected vs. actual values
- **short test summary info**: Quick summary of failures

#### Coverage Report Output
```
---------- coverage: platform linux, python 3.12.0-final-0 -----------
Name                              Stmts   Miss  Cover   Missing
---------------------------------------------------------------
app/__init__.py                       0      0   100%
app/api/calendar.py                 145     12    92%   78-82, 156-160
app/api/contacts.py                  98      5    95%   45-48
app/api/convert.py                  210     18    91%   156, 234-245
app/api/jobs.py                     187     10    95%   234, 267-275
app/core/config.py                   25      0   100%
app/core/database.py                 15      2    87%   23-24
app/models/models.py                125      0   100%
app/utils/ai_agent.py                89     15    83%   45-52, 78-85
app/utils/conversion.py             234     32    86%   67-72, 145-156, 234-245
---------------------------------------------------------------
TOTAL                              1852    124    93%

Coverage HTML written to dir htmlcov
```

**Coverage Metrics:**
- **Stmts**: Total number of statements
- **Miss**: Statements not executed during tests
- **Cover**: Coverage percentage
- **Missing**: Specific line numbers not covered

### Available Test Options

Common pytest CLI options:

```bash
# Verbose output (shows each test name)
pytest -v

# Very verbose output (shows more details)
pytest -vv

# Quiet mode (minimal output)
pytest -q

# Show local variables in tracebacks
pytest -l

# Stop after N failures
pytest --maxfail=2

# Run tests in parallel (install pytest-xdist first)
pytest -n auto

# Show print statements
pytest -s

# Show slowest 10 tests
pytest --durations=10

# Run specific markers
pytest -m slow
pytest -m "not slow"

# Generate JUnit XML report (for CI/CD)
pytest --junitxml=test-results.xml

# Run with coverage (install pytest-cov)
pytest --cov=app --cov-report=html
pytest --cov=app --cov-report=term-missing

# Dry run (collect tests without running)
pytest --collect-only

# Show test execution time for each test
pytest --durations=0

# Run tests that failed last time
pytest --lf

# Run failed tests first, then others
pytest --ff
```

### Handling Test Results

**1. All Tests Pass**
- ✅ Proceed with deployment or merge
- Review coverage report if generated
- Ensure coverage meets standards (>80% recommended)

**2. Tests Fail**
- ❌ Do NOT deploy or merge
- Review assertion errors and tracebacks
- Check database state if testing API endpoints
- Fix the failing tests or code
- Re-run specific failed tests: `pytest --lf`

**3. Database Connection Errors**
- Ensure test database exists: `jobtracker_test`
- Check database credentials in `conftest.py`
- Verify PostgreSQL container is running

**4. Import Errors**
- Ensure you're in the `/app` directory inside the container
- Check Python path: `export PYTHONPATH=/app`

**5. Async Test Failures**
- Ensure `pytest-asyncio` is installed
- Mark async tests with `@pytest.mark.asyncio`

### Example Test Structure

```python
import pytest
from unittest.mock import Mock, patch
from sqlalchemy import text

class TestGetAllJobs:
    """Test suite for GET /v1/jobs endpoint."""

    def test_get_all_jobs_empty(self, client, test_db):
        """Test retrieving jobs when none exist."""
        response = client.get("/v1/jobs")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_all_jobs_multiple(self, client, test_db):
        """Test retrieving multiple active jobs."""
        # Insert test data
        test_db.execute(text("""
            INSERT INTO job (company, job_title, job_status)
            VALUES ('Google', 'Engineer', 'applied')
        """))
        test_db.commit()

        response = client.get("/v1/jobs")

        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) == 1
        assert jobs[0]['company'] == 'Google'
```

---

## CI/CD Integration (Future)

This section outlines the planned integration of automated testing into a CI/CD pipeline using GitHub Actions.

### Overview

The CI/CD pipeline will:
1. Trigger on pull requests and pushes to main branches
2. Run frontend and backend tests in isolated Docker containers
3. Generate coverage reports
4. Block merges if tests fail
5. Publish test results and artifacts

### GitHub Actions Workflow

#### Workflow File Location
`.github/workflows/test.yml`

#### Proposed Workflow Configuration

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  # PostgreSQL test database configuration
  POSTGRES_USER: apiuser
  POSTGRES_PASSWORD: change_me
  POSTGRES_DB: jobtracker_test
  DATABASE_URL: postgresql://apiuser:change_me@localhost:5432/jobtracker_test

jobs:
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run tests with coverage
        working-directory: ./frontend
        run: npm test -- --coverage --watchAll=false --ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
          name: frontend-coverage

      - name: Archive test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-test-results
          path: |
            frontend/coverage/
            frontend/test-results/
          retention-days: 30

  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: apiuser
          POSTGRES_PASSWORD: change_me
          POSTGRES_DB: jobtracker_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y pandoc texlive-latex-base texlive-fonts-recommended

      - name: Install Python dependencies
        working-directory: ./backend
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest-cov

      - name: Wait for PostgreSQL
        run: |
          until pg_isready -h localhost -p 5432 -U apiuser; do
            echo "Waiting for PostgreSQL..."
            sleep 2
          done

      - name: Run tests with coverage
        working-directory: ./backend
        env:
          PYTHONPATH: /home/runner/work/job_tracker/job_tracker/backend
          DATABASE_URL: postgresql://apiuser:change_me@localhost:5432/jobtracker_test
        run: |
          pytest --cov=app --cov-report=xml --cov-report=html --junitxml=test-results.xml -v

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./backend/coverage.xml
          flags: backend
          name: backend-coverage

      - name: Archive test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: backend-test-results
          path: |
            backend/htmlcov/
            backend/test-results.xml
          retention-days: 30

      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: backend/test-results.xml
          check_name: Backend Test Results

  docker-integration-tests:
    name: Docker Integration Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker images
        run: |
          docker compose -f docker-compose-win.yml build

      - name: Start services
        run: |
          docker compose -f docker-compose-win.yml up -d
          sleep 30  # Wait for services to be ready

      - name: Check service health
        run: |
          docker compose -f docker-compose-win.yml ps
          curl --retry 5 --retry-delay 5 http://localhost:8000/docs

      - name: Run backend tests in container
        run: |
          docker compose -f docker-compose-win.yml exec -T backend pytest -v

      - name: Run frontend tests in container
        run: |
          docker compose -f docker-compose-win.yml exec -T frontend npm test -- --watchAll=false --ci

      - name: Collect logs
        if: failure()
        run: |
          docker compose -f docker-compose-win.yml logs > docker-logs.txt

      - name: Upload logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: docker-logs
          path: docker-logs.txt

      - name: Stop services
        if: always()
        run: |
          docker compose -f docker-compose-win.yml down -v

  combined-status-check:
    name: All Tests Passed
    runs-on: ubuntu-latest
    needs: [frontend-tests, backend-tests, docker-integration-tests]
    if: always()

    steps:
      - name: Check test results
        run: |
          if [ "${{ needs.frontend-tests.result }}" != "success" ] || \
             [ "${{ needs.backend-tests.result }}" != "success" ] || \
             [ "${{ needs.docker-integration-tests.result }}" != "success" ]; then
            echo "One or more test jobs failed"
            exit 1
          fi
          echo "All tests passed successfully"
```

### Docker Test Container Setup

#### Option 1: Using Existing Containers

Run tests in the existing frontend/backend containers:

```yaml
# In docker-compose.yml, add test commands
services:
  backend:
    # ... existing config ...
    command: /bin/bash -c "pytest -v && uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    # ... existing config ...
    command: /bin/bash -c "npm test -- --watchAll=false && npm start"
```

#### Option 2: Dedicated Test Container

Create a separate test container that runs tests without starting services:

```dockerfile
# Dockerfile.test (backend)
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    pandoc \
    texlive-latex-base \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install pytest-cov

COPY . .

ENV PYTHONPATH=/app

CMD ["pytest", "-v", "--cov=app", "--cov-report=term-missing"]
```

```dockerfile
# Dockerfile.test (frontend)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "test", "--", "--coverage", "--watchAll=false", "--ci"]
```

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: apiuser
      POSTGRES_PASSWORD: change_me
      POSTGRES_DB: jobtracker_test
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U apiuser"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend-test:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://apiuser:change_me@postgres-test:5432/jobtracker_test
      PYTHONPATH: /app
    volumes:
      - ./backend:/app
      - backend-test-results:/app/htmlcov

  frontend-test:
    build:
      context: ./frontend
      dockerfile: Dockerfile.test
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - frontend-test-results:/app/coverage

volumes:
  backend-test-results:
  frontend-test-results:
```

### Monitoring Test Progress

#### During GitHub Actions Run

1. **Navigate to Actions Tab**
   - Go to your GitHub repository
   - Click "Actions" tab
   - Select the running workflow

2. **View Real-Time Logs**
   - Click on the running job (e.g., "Backend Tests")
   - Expand steps to see live output
   - Watch test execution in real-time

3. **Check Progress Indicators**
   - Green checkmark: Step completed successfully
   - Yellow spinner: Step in progress
   - Red X: Step failed

#### Viewing Test Results

**Test Summary:**
- Automatically displayed in PR comments
- Shows passed/failed test counts
- Links to detailed results

**Coverage Reports:**
- View in Codecov dashboard
- Compare coverage changes between commits
- See uncovered lines highlighted

**Artifacts:**
- Download test results from Actions run
- Access HTML coverage reports
- Review JUnit XML for detailed test info

### Handling Test Failures

#### Automatic Failure Handling

**When Tests Fail:**
1. GitHub Actions job fails (red X)
2. PR status check shows failure
3. Merge button is blocked
4. Email/notification sent to committer

**Workflow Behavior:**
```yaml
# Continue on error (for reporting)
- name: Run tests
  run: pytest -v
  continue-on-error: false  # Default: fail immediately

# Or collect results even on failure
- name: Publish results
  if: always()  # Run even if previous steps failed
```

#### Manual Intervention Steps

**1. Review Failure Logs**
```bash
# In GitHub Actions UI
- Navigate to failed job
- Click on failed step
- Review error messages and stack traces
```

**2. Reproduce Locally**
```bash
# Pull the branch
git checkout feature-branch

# Run the same tests
cd backend
pytest -v

cd ../frontend
npm test -- --watchAll=false
```

**3. Fix and Re-Run**
```bash
# Fix the issue
# Commit changes
git add .
git commit -m "Fix failing tests"
git push

# GitHub Actions automatically re-runs on push
```

#### Stopping Deployments on Failure

**Branch Protection Rules:**

Configure in GitHub repository settings:

```
Settings → Branches → Branch protection rules → Add rule

Branch name pattern: main

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging

  Status checks:
  ☑ Frontend Tests
  ☑ Backend Tests
  ☑ Docker Integration Tests

☑ Require approvals: 1

☑ Dismiss stale pull request approvals when new commits are pushed
```

**Deployment Gates:**

```yaml
# In deployment workflow
jobs:
  deploy:
    needs: [frontend-tests, backend-tests]  # Wait for tests
    if: success()  # Only deploy if tests pass
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

### Configuration Settings

#### Environment Variables for CI/CD

**GitHub Secrets** (Settings → Secrets and variables → Actions):

```
DATABASE_URL
POSTGRES_USER
POSTGRES_PASSWORD
OPENAI_API_KEY
CODECOV_TOKEN
DOCKER_USERNAME
DOCKER_PASSWORD
```

**Repository Variables:**

```
NODE_VERSION=18
PYTHON_VERSION=3.12
COVERAGE_THRESHOLD=80
```

#### Pytest Configuration for CI

```ini
# pytest.ini (CI-specific options)
[pytest]
testpaths = tests
addopts =
    -v
    --tb=short
    --strict-markers
    --cov=app
    --cov-report=xml
    --cov-report=html
    --junitxml=test-results.xml
    --maxfail=5
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
```

#### Jest Configuration for CI

```json
// package.json
{
  "scripts": {
    "test": "react-scripts test",
    "test:ci": "react-scripts test --coverage --watchAll=false --ci --maxWorkers=2"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/index.js",
      "!src/reportWebVitals.js"
    ],
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Notifications and Reporting

#### Slack Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Tests failed on ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "❌ *Tests Failed*\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref }}\n*Author:* ${{ github.actor }}"
            }
          }
        ]
      }
```

#### Email Notifications

GitHub automatically sends emails for:
- Failed workflow runs
- First successful run after failures
- Manual workflow approvals needed

### Best Practices for CI/CD Testing

1. **Keep Tests Fast**
   - Run unit tests first (fast feedback)
   - Run integration tests separately
   - Use test parallelization

2. **Fail Fast**
   - Use `--maxfail` to stop after N failures
   - Run critical tests first

3. **Cache Dependencies**
   - Cache npm packages
   - Cache pip packages
   - Cache Docker layers

4. **Isolate Test Data**
   - Use separate test database
   - Clean data between tests
   - Use fixtures for consistent state

5. **Monitor Test Health**
   - Track test execution time
   - Identify flaky tests
   - Review coverage trends

6. **Security**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate credentials regularly

---

## Quick Reference

### Frontend Testing Quick Commands

```bash
# Run all tests
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific file
npm test -- JobCard.test.js --watchAll=false

# Run specific directory
npm test -- src/components --watchAll=false
```

### Backend Testing Quick Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=term-missing

# Run specific file
pytest tests/test_jobs_api.py

# Run specific test
pytest tests/test_jobs_api.py::TestGetAllJobs::test_get_all_jobs_empty

# Run failed tests only
pytest --lf
```

### Docker Testing Quick Commands

```bash
# Run backend tests in container
docker exec -it api.jobtracknow.com bash -c "cd /app && pytest -v"

# Run frontend tests in container
docker exec -it portal.jobtracknow.com sh -c "cd /app && npm test -- --watchAll=false"

# Run tests via docker compose
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## Support and Troubleshooting

### Common Issues

**Frontend:**
- **Issue:** Tests hang in watch mode
  - **Solution:** Use `--watchAll=false` flag

- **Issue:** Module not found errors
  - **Solution:** Run `npm install` to ensure dependencies are installed

**Backend:**
- **Issue:** Database connection errors
  - **Solution:** Ensure test database exists and PostgreSQL is running

- **Issue:** Import errors (ModuleNotFoundError)
  - **Solution:** Set `export PYTHONPATH=/app` or run from `/app` directory

**CI/CD:**
- **Issue:** Tests pass locally but fail in CI
  - **Solution:** Check environment variables, ensure test database is created

- **Issue:** Timeout errors in CI
  - **Solution:** Increase timeouts, check resource constraints

### Getting Help

- Review test output and error messages carefully
- Check test logs in GitHub Actions
- Consult the CLAUDE.md file for project-specific guidance
- Review pytest/Jest documentation for framework-specific issues

---

**Document Version:** 1.0
**Last Updated:** 2025-12-14
**Maintainer:** Development Team
