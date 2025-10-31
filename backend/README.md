# Job Tracker Backend API

A FastAPI-based backend service for the Job Tracker application.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **PostgreSQL Database**: Robust relational database with SQLAlchemy ORM
- **RESTful API**: Complete CRUD operations for jobs, contacts, calendar, and notes
- **Automatic Documentation**: Interactive API docs at `/docs`
- **CORS Support**: Configured for frontend integration
- **Pydantic Validation**: Request/response validation and serialization

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database
- Virtual environment (recommended)

### Installation

1. Create and activate virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Configure database:
   - Create PostgreSQL database named `job_tracker`
   - Run the schema.sql file to create tables

### Running the Application

```bash
python run.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## API Endpoints

### Jobs
- `DELETE /v1/job/{job_id}` - Soft delete job
- `GET /v1/job/{job_id}` - Get single job
- `GET /v1/job/list` - Get job list for dropdowns
- `POST /v1/job` - Create or update job

### Contacts
- `POST /v1/contact` - Create or update contact
- `DELETE /v1/contact/{contact_id}` - Soft delete contact
- `GET /v1/contact/{contact_id}` - Get single contact with linked jobs
- `GET /v1/contacts` - Get all contacts (with optional job filter)

### Calendar
- `GET /v1/calendar/month` - Get monthly appointments
- `GET /v1/calendar/week` - Get weekly appointments
- `GET /v1/calendar/day` - Get daily appointments
- `POST /v1/calendar` - Create or update appointment

### Notes
- `GET /v1/notes` - Get all notes (with optional job filter)
- `POST /v1/notes` - Create or update note
- `DELETE /v1/note/{note_id}` - Soft delete note

## Project Structure

```
backend/
├── app/
│   ├── api/           # API route handlers
│   ├── core/          # Core configuration
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── utils/         # Utility functions
│   └── main.py        # FastAPI application
├── requirements.txt   # Dependencies
├── run.py            # Application runner
└── README.md         # This file
```

## Database Schema

The application uses the PostgreSQL schema defined in `docs/schema.sql` with tables for:
- Jobs and job tracking
- Contacts and relationships
- Calendar appointments
- Notes and documentation
- Resume and cover letter tracking
- Communication history

## Development

### Code Organization

- **Models**: SQLAlchemy ORM models in `app/models/`
- **Schemas**: Pydantic models for request/response validation
- **API Routes**: Organized by feature in `app/api/`
- **Database**: Connection and session management in `app/core/`
- **Utilities**: Helper functions for directory management and date handling

### Best Practices

- Soft deletes for data integrity
- Proper HTTP status codes
- Input validation with Pydantic
- Structured error handling
- CORS configuration for frontend integration
- Environment-based configuration