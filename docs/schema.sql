

CREATE DATABASE jobtracker;

CREATE TYPE title AS ENUM ('recruiter', 'hiring manager', 'hr', 'engineer', 'vp', 'other');
CREATE TYPE job_status AS ENUM ('applied', 'interviewing', 'rejected', 'no response');
CREATE TYPE appt AS ENUM ('phone call', 'interview', 'on site', 'technical');
CREATE TYPE comm AS ENUM ('phone', 'email', 'sms', 'message');
CREATE TYPE file_fmt AS ENUM ('pdf', 'odt', 'md', 'html', 'docx');
CREATE TYPE content_length AS ENUM ('short', 'medium', 'long');
CREATE TYPE content_tone AS ENUM ('professional', 'casual', 'enthusiastic', 'informational');

CREATE TABLE IF NOT EXISTS resume (
    resume_id               serial NOT NULL,
	baseline_resume_id      int DEFAULT NULL REFERENCES resume (resume_id) ON DELETE RESTRICT ON UPDATE CASCADE,
	job_id                  int DEFAULT NULL REFERENCES job (job_id) ON DELETE SET NULL ON UPDATE CASCADE,
	original_format         file_fmt NOT NULL,
	resume_title            varchar(128) NOT NULL,
    file_name               varchar(128) DEFAULT NULL,
	is_baseline             boolean NOT NULL DEFAULT false,
	is_default              boolean NOT NULL DEFAULT false,
	is_active               boolean NOT NULL DEFAULT true,
    resume_created          timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	resume_updated          timestamp(0) without time zone DEFAULT NULL,
	UNIQUE (file_name),
    PRIMARY KEY (resume_id)
);

CREATE TABLE IF NOT EXISTS resume_detail (
    resume_id               int NOT NULL REFERENCES resume (resume_id) ON DELETE CASCADE ON UPDATE CASCADE,
    resume_markdown         text,
	resume_md_rewrite       text,
    resume_html             text,
	resume_html_rewrite     text,
	position_title          varchar(128) DEFAULT NULL,
	title_line_no           smallint DEFAULT NULL,
	keyword_count           smallint,
	resume_keyword          varchar(128)[],
	keyword_final           varchar(128)[],
	focus_count             smallint,
	focus_final             varchar(128)[],
	baseline_score          smallint DEFAULT NULL,
	rewrite_score           smallint DEFAULT NULL,
	rewrite_file_name       varchar(128) DEFAULT NULL,
	suggestion              text[],
    PRIMARY KEY (resume_id)
);

CREATE TABLE IF NOT EXISTS cover_letter (
    cover_id                serial NOT NULL,
	resume_id               int NOT NULL REFERENCES resume (resume_id) ON DELETE CASCADE ON UPDATE CASCADE,
	job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
	letter_length           content_length NOT NULL DEFAULT 'medium',
	letter_tone             content_tone NOT NULL DEFAULT 'professional',
	instruction             text NOT NULL,
    letter_content          text NOT NULL,
    file_directory          varchar(255),
    file_name               varchar(128),
	letter_active           boolean NOT NULL DEFAULT true,
    letter_created          timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cover_id)
);

CREATE TABLE IF NOT EXISTS job (
    job_id                  serial NOT NULL,
    company                 varchar(64),
    job_title               varchar(255),
    salary                  varchar(92),
    location                varchar(128),
    interest_level          smallint NOT NULL DEFAULT 1,
	average_score           numeric(4, 3) NOT NULL DEFAULT 1,
    posting_url             text,
    apply_url               text,
    job_status              job_status NOT NULL DEFAULT 'applied',
    date_applied            date DEFAULT NULL,
    last_activity           date NOT NULL DEFAULT CURRENT_DATE,
    job_active              boolean NOT NULL DEFAULT true,
    resume_id               int DEFAULT NULL REFERENCES resume (resume_id) ON DELETE SET NULL ON UPDATE CASCADE,
    cover_id                int DEFAULT NULL REFERENCES cover_letter (cover_id) ON DELETE SET NULL ON UPDATE CASCADE,
    job_created             timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    job_directory           varchar(255),
    CHECK (interest_level > 0 AND interest_level < 11),
    PRIMARY KEY (job_id)
);
CREATE INDEX IF NOT EXISTS job_job_status_idx ON job (job_status);
CREATE INDEX IF NOT EXISTS job_last_contact_idx ON job (last_contact);

CREATE TABLE IF NOT EXISTS job_detail (
	job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
	job_desc                text,
	job_qualification       text,
	job_keyword             varchar(128)[],
	PRIMARY KEY (job_id)
);

CREATE TABLE IF NOT EXISTS contact (
    contact_id              serial NOT NULL,
    first_name              varchar(92),
    last_name               varchar(92),
    job_title               varchar(128) DEFAULT NULL,
    email                   varchar(255),
    phone                   varchar(24),
    company                 varchar(64),
    linkedin                varchar(255) DEFAULT NULL,
	location                varchar(128) DEFAULT NULL,
    contact_note            text,
    contact_active          boolean NOT NULL DEFAULT true,
		contact_created         date NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (contact_id)
);

CREATE TABLE IF NOT EXISTS job_contact (
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    contact_id              int NOT NULL REFERENCES contact (contact_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id, contact_id)
);
CREATE INDEX IF NOT EXISTS job_contact_contact_id_idx ON job_contact (contact_id);

CREATE TABLE IF NOT EXISTS note (
    note_id                 serial NOT NULL,
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    note_title              varchar(255),
    note_content            text,
    note_active             boolean NOT NULL DEFAULT true,
    note_created            timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id)
);

CREATE TABLE IF NOT EXISTS calendar (
    calendar_id             serial NOT NULL,
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    calendar_type           appt NOT NULL DEFAULT 'interview',
    start_date              date,
    start_time              time,
    end_date                date,
    end_time                time,
    duration_hour           numeric(4, 2),
    participant             varchar(192)[],
    calendar_desc           text,
    calendar_note           text,
    outcome_score           smallint DEFAULT NULL,
    outcome_note            text,
    video_link              varchar(255),
    PRIMARY KEY (calendar_id)
);
CREATE INDEX IF NOT EXISTS calendar_start_date_idx ON calendar (start_date);

CREATE TABLE IF NOT EXISTS reminder (
    reminder_id             serial NOT NULL,
    job_id                  int DEFAULT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    reminder_date           date NOT NULL,
    reminder_time           time DEFAULT NULL,
    reminder_message        text NOT NULL,
	reminder_dismissed      boolean NOT NULL DEFAULT false,
    reminder_created        timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	reminder_updated        timestamp(0) without time zone DEFAULT NULL,
    PRIMARY KEY (reminder_id)
);

CREATE TABLE IF NOT EXISTS communication (
    communication_id        serial NOT NULL,
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    contact_id              int DEFAULT NULL REFERENCES contact (contact_id) ON DELETE CASCADE ON UPDATE CASCADE,
    communication_type      comm NOT NULL,
    contact_person          varchar(255),
    communication_note      text,
    PRIMARY KEY (communication_id)
);

CREATE TABLE IF NOT EXISTS document (
    document_id             serial NOT NULL,
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    document_name           varchar(255),
    document_desc           text,
    file_directory          varchar(255),
    file_name               varchar(128),
    document_added          timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id)
);

CREATE TABLE IF NOT EXISTS personal (
	first_name              varchar(92),
	last_name               varchar(92),
	email                   varchar(255),
	phone                   varchar(24),
	linkedin_url            varchar(255) DEFAULT NULL,
	github_url              varchar(255) DEFAULT NULL,
	website_url             varchar(255) DEFAULT NULL,
	portfolio_url           varchar(255) DEFAULT NULL,
	address_1               varchar(255),
	address_2               varchar(255),
	city                    varchar(92),
	state                   varchar(92),
	zip                     varchar(10),
	country                 varchar(2),
	no_response_week        smallint NOT NULL DEFAULT 6,
	PRIMARY KEY (first_name, last_name)
);

























