# Job Tracker Application

A comprehensive job tracking application built with a React frontend, FastAPI backend, and PostgreSQL database. This full-stack application helps you manage job opportunities throughout the hiring process with features for tracking applications, managing contacts, scheduling interviews, and organizing notes.

## 🏗️ Architecture Overview

The Job Tracker is built as a **3-tier containerized application**:

### **Frontend Service** (React + Nginx)
- **Technology**: React 18 with TypeScript-style components
- **Features**: Responsive UI, real-time search, drag-and-drop job management
- **Port**: 3000
- **Purpose**: User interface for interacting with job data

### **Backend Service** (FastAPI + Python)
- **Technology**: FastAPI with SQLAlchemy ORM
- **Features**: RESTful API, automatic documentation, data validation
- **Port**: 8000
- **Purpose**: Business logic and database operations

### **Database Service** (PostgreSQL)
- **Technology**: PostgreSQL 15 with persistent storage
- **Features**: Relational data storage, ACID compliance
- **Port**: 5432
- **Purpose**: Data persistence and complex querying

## 🚀 Quick Start with Docker

### Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git** (for cloning the repository)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd job_tracker
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env if you want to customize any settings
   ```

3. **Build and Start All Services**
   ```bash
   # Production setup (recommended)
   docker-compose up --build -d

   # Or for development with hot reload
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

4. **Verify Services are Running**
   ```bash
   docker-compose ps
   ```

5. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Database**: localhost:5432 (for external connections)

## 📋 Service Details

### 🖥️ Frontend Service (`job_tracker_frontend`)

**What it does:**
- Serves the React application through Nginx
- Provides the user interface for all job tracking features
- Handles client-side routing and state management

**How it works:**
1. **Build Stage**: Compiles React app with optimizations
2. **Serve Stage**: Nginx serves static files with compression and caching
3. **Communication**: Makes HTTP requests to backend API at port 8000

**Key Features:**
- Job management with drag-and-drop interface
- Contact management and relationship tracking
- Calendar scheduling for interviews
- Notes and document organization
- Real-time search and filtering

### ⚙️ Backend Service (`job_tracker_backend`)

**What it does:**
- Provides RESTful API endpoints for all data operations
- Handles business logic and data validation
- Manages database connections and transactions

**How it works:**
1. **Database Wait**: Waits for PostgreSQL to be ready before starting
2. **API Server**: FastAPI serves endpoints with automatic validation
3. **ORM Operations**: SQLAlchemy manages database interactions
4. **File Management**: Creates job-specific directories for documents

**API Endpoints:**
- **Jobs**: CRUD operations for job tracking
- **Contacts**: Contact management with job relationships
- **Calendar**: Interview scheduling and appointment management
- **Notes**: Job-related notes and documentation

### 🗄️ Database Service (`job_tracker_db`)

**What it does:**
- Stores all application data in PostgreSQL tables
- Provides ACID compliance for data integrity
- Handles complex queries and relationships

**How it works:**
1. **Initialization**: Automatically runs schema.sql on first startup
2. **Data Storage**: Persistent storage using Docker volumes
3. **Connections**: Accepts connections from backend service
4. **Backup**: Data persists across container restarts

**Database Schema:**
- `job`: Job applications and tracking information
- `contact`: Recruiter and company contact details
- `calendar`: Interview appointments and scheduling
- `note`: Job-related notes and documentation
- `job_contact`: Many-to-many job-contact relationships

## 🔄 Service Communication Flow

```
User Browser → Frontend (React) → Backend (FastAPI) → Database (PostgreSQL)
     ↑              ↓                    ↓                    ↓
  Port 3000      Port 8000           Port 5432         Persistent Volume
```

1. **User Interaction**: User interacts with React frontend at localhost:3000
2. **API Requests**: Frontend makes HTTP requests to backend at localhost:8000
3. **Data Processing**: Backend validates requests and queries PostgreSQL
4. **Database Operations**: PostgreSQL processes queries and returns data
5. **Response Chain**: Data flows back through backend to frontend to user

## 🛠️ Development Workflow

### For Frontend Development

```bash
# Start with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up frontend

# Or develop locally
cd frontend
npm install
npm start
```

### For Backend Development

```bash
# Start with code reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend

# Or develop locally
cd backend
pip install -r requirements.txt
python run.py
```

### Database Access

```bash
# Connect to database container
docker-compose exec db psql -U apiuser -d job_tracker

# View logs
docker-compose logs db

# Backup database
docker-compose exec db pg_dump -U apiuser job_tracker > backup.sql
```

## 📊 Monitoring and Health Checks

### Service Health

Each service includes health checks:

```bash
# Check all service status
docker-compose ps

# View service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db

# Monitor in real-time
docker-compose logs -f
```

### Health Endpoints

- **Backend Health**: http://localhost:8000/health
- **Frontend Health**: http://localhost:3000 (returns React app)
- **Database Health**: Automatic Docker health check

## 🔧 Configuration Options

### Environment Variables

Create a `.env` file to customize:

```bash
# Database Configuration
POSTGRES_DB=job_tracker
POSTGRES_USER=apiuser
POSTGRES_PASSWORD=your_secure_password

# Backend Configuration
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
```

### Port Configuration

Default ports can be changed in `docker-compose.yml`:
- Frontend: `3000:3000`
- Backend: `8000:8000`
- Database: `5432:5432`

## 🗂️ Data Persistence

### Volumes

- **postgres_data**: Database files persist across container restarts
- **job_docs**: Job-specific document directories

### Backup and Restore

```bash
# Backup
docker-compose exec db pg_dump -U apiuser job_tracker > backup.sql

# Restore
docker-compose exec -T db psql -U apiuser job_tracker < backup.sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs db

   # Restart database
   docker-compose restart db
   ```

3. **Frontend Build Issues**
   ```bash
   # Rebuild frontend
   docker-compose build --no-cache frontend
   ```

### Reset Everything

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Rebuild from scratch
docker-compose up --build
```

## 📚 API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Test backend endpoints
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000

# Test database connection
docker-compose exec db pg_isready -U apiuser
```

## 🔒 Security Considerations

- Database password should be changed from default
- Backend runs as non-root user
- Frontend uses security headers via Nginx
- CORS is configured for specific origins only

## 🎯 Production Deployment

For production deployment:

1. **Update Environment Variables**
   - Change database password
   - Set DEBUG=false
   - Configure proper CORS origins

2. **Use Production Compose File**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Set up Reverse Proxy**
   - Use Nginx or similar for SSL termination
   - Configure domain names and certificates

## 📄 License

This project is for educational/personal use.