

CREATE DATABASE job_hunt;

CREATE TYPE title AS ENUM ('recruiter', 'hiring manager', 'hr', 'engineer', 'vp', 'other');
CREATE TYPE job_status AS ENUM ('applied', 'interviewing', 'rejected', 'no response');
CREATE TYPE appt AS ENUM ('phone call', 'interview', 'on site', 'technical');
CREATE TYPE comm AS ENUM ('phone', 'email', 'sms', 'message');

CREATE TABLE job (
    job_id                  serial NOT NULL,
    company                 varchar(64),
    job_title               varchar(255),
    salary                  varchar(92),
    location                varchar(128),
    interest_level          smallint NOT NULL DEFAULT 1,
    posting_url             text,
    apply_url               text,
    job_desc                text,
    job_status              job_status NOT NULL DEFAULT 'applied',
    date_applied            date DEFAULT NULL,
    last_contact            date,
    resume_id               int DEFAULT NULL REFERENCES resume (resume_id) ON DELETE SET NULL ON UPDATE CASCADE,
    cover_id                int DEFAULT NULL REFERENCES cover_letter (cover_id) ON DELETE SET NULL ON UPDATE CASCADE,
    job_created             timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    job_directory           varchar(255),
    CHECK (interest_level > 0 AND interest_level < 11),
    PRIMARY KEY (job_id)
);
CREATE INDEX job_job_status_idx ON job (job_status);
CREATE INDEX job_last_contact_idx ON job (last_contact);


CREATE TABLE contact (
    contact_id              serial NOT NULL,
    first_name              varchar(92),
    last_name               varchar(92),
    job_title               title NOT NULL DEFAULT 'recruiter',
    email                   varchar(255),
    phone                   varchar(24),
    company                 varchar(64),
    linkedin                varchar(255),
    contact_note            text,
    PRIMARY KEY (contact_id)
);

CREATE TABLE job_contact (
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    contact_id              int NOT NULL REFERENCES contact (contact_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id, contact_id)
);

CREATE TABLE note (
    note_id                 serial NOT NULL,
    job_id                  int NOT NULL REFERENCES job (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    note_title              varchar(255),
    note_content            text,
    note_created            timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id)
);

CREATE TABLE calendar (
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
    video                   boolean NOT NULL DEFAULT false,
    video_link              varchar(255),
    PRIMARY KEY (calendar_id)
);
CREATE INDEX calendar_start_date_idx ON calendar (start_date);

CREATE TABLE communication (
    communication_id        serial NOT NULL,
    communication_type      comm NOT NULL,
    contact_id              int DEFAULT NULL REFERENCES contact (contact_id) ON DELETE CASCADE ON UPDATE CASCADE,
    contact_person          varchar(255),
    communication_note      text,
    PRIMARY KEY (communication_id)
);

CREATE TABLE resume (
    resume_id               serial NOT NULL,
    file_directory          varchar(255),
    file_name               varchar(128),
    resume_created          timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (resume_id)
):

CREATE TABLE cover_letter (
    cover_id                serial NOT NULL,
    file_directory          varchar(255),
    file_name               varchar(128),
    cover_created           timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cover_id)
);

CREATE TABLE document (
    document_id             serial NOT NULL,
    document_name           varchar(255),
    document_desc           text,
    file_directory          varchar(255),
    file_name               varchar(128),
    document_added          timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id)
);


























