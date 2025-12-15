# Job Tracker Application

A comprehensive job tracking application built with a React frontend, FastAPI backend, and PostgreSQL database. This 
full-stack application helps you manage job opportunities throughout the hiring process with features for tracking 
applications, managing contacts, scheduling interviews, and organizing notes.

## 🏗️ Architecture Overview

The Job Tracker is built as a **3-tier containerized application**:

### **Frontend Service** (React + Nginx)
- **Technology**: React 18 with TypeScript-style components
- **Features**: Responsive UI, real-time search, drag-and-drop job management
- **URL**: http://portal.jobtracker.com or http://localhost
- **Purpose**: User interface for interacting with job data

### **Backend Service** (FastAPI + Python)
- **Technology**: FastAPI with SQLAlchemy ORM
- **Features**: RESTful API, automatic documentation, data validation
- **URL**: http://api.jobtracker.com or http://localhost:8000
- **Purpose**: Business logic and database operations

### **Database Service** (PostgreSQL)
- **Technology**: PostgreSQL 15 with persistent storage
- **Features**: Relational data storage, ACID compliance
- **URL**: http://psql.jobtracker.com:5432 or http://localhost:5432
- **Purpose**: Data persistence and complex querying

## 🚀 Quick Start with Docker

### Prerequisites

- **Docker** (v20.10+) or **Docker Desktop** (4.43.2)
- **Docker Compose** (v2.0+)  (Included in Docker Desktop)
- **Git** (for cloning the repository or you can just download the zip file)
- **OpenAI Key** (for customizing resume/cover letters)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone git@github.com:dwalbeck/job_tracker.git
   cd job_tracker
   ```

2. **Configure Environment Variables**
   ```bash
   cp ./backend/.env.example ./backend/.env
   cp ./frontend/.env.example ./frontend/.env
   # Edit .env files with the settings you want
   ```
3. **Customize Configuration**
    ```bash
   # Use your preferred editor to add/change settings
   vim ./backend/.env
   
   # Windows and MacOS users need to change to the following:
   DATABASE_URL=postgresql://apiuser:change_me@db:5432/jobtracker
   POSTGRES_HOST=db 
   
   # Make sure to add your OpenAI API key
   OPENAI_API_KEY=change_this_to_your_key
   
   vim ./frontend/.env
   
   # Windows and MacOS users make the following change:
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

4. **Build and Start All Services**
   ```bash
   # Linux production setup
   docker compose up --build -d

   # Or for Windows OS and MacOS
   docker compose -f docker-compose-win.yml up --build
   ```
5. **Edit DNS Routing**
    ```bash
   # Skip this step for Windows and MacOS
   echo "172.20.0.5      portal.jobtracker.com
   172.20.0.10     api.jobtracker.com
   172.20.0.15     psql.jobtracker.com" >> /etc/hosts
   
   # this will effectively return these values upon DNS request for the sub-domains defined
    ```

6. **Verify Services are Running**
   ```bash
   docker compose ps
   
   # You should see the following:
   api.jobtracker.com      job_tracker-backend    "python -m uvicorn a…"   backend    18 minutes ago   Up 18 minutes (healthy)   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
   portal.jobtracker.com   job_tracker-frontend   "/usr/local/bin/dock…"   frontend   18 minutes ago   Up 18 minutes (healthy)   443/tcp, 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 3000/tcp
   psql.jobtracker.com     postgres:12            "docker-entrypoint.s…"   db         18 minutes ago   Up 18 minutes (healthy)   5432/tcp
   ```

7. **Access the Application**
   - **Frontend**: http://portal.jobtracker.com
   - **Backend API**: http://api.jobtracker.com
   - **API Documentation**: http://api.jobtracker.com/docs
   - **Database**: postgresql://apiuser:change_me@psql.jobtracker.com:5432/jobtracker

    or for Windows and MacOS use:
   - **Frontend**: http://localhost (preferred) or http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Database**: postgresql://apiuser:change_me@localhost:5432/jobtracker
   

NOTE: For **Windows** and **Mac** users, network interfaces work a bit differently then they do on Linux, and as such are not 
able to do aliasing or virtual addressing, which is used by Docker for some networking capabilities.  The short version 
is that this means you can't use a fake domain name for accessing things.  No biggie, just use the correct port and 
the domain name **localhost**.

## 🔄 Usage

### First Steps

* You should fill in your personal information before doing anything, as that information is used in file naming and for 
document creation.  This is done by selecting the **Personal** left side navigation option.
* You'll need to upload a baseline resume, which can be formatted as odt, docx, pdf or html, although I strongly suggestion 
that your format it as docx.  A baseline resume is the starting point, which is modified to cater to a job posting. 
You can create a baseline resume by selecting the **Resume** menu option in the left side navigation menu.
* While not required, I recommend editing your converted resume (which will be in markdown formatting) to insure 
that it is styled the way you want.

### Job Posting

The Job Posting page is the main page that you'll use.  Here you will add new jobs, which are automatically placed in 
the **Applied** column.  You can drag and drop each card to any column you want.  Each of the four columns keeps a 
count at the top for reference.  When using the search box, you'll notice that with each letter typed non-matching cards 
are removed.  Each card displays the time difference between when it was created and now, as well as the difference 
from the last contact.  Job scoring is based on two things, the **interest level** and **outcome score** from an 
interview, which is averaged for the score value.

Clicking on any card will take you to the Job Details page, where you have a summary of job information entered when you 
created the job. Once you customize a resume for the job, you'll additionally see some stats. **Keywords** are skills 
or technologies, found in your resume and the job posting description. Keywords can also become **Focused Keywords**, 
which are basically the same things, but given a bit more attention when rewriting your resume. The **Baseline Score** 
is the percentage of matching keywords from your baseline resume and the job posting.  Your **Rewrite Score** is the 
percentage after your resume has be rewritten.  You can also add and view calendar appointments, contacts, reminders 
and notes that are specifically related to the job posting.  You can also edit or delete the job posting.

### Resume

You can optimize your resume from the Job Details page by clicking on the **Optimize Resume** button.  You'll notice 
that to the left of that button is the baseline resume that will be used (your selected default), but should you wish 
to use a different one, simply click on it and select the one you want to use. The application will then pull the 
qualifications from the job posting and grab all the keywords from it.  This is then displayed on the next page and 
each keyword is highlighted in orange. Click on it once to make it a "focused keyword" and once more to remove it from 
being selected.  You can also select non-highlighted word(s) to add them as keywords.  Once your happy with the 
keywords, click **Finalize** to have it start rewriting your resume. Depending on the LLM model chosen, this can 
take a while to complete, so be patient.  Upon completion, you be shown your baseline resume on the left and rewritten 
resume on the right.  Changes are highlighted in green on the right, and items removed are shown highlighted in 
orange on the left side. Click on any highlighted text to remove it and revert it back to it's original state. Finally, 
click **Accept Changes** and your resume is complete and ready to be downloaded, which you can do from the Job Details page.

The Resume section, is for managing all your resumes, which are separated into two groups - **Baseline** and **Customized 
for Jobs**.  Regardless of the file format for a resume you upload, it is converted into a markdown version. This makes 
it easier for the LLM models to interact with, and you can directly edit the markdown for baseline resumes.  Resumes can 
be **cloned** (copied) or deleted and the **Tailor** option let's you re-pick the keywords you want applied and then rewrites 
the resume again (overwriting the previous version).

### Cover Letter

On the Job Details page, you can select the **Create Cover Letter** button to generate a cover letter specific for that 
job posting. You can select the length that you want it, as well as the overall tone of the letter.  You also have the 
option to type in any additional instruction that you want included, for example: "Make three bullet points with examples 
on why I'm the best fit for this job". You can generate or re-generate cover letters at will.

### And the Rest

The Contacts, Calendar and Notes pages are all pretty self-explanatory and intuitive to use.  On the Calendar pages, 
there will be a green dot on interviews that you have updated with an outcome score.  This is so you can easily view 
if you missed scoring an appointment. 

For the sections **Job Posting**, **Contacts**, **Calendar**, **Notes** and **Resume** you have the ability to export 
all the records from the DB, for whatever reason.  You can do this by clicking on the 3 dot collapsed menu icon on 
the top right of the page and then selecting the export option.  This will dump the DB contents to a CSV file that will 
automatically start downloading upon selection.

In the **Personal** section, you can customize a few things.  There is the **Auto Status Change** setting, which is 
the number of weeks of no contact before a job card is moved to the "No Response" column. You also have the fields 
**Job Extraction LLM**, **Resume Rewrite LLM** and **Cover Letter LLM** - where you can specify which OpenAI LLM model 
to use for that action.


## 📋 Service Details

### 🖥️ Frontend Service (`job_tracker_frontend`)

**What it does:**
- Serves the React application through Nginx
- Provides the user interface for all job tracking features
- Handles client-side routing and state management

**How it works:**
1. **Build Stage**: Compiles React app with optimizations
2. **Serve Stage**: Nginx serves static files with compression and caching
3. **Communication**: Makes HTTP requests to backend API proxied through nginx

**Key Features:**
- Job management with drag-and-drop interface
- Contact management and relationship tracking
- Calendar scheduling for interviews and reminders
- Notes and document organization
- Real-time search and filtering
- Resume customization and management
- Cover letter generation

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
- **Resume**: Resume baselines and job specific rewrites
- **Letter**: Cover letter management for applications
- **Convert**: Handles conversions of file formatting
- **Export**: Data exporter dumping the DB

### 🗄️ Database Service (`job_tracker_db`)

**What it does:**
- Stores all application data in PostgreSQL tables
- Provides ACID compliance for data integrity
- Handles complex queries and relationships

**How it works:**
1. **Initialization**: Automatically runs schema.sql on first startup
2. **Data Storage**: Persistent storage using Docker volumes
3. **Connections**: Accepts connections from backend service and is mapped to localhost:5432


## 🔄 Service Communication Flow

See flow chart in located in **docs/job_tracker-communication_flow.pdf**


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

### Backend Environment Variables

Create a `.env` file to customize:

```bash
# Database Configuration
DATABASE_URL=postgresql://apiuser:change_me@psql.jobtracker.com:5432/jobtracker
POSTGRES_HOST=psql.jobtracker.com
POSTGRES_PASSWORD=change_me
POSTGRES_USER=apiuser
POSTGRES_DB=jobtracker
POSTGRES_PORT=5432
PGDATA=/var/lib/postgresql/data
POSTGRES_HOST_AUTH_METHOD=password

# Application Configuration
APP_NAME=Job Tracker API
APP_VERSION=1.0.0
DEBUG=True

# File Storage Configuration
BASE_JOB_FILE_PATH=/app/job_docs
RESUME_DIR=/app/job_docs/resumes
COVER_LETTER_DIR=/app/job_docs/cover_letters
EXPORT_DIR=/app/job_docs/export

# Logging Configuration
LOG_LEVEL=DEBUG
LOG_FILE=api.log

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://portal.jobtracker.com:3000"]

# AI Configuration
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=<open_ai_api_key>
OPENAI_PROJECT=<open_ai_project_name>
```

### Frontend Environment Variables

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://api.jobtracker.com

# Logging Configuration
REACT_APP_LOG_LEVEL=DEBUG
REACT_APP_LOG_FILE=portal.log
REACT_APP_ENABLE_CONSOLE_LOGGING=true

NODE_ENV=production
```


## 🗂️ Data Persistence

### Volumes

- **postgres_data**: Database files persist across container restarts
- **job_docs**: Job-specific document directories

### Backup and Restore

```bash
# Backup
docker compose exec db pg_dump -U apiuser job_tracker > backup.sql

# Restore
docker compose exec -T db psql -U apiuser job_tracker < backup.sql
```

## 🛠️ Logging

### Docker

So you are able to view the Docker logs using your terminal as follows:

```bash
# View logs from all services
docker compose logs

# Continual log output
docker compose logs -f

# Show only frontend service logs
docker compose logs frontend

# Show only backend service logs
docker compose logs backend

# Show only database logs
docker compose logs db
```


### Back-end API

The Python application is using a logger package to ouput logs to a log file that is written locally within the container.  You 
can access this log file by opening a terminal session into the container, where you can then view a file however you like. After 
the shell connection is established, you should be placed in the document root for the service, which is **/app**. The log 
file is named **api.log**

```bash
docker exec -it api.jobtracker.com bash

# You shouldn't need to do this, but in case wondered off and got lost
cd /app

# View last 30 lines
tail -n 30 api.log

# Continually view log file
tail -f api.log

# Open the log file in a text editor
vim api.log 
```

### Front-end Application

The React application also is setup to log things, but uses the browsers local storage to write the logs to.  You can access 
the logs using your browser's inspect tool.  For Firefox and Chrome, right-click anywhere on the page, then select "Inspect(Q)". 
This will open the developer tools and on the top tab navigation select the "Console" tab. At the bottom of the displayed output, 
you'll see either a ">" or ">>", which when you click there, it then allows you to execute any javascript.

```console
// View all logs
logger.getLogs()

// Download logs as a text file
logger.exportLogs()

// Clear all logs
logger.clearLogs()

// Log a test message
logger.debug('Test message')

    Or Use Direct localStorage Access (Works Immediately)

// View logs
JSON.parse(localStorage.getItem('portal.log'))

// Clear logs
localStorage.removeItem('portal.log')
```


## 🚨 Troubleshooting

### Common Issues
* **Page not found** or just won't load. So I didn't want to mess around with SSL certificates, which self-signed certs still 
    have to be manually added or accepted in order to work.  This application doesn't store anything secret, so there isn't any 
    need to do big security implementations.  This being the case, access to the services uses standard non-encrypted HTTP. You 
    may find that your browser has automatically added the "S", which won't work, as the application isn't configured to use 
    SSL.  So verify that your using **http://** and NOT **https://**

    If you still are having issues, verify that all 3 services are actively running.  More than likely you'll find that one failed to start. Still 
    can't pull up the page?  Try looking at the logs files, they can provide some insight.

* **Port Conflicts**  Insure that you don't have a locally installed version of PostgreSQL or another container 
    running with PostgreSQL installed on it.  Also make sure that you don't have a local install of Apache2 or Nginx 
    running, as by default they both bind to port 80 and likely other additional ports.
   ```bash
   # Check what's using ports (Linux and MacOS)
   lsof -i :80
   lsof -i :8000
   lsof -i :3000
   lsof -i :5432
  
   # On Windows you can execute the following from terminal or powershell
   netstat -aon | findstr :80
   netstat -aon | findstr :8000
   netstat -aon | findstr :3000
   netstat -aon | findstr :5432
   # The last column displayed should be the process ID number or PID. Execute the following to find the program:
   tasklist | findstr <PID>
   ```
* **Database apiuser can't authenticate** If you wisely decided to change the default password to use 
    your own given password, it was the smart thing to do, however the Docker PostgreSQL image didn't 
    seem to always set the apiuser password correctly.  This being the case, I added setting the password 
    directly to the DB schema SQL that gets executed on creation.  So it's quite likely that the apiuser 
    got set with the password of "change_me", but since you changed the password, it's trying to connect 
    with a different value. I apologize for not flushing that out more, but it's an easy fix. Execute 
    the following from a terminal, which will shell into the DB container, where you can change the password.
    ```bash
    # first we need to get some information.  Make sure your Docker stack is currently running, and from a terminal type this:
    docker ps
  
    # Note the first column displayed CONTAINER ID - You'll need this value for the container with the 
    # IMAGE set as "postgres:15.15-trixie".  Now with this value we can shell into the container with the following:
    docker exec -it <container_id> bash
    
    # Now your in the database container with a terminal, so we'll need to connect to the PostgreSQL service 
    psql -U apiuser jobtracker
    
    # That connects to PostgreSQL using their console.  No password is needed because the image sets local connections to "trust".
    # So now you'll simply change the password for that role to whatever you have configured in the backend/.env file
    jobtracker=# ALTER ROLE apiuser WITH PASSWORD '<your_password>';
    ```
* **Database - User authentication fails** If you find that the credentials are failing to authenticate, then you can reset 
    them pretty easily (if the DB container is able to run).  Start up the Docker stack and then we'll shell into the database 
    container and execute the SQL to set the credentials.
    ```bash
    # First let's shell into the PostgreSQL database container
    docker exec -it psql.jobtracker.com bash
  
    # Next we'll login to the database using the PostgreSQL console
    # NOTE: no password is needed, as the DB is configured to trust local connections.
    psql -U apiuser jobtracker
  
    # Now we'll simply overwrite any existing password with a new value
    ALTER ROLE apiuser WITH PASSWORD '<password>';
  
    # If the apiuser account didn't get created, then you can try to login as root
    psql -U root jobtracker
    CREATE ROLE apiuser LOGIN INHERIT PASSWORD '<password>';
    ```

* **Database Connection Issues**
   ```bash
   # First check if the Database is running
   docker compose ps
   # Look at the STATUS column, and make sure it says "Up"
  
   # Check database logs for some type of error that is happening
   docker compose logs db
   # correct the error. with so many possible issues, it's impossible to list them all here, but google is your friend

   # Restart database
   docker compose restart db
   ```
* **Frontend Build Issues** You can force a complete rebuilding of every layer, which can overwrite some problems encountered
   ```bash
   # Rebuild frontend
   docker compose build --no-cache frontend
  
   # For Windows and MacOS users, do the following
   docker compose -f docker-compose-win.yml build --no-cache frontend
   ```

* **Backend Build Issues** You can force a complete rebuilding of every layer, which can overwrite some problems encountered
   ```bash
   # Rebuild backend
   docker compose build --no-cache backend
  
   # For Windows and MacOS users, do the following
   docker compose -f docker-compose-win.yml build --no-cache backend

* **Reset Everything**
    ```bash
    # Stop all services
    docker compose down
    
    # Remove volumes (WARNING: This deletes all data)
    docker compose down -v
    
    # Rebuild from scratch
    docker compose up --build
    ```

## 🎯 Tips

* Conversion between file formats is never 100% and whatever format you upload your first baseline resume in matters. I've 
found that if it's formatted as **docx**, that file conversion works best.  Regardless of the format it needs to be 
converted to markdown, which works better with the LLM models. 
* Your original resume file is also used as a template for formatting your modified resume (if downloading the docx format)
* After your original resume has been formatted to markdown, I recommend manually editing the markdown to insure it's 
formatted as you want.
* Play around with using different language models, as you'll notice a big difference in the time it takes to execute 
between the different versions.  You can change the LLM used for different operations in the **Personal** section

## 📚 API Documentation

Once running, visit:
- **Interactive API Docs**: http://api.jobtracker.com or http://localhost:8000/docs

## 🧪 Testing

```bash
# Test backend endpoints
curl http://api.jobtracker.com/health
curl http://localhost:8000/health

# Test frontend
curl http://portal.jobtracker.com
curl http://localhost

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