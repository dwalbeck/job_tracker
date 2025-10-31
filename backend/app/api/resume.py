import os
import re
import shutil
import difflib
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from ..core.database import get_db
from ..core.config import settings
from ..models.models import Resume, Job, FileFormat, ResumeDetail
from ..schemas.resume import (
    Resume as ResumeSchema,
    ResumeDetailCreate,
    ResumeDetail as ResumeDetailSchema,
    ResumeBaseline,
    ResumeBaselineList,
    ResumeJob,
    ResumeCloneRequest,
    ResumeExtractRequest,
    ResumeExtractResponse,
    JobTitleData,
    ResumeRewriteRequest,
    ResumeRewriteResponse
)
from ..utils.ai_agent import AiAgent
from ..utils.conversion import Conversion
from ..utils.job_helpers import update_job_activity
from ..utils.logger import logger


router = APIRouter()


def _convert_to_markdown(file_name: str, file_format: str) -> str:
    """
    Convert a resume file to markdown based on its format.

    Args:
        file_name: Name of the file to convert
        file_format: Format of the file (pdf, docx, odt, md)

    Returns:
        Markdown content as string

    Raises:
        Exception: If conversion fails
    """
    if file_format == 'md':
        # Read markdown file directly
        file_path = Path(settings.resume_dir) / file_name
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif file_format == 'pdf':
        return Conversion.pdfToMd(file_name)
    elif file_format == 'docx':
        return Conversion.docxToMd(file_name)
    elif file_format == 'odt':
        return Conversion.odtToMd(file_name)
    else:
        raise ValueError(f"Unsupported file format: {file_format}")


def clean_filename_part(text: str) -> str:
    """
    Clean text for use in filename: lowercase, replace spaces with underscores.
    """
    # Remove special characters except spaces and hyphens
    cleaned = re.sub(r'[^\w\s-]', '', text).strip()
    # Replace spaces and hyphens with underscores
    cleaned = re.sub(r'[-\s]+', '_', cleaned)
    # Convert to lowercase
    return cleaned.lower()


def generate_text_diff(original_text: str, rewritten_text: str) -> List[str]:
    """
    Generate a unified diff between original and rewritten text.

    Args:
        original_text: Original markdown text
        rewritten_text: Rewritten markdown text

    Returns:
        List of diff lines (without file headers)
    """
    # Split texts into lines
    original_lines = original_text.splitlines(keepends=True)
    rewritten_lines = rewritten_text.splitlines(keepends=True)

    # Generate unified diff
    diff = difflib.unified_diff(
        original_lines,
        rewritten_lines,
        fromfile='baseline',
        tofile='optimized',
        lineterm=''
    )

    # Skip the first two lines (file headers) and collect the rest
    diff_lines = list(diff)
    if len(diff_lines) > 2:
        return diff_lines[2:]  # Skip --- baseline and +++ optimized headers
    return []


def calculate_keyword_score(keywords: list, text: str) -> int:
    """
    Calculate the percentage of keywords found in text using regex matching.

    Args:
        keywords: List of keywords to search for
        text: Text to search in

    Returns:
        Percentage score (0-100)
    """
    if not keywords or not text:
        return 0

    matched_count = 0
    for keyword in keywords:
        # Case-insensitive regex search for whole keyword
        pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)
        if pattern.search(text):
            matched_count += 1

    total_count = len(keywords)
    if total_count > 0:
        return int((matched_count / total_count) * 100)

    return 0


def get_file_extension_from_filename(filename: str) -> Optional[str]:
    """
    Extract the file extension from a filename.
    Returns the extension without the dot (e.g., 'pdf', 'docx').
    """
    if not filename:
        return None
    parts = filename.rsplit('.', 1)
    if len(parts) > 1:
        ext = parts[1].lower()
        # Map common extensions to FileFormat enum values
        return ext
    return None


def validate_file_format(extension: str) -> str:
    """
    Validate that the file extension is a valid FileFormat enum value.
    """
    valid_formats = [e.value for e in FileFormat]
    if extension not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{extension}'. Allowed formats: {', '.join(valid_formats)}"
        )
    return extension


def make_unique_resume_title(base_title: str, db: Session) -> str:
    """
    Ensure resume title is unique by appending an incrementing number if needed.

    Args:
        base_title: The desired resume title
        db: Database session

    Returns:
        Unique resume title that doesn't exist in the database
    """
    if not base_title:
        return base_title

    # Check if base title already exists
    existing = db.query(Resume).filter(Resume.resume_title == base_title).first()

    if not existing:
        return base_title

    # Try incrementing numbers until we find a unique title
    counter = 1
    while True:
        new_title = f"{base_title} ({counter})"
        existing = db.query(Resume).filter(Resume.resume_title == new_title).first()

        if not existing:
            return new_title

        counter += 1

        # Safety check to prevent infinite loop
        if counter > 1000:
            raise ValueError(f"Could not generate unique resume title after {counter} attempts")


def make_unique_filename(base_filename: str, db: Session) -> str:
    """
    Ensure filename is unique by adding timestamp or incrementing number if needed.

    Args:
        base_filename: The desired filename (e.g., "resume.pdf")
        db: Database session

    Returns:
        Unique filename that doesn't exist in the database
    """
    # Check if base filename already exists
    existing = db.query(Resume).filter(Resume.file_name == base_filename).first()

    if not existing:
        return base_filename

    # Split into base and extension
    parts = base_filename.rsplit('.', 1)
    if len(parts) == 2:
        base_name, extension = parts
    else:
        base_name = base_filename
        extension = ""

    # Try adding date
    from datetime import datetime
    date_stamp = datetime.utcnow().strftime('%Y_%m_%d')
    timestamped_name = f"{base_name}_{date_stamp}.{extension}" if extension else f"{base_name}_{date_stamp}"

    existing = db.query(Resume).filter(Resume.file_name == timestamped_name).first()
    if not existing:
        return timestamped_name

    # If date also exists (unlikely), add incrementing number
    counter = 1
    while True:
        numbered_name = f"{base_name}_{date_stamp}_{counter}.{extension}" if extension else f"{base_name}_{date_stamp}_{counter}"
        existing = db.query(Resume).filter(Resume.file_name == numbered_name).first()
        if not existing:
            return numbered_name
        counter += 1


@router.get("/resume/baseline")
async def get_baseline_resumes(db: Session = Depends(get_db)):
    """
    Get all baseline resumes.

    Returns a list of baseline resumes ordered by is_default, resume_updated, and resume_created.
    """
    query = """
        SELECT r.resume_id, r.resume_title, r.resume_updated, r.is_default,
               rd.keyword_count, rd.focus_count
        FROM resume r
        LEFT JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
        WHERE r.is_baseline = true AND r.is_active = true
        ORDER BY r.is_default DESC, r.resume_updated DESC, r.resume_created DESC
    """

    result = db.execute(text(query))

    return [
        ResumeBaseline(
            resume_id=row.resume_id,
            resume_title=row.resume_title,
            resume_updated=row.resume_updated,
            is_default=row.is_default,
            keyword_count=row.keyword_count,
            focus_count=row.focus_count
        )
        for row in result
    ]


@router.get("/resume/baseline/list")
async def get_baseline_resume_list(db: Session = Depends(get_db)):
    """
    Get a simple list of baseline resumes for dropdown/selection purposes.

    Returns only resume_id, resume_title, and is_default fields,
    ordered by is_default (descending) then resume_title (ascending).
    """
    query = """
        SELECT resume_id, resume_title, is_default
        FROM resume
        WHERE is_baseline = true
        ORDER BY is_default DESC, resume_title ASC
    """

    result = db.execute(text(query))

    return [
        ResumeBaselineList(
            resume_id=row.resume_id,
            resume_title=row.resume_title,
            is_default=row.is_default
        )
        for row in result
    ]


@router.get("/resume/job", response_model=List[ResumeJob])
async def get_job_resumes(db: Session = Depends(get_db)):
    """
    Get all job-specific resumes.

    Returns a list of resumes associated with jobs, including company, job title,
    keyword/focus counts, and scores from resume_detail if available.
    """
    query = """
        SELECT j.company, j.job_title, j.job_id, rd.keyword_count, rd.focus_count,
               rd.baseline_score, rd.rewrite_score,
               r.resume_id, r.resume_updated, r.baseline_resume_id
        FROM resume r
        JOIN job j ON (r.job_id = j.job_id)
        LEFT JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
        WHERE r.is_baseline = false AND r.is_active = true
        ORDER BY r.resume_updated DESC, r.resume_created DESC
    """

    result = db.execute(text(query))

    resumes = [
        ResumeJob(
            resume_id=row.resume_id,
            resume_updated=row.resume_updated,
            company=row.company,
            job_title=row.job_title,
            keyword_count=row.keyword_count,
            focus_count=row.focus_count,
            baseline_score=row.baseline_score,
            rewrite_score=row.rewrite_score,
            job_id=row.job_id,
            baseline_resume_id=row.baseline_resume_id
        )
        for row in result
    ]

    # Debug logging
    if resumes:
        logger.debug(f"First resume baseline_resume_id: {resumes[0].baseline_resume_id}")
        logger.debug(f"First resume dict: {resumes[0].model_dump()}")

    return resumes


@router.get("/resume/{resume_id}")
async def get_resume(resume_id: int, db: Session = Depends(get_db)):
    """
    Get a single resume by ID.

    Returns all fields from the resume table for the specified resume_id.
    """
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return ResumeSchema(
        resume_id=resume.resume_id,
        resume_title=resume.resume_title,
        file_name=resume.file_name,
        is_baseline=resume.is_baseline,
        is_default=resume.is_default,
        is_active=resume.is_active,
        baseline_resume_id=resume.baseline_resume_id,
        job_id=resume.job_id,
        original_format=resume.original_format,
        resume_created=resume.resume_created,
        resume_updated=resume.resume_updated
    )


@router.get("/resume/detail/{resume_id}")
async def get_resume_detail(resume_id: int, db: Session = Depends(get_db)):
    """
    Get resume detail by resume ID.

    Returns all fields from the resume_detail table for the specified resume_id.
    """
    detail = db.query(ResumeDetail).filter(ResumeDetail.resume_id == resume_id).first()

    if not detail:
        raise HTTPException(status_code=404, detail="Resume detail not found")

    return ResumeDetailSchema(
        resume_id=detail.resume_id,
        resume_markdown=detail.resume_markdown,
        resume_md_rewrite=detail.resume_md_rewrite,
        resume_html=detail.resume_html,
        resume_html_rewrite=detail.resume_html_rewrite,
        position_title=detail.position_title,
        title_line_no=detail.title_line_no,
        keyword_count=detail.keyword_count,
        resume_keyword=detail.resume_keyword,
        keyword_final=detail.keyword_final,
        focus_count=detail.focus_count,
        focus_final=detail.focus_final,
        baseline_score=detail.baseline_score,
        rewrite_score=detail.rewrite_score,
        suggestion=detail.suggestion
    )


@router.post("/resume")
async def create_or_update_resume(
    upload_file: Optional[UploadFile] = File(None),
    resume_title: str = Form(...),
    file_name: Optional[str] = Form(None),
    is_baseline: bool = Form(False),
    is_default: bool = Form(False),
    baseline_resume_id: Optional[int] = Form(None),
    job_id: Optional[int] = Form(None),
    resume_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Create a new resume or update an existing one.

    Form data:
    - upload_file: The resume file (required for new resumes, optional for updates)
    - resume_title: Title of the resume
    - file_name: Optional custom filename
    - is_baseline: Whether this is a baseline resume
    - is_default: Whether this is the default resume
    - baseline_resume_id: ID of the baseline resume (if job-specific)
    - job_id: ID of the job this resume is for (mutually exclusive with is_baseline=true)
    - resume_id: ID of resume to update (omit for insert)
    """

    is_update = bool(resume_id)

    # Determine original_format from upload_file if present
    original_format = None
    if upload_file and upload_file.filename:
        extension = get_file_extension_from_filename(upload_file.filename)
        if extension:
            original_format = validate_file_format(extension)

    # For new resumes, original_format is required
    if not is_update and not original_format:
        raise HTTPException(
            status_code=400,
            detail="upload_file with valid extension is required for new resumes"
        )

    # Handle is_baseline logic based on job_id
    if job_id:
        is_baseline = False
    else:
        is_baseline = True

    # Verify job exists if job_id is provided
    if job_id:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

    # Calculate file_name if not provided
    calculated_file_name = file_name
    if not calculated_file_name and original_format:
        if not job_id:
            # Use resume_title for baseline resumes
            calculated_file_name = f"{clean_filename_part(resume_title)}.{original_format}"
        else:
            # Use company-job_title for job-specific resumes
            job = db.query(Job).filter(Job.job_id == job_id).first()
            if job:
                company_part = clean_filename_part(job.company) if job.company else "unknown"
                job_title_part = clean_filename_part(job.job_title) if job.job_title else "unknown"
                calculated_file_name = f"{company_part}-{job_title_part}.{original_format}"

    # Ensure filename is unique (only for new resumes)
    if not is_update and calculated_file_name:
        calculated_file_name = make_unique_filename(calculated_file_name, db)

    if is_update:
        # Update existing resume
        resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # If setting this resume as default, first unset all other defaults
        if is_default:
            db.query(Resume).filter(Resume.resume_id != resume_id).update(
                {"is_default": False},
                synchronize_session=False
            )

        # Update fields
        resume.resume_title = resume_title
        resume.is_baseline = is_baseline
        resume.is_default = is_default

        if baseline_resume_id is not None:
            resume.baseline_resume_id = baseline_resume_id

        if job_id is not None:
            resume.job_id = job_id

        if original_format:
            resume.original_format = original_format

        if calculated_file_name:
            resume.file_name = calculated_file_name

        # Set resume_updated timestamp
        resume.resume_updated = datetime.utcnow()

        # Save uploaded file if present
        if upload_file and upload_file.filename:
            # Create directory path
            base_path = Path(settings.resume_dir)
            base_path.mkdir(parents=True, exist_ok=True)

            file_path = base_path / calculated_file_name

            # Write file
            with open(file_path, "wb") as f:
                content = await upload_file.read()
                f.write(content)

            # Convert to markdown and create/update resume_detail
            try:
                markdown_content = _convert_to_markdown(calculated_file_name, original_format)

                # Check if resume_detail exists
                existing_detail = db.query(ResumeDetail).filter(
                    ResumeDetail.resume_id == resume.resume_id
                ).first()

                if existing_detail:
                    # Update existing detail
                    existing_detail.resume_markdown = markdown_content
                else:
                    # Create new detail
                    new_detail = ResumeDetail(
                        resume_id=resume.resume_id,
                        resume_markdown=markdown_content
                    )
                    db.add(new_detail)
            except Exception as e:
                logger.error(f"Error converting resume to markdown", resume_id=resume.resume_id, error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing resume: Failed to convert to Markdown: {str(e)}"
                )

    else:
        # Create new resume
        # Ensure resume_title is unique
        unique_resume_title = make_unique_resume_title(resume_title, db) if resume_title else resume_title

        new_resume = Resume(
            resume_title=unique_resume_title,
            file_name=calculated_file_name,
            original_format=original_format,
            is_baseline=is_baseline,
            is_default=is_default,
            baseline_resume_id=baseline_resume_id,
            job_id=job_id
        )

        db.add(new_resume)
        db.flush()  # Get the resume_id before saving file

        # Save uploaded file
        if upload_file and upload_file.filename:
            # Create directory path
            base_path = Path(settings.resume_dir)
            base_path.mkdir(parents=True, exist_ok=True)

            file_path = base_path / calculated_file_name

            # Write file
            with open(file_path, "wb") as f:
                content = await upload_file.read()
                f.write(content)

            # Convert to markdown and create resume_detail
            try:
                markdown_content = _convert_to_markdown(calculated_file_name, original_format)

                # Create new detail record
                new_detail = ResumeDetail(
                    resume_id=new_resume.resume_id,
                    resume_markdown=markdown_content
                )
                db.add(new_detail)
            except Exception as e:
                logger.error(f"Error converting resume to markdown", resume_id=new_resume.resume_id, error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing resume: Failed to convert to Markdown: {str(e)}"
                )

        resume = new_resume

    db.commit()
    db.refresh(resume)

    # Update job activity if job_id is provided
    if job_id:
        try:
            update_job_activity(db, job_id)
        except Exception as e:
            logger.warning(f"Failed to update job activity", job_id=job_id, error=str(e))

    return {"status": "success", "resume_id": resume.resume_id}


@router.post("/resume/detail")
async def create_or_update_resume_detail(
    detail_data: ResumeDetailCreate,
    db: Session = Depends(get_db)
):
    """
    Create or update resume detail information.

    This endpoint handles both insert and update operations based on whether
    a record exists in the resume_detail table for the given resume_id.

    JSON body:
    - resume_id: ID of the resume (required)
    - resume_markdown: Markdown version of resume content
    - resume_html: HTML version of resume content
    - position_title: Target position title
    - keyword_count: Number of keywords applied
    - resume_keyword: List of keywords applied
    - focus_count: Number of focus areas applied
    - focus_applied: List of focus areas applied
    """

    # Verify that the resume exists
    resume = db.query(Resume).filter(Resume.resume_id == detail_data.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Check if a detail record already exists for this resume_id
    existing_detail = db.query(ResumeDetail).filter(
        ResumeDetail.resume_id == detail_data.resume_id
    ).first()

    if existing_detail:
        # Update existing record
        # Update only the fields that are provided (not None)
        update_data = detail_data.dict(exclude={'resume_id'}, exclude_unset=True)

        for field, value in update_data.items():
            setattr(existing_detail, field, value)

        db.commit()
        db.refresh(existing_detail)

        return {"status": "success", "resume_id": existing_detail.resume_id}

    else:
        # Insert new record
        new_detail = ResumeDetail(
            resume_id=detail_data.resume_id,
            resume_markdown=detail_data.resume_markdown,
            resume_html=detail_data.resume_html,
            position_title=detail_data.position_title,
            keyword_count=detail_data.keyword_count,
            resume_keyword=detail_data.resume_keyword,
            focus_count=detail_data.focus_count,
            focus_applied=detail_data.focus_applied
        )

        db.add(new_detail)
        db.commit()
        db.refresh(new_detail)

        return {"status": "success", "resume_id": new_detail.resume_id}


@router.delete("/resume")
async def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db)
):
    """
    Soft delete a resume record by setting is_active to false.

    This marks the resume as inactive without removing it from the database.
    The physical file is preserved.

    Query parameters:
    - resume_id: ID of the resume to delete
    """

    # Fetch the resume
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Soft delete: set is_active to false
    resume.is_active = False
    resume.resume_updated = datetime.utcnow()

    db.commit()

    return {"status": "success", "message": "Resume deleted"}


@router.post("/resume/clone")
async def clone_resume(
    clone_request: ResumeCloneRequest,
    db: Session = Depends(get_db)
):
    """
    Clone an existing resume record and its associated file.

    Creates a near-duplicate of the specified resume with unique file_name and resume_title.
    If a resume_detail record exists for the original, it will also be cloned.

    JSON body:
    - resume_id: ID of the resume to clone
    """

    # Fetch the original resume
    original_resume = db.query(Resume).filter(Resume.resume_id == clone_request.resume_id).first()

    if not original_resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Extract base filename and extension
    original_file_name = original_resume.file_name
    if not original_file_name:
        raise HTTPException(status_code=400, detail="Original resume has no file_name")

    # Split filename into base and extension
    parts = original_file_name.rsplit('.', 1)
    if len(parts) == 2:
        base_name, extension = parts
    else:
        base_name = original_file_name
        extension = ""

    # Check if a simple -copy already exists
    test_file_name = f"{base_name}-copy.{extension}" if extension else f"{base_name}-copy"

    existing = db.query(Resume).filter(Resume.file_name == test_file_name).first()

    if existing:
        # Need to find the highest numbered copy
        # Use regex to find all copies with numbers
        pattern = f"{re.escape(base_name)}-copy\\d*"

        query = text("""
            SELECT file_name FROM resume
            WHERE file_name ~ :pattern
            ORDER BY file_name DESC
            LIMIT 1
        """)

        result = db.execute(query, {"pattern": pattern}).first()

        if result:
            # Extract the number from the highest match
            highest_file_name = result[0]
            # Pattern to extract number after -copy
            match = re.search(r'-copy(\d+)', highest_file_name)
            if match:
                next_num = int(match.group(1)) + 1
            else:
                # Existing is -copy without number, so start at 1
                next_num = 1

            new_file_name = f"{base_name}-copy{next_num}.{extension}" if extension else f"{base_name}-copy{next_num}"
        else:
            # Shouldn't happen, but fallback to -copy1
            new_file_name = f"{base_name}-copy1.{extension}" if extension else f"{base_name}-copy1"
    else:
        # Simple -copy is available
        new_file_name = test_file_name

    # Determine suffix for resume_title (use same logic as file_name)
    if original_resume.resume_title:
        if "-copy1" in new_file_name or "-copy2" in new_file_name or "-copy" in new_file_name:
            # Extract the suffix used for file_name
            if "-copy" in new_file_name:
                match = re.search(r'-copy(\d*)', new_file_name)
                if match.group(1):
                    # Has number
                    suffix = f"-copy{match.group(1)}"
                else:
                    # Just -copy
                    suffix = "-copy"
                new_resume_title = f"{original_resume.resume_title}{suffix}"
            else:
                new_resume_title = f"{original_resume.resume_title}-copy"
        else:
            new_resume_title = f"{original_resume.resume_title}-copy"
    else:
        new_resume_title = None

    # Ensure resume_title is unique
    unique_resume_title = make_unique_resume_title(new_resume_title, db) if new_resume_title else new_resume_title

    # Create new resume record
    new_resume = Resume(
        baseline_resume_id=original_resume.baseline_resume_id,
        job_id=original_resume.job_id,
        original_format=original_resume.original_format,
        resume_title=unique_resume_title,
        file_name=new_file_name,
        is_baseline=original_resume.is_baseline,
        is_default=False,  # Never copy is_default=true
        is_active=original_resume.is_active
    )

    db.add(new_resume)
    db.flush()  # Get the new resume_id

    # Copy the physical file if it exists
    base_path = Path(settings.resume_dir)
    base_path.mkdir(parents=True, exist_ok=True)

    original_file_path = base_path / original_file_name
    new_file_path = base_path / new_file_name

    if original_file_path.exists():
        shutil.copy2(original_file_path, new_file_path)

    # Check if resume_detail exists for original
    original_detail = db.query(ResumeDetail).filter(
        ResumeDetail.resume_id == clone_request.resume_id
    ).first()

    if original_detail:
        # Clone the resume_detail record
        new_detail = ResumeDetail(
            resume_id=new_resume.resume_id,
            resume_markdown=original_detail.resume_markdown,
            resume_md_rewrite=original_detail.resume_md_rewrite,
            resume_html=original_detail.resume_html,
            resume_html_rewrite=original_detail.resume_html_rewrite,
            position_title=original_detail.position_title,
            title_line_no=original_detail.title_line_no,
            keyword_count=original_detail.keyword_count,
            resume_keyword=original_detail.resume_keyword,
            keyword_final=original_detail.keyword_final,
            focus_count=original_detail.focus_count,
            focus_final=original_detail.focus_final,
            baseline_score=original_detail.baseline_score,
            rewrite_score=original_detail.rewrite_score,
            suggestion=original_detail.suggestion
        )

        db.add(new_detail)

    db.commit()
    db.refresh(new_resume)

    # Return the new resume record
    return ResumeSchema(
        resume_id=new_resume.resume_id,
        baseline_resume_id=new_resume.baseline_resume_id,
        job_id=new_resume.job_id,
        original_format=new_resume.original_format,
        resume_title=new_resume.resume_title,
        file_name=new_resume.file_name,
        is_baseline=new_resume.is_baseline,
        is_default=new_resume.is_default,
        is_active=new_resume.is_active,
        resume_created=new_resume.resume_created,
        resume_updated=new_resume.resume_updated
    )


@router.post("/resume/extract", response_model=ResumeExtractResponse)
async def extract_resume_data(
    extract_request: ResumeExtractRequest,
    db: Session = Depends(get_db)
):
    """
    Extract job title, keywords, and suggestions from a resume using AI.

    This endpoint uses OpenAI to analyze the resume content and extract:
    - Primary job title with line number
    - Relevant keywords and skills
    - Suggestions for improvement

    JSON body:
    - resume_id: ID of the resume to analyze
    - bad_list: List of job titles to exclude from selection (optional)

    Returns:
    - job_title: Object containing job_title string and line_number
    - keywords: List of extracted keywords
    - suggestions: List of improvement suggestions
    """

    try:
        # Initialize AI agent with database session
        ai_agent = AiAgent(db)

        # Extract data using AI
        result = ai_agent.extract_data(
            resume_id=extract_request.resume_id,
            bad_list=extract_request.bad_list
        )

        # Convert the result to response model
        return ResumeExtractResponse(
            job_title=JobTitleData(
                job_title=result['job_title']['job_title'],
                line_number=result['job_title']['line_number']
            ),
            keywords=result['keywords'],
            suggestions=result['suggestions']
        )

    except ValueError as e:
        # Handle resume not found or AI parsing errors
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting resume data: {str(e)}"
        )


@router.post("/resume/rewrite", response_model=ResumeRewriteResponse)
async def rewrite_resume(
    rewrite_request: ResumeRewriteRequest,
    db: Session = Depends(get_db)
):
    """
    Rewrite a baseline resume for a specific job using AI.

    This endpoint performs the following operations:
    1. Retrieves the baseline resume and its details
    2. Retrieves the job and job details
    3. Uses AI to rewrite the resume based on job requirements
    4. Creates a new resume record linked to the job
    5. Generates HTML versions of both original and rewritten resumes
    6. Creates a resume_detail record with all relevant data

    JSON body:
    - job_id: ID of the target job
    - resume_id: ID of the baseline resume to rewrite
    - keyword_final: Final list of keywords to incorporate
    - focus_final: Final list of focus areas to emphasize

    Returns:
    - resume_id: ID of the newly created resume
    - resume_html: HTML version of original resume
    - resume_html_rewrite: HTML version of rewritten resume
    - suggestion: List of improvement suggestions
    """
    logger.info(f"Rewriting resume", job_id=rewrite_request.job_id, resume_id=rewrite_request.resume_id)

    try:
        # Step 1: Retrieve resume data and verify it's a baseline resume
        query = text("""
            SELECT r.*, rd.*
            FROM resume r
            JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
            WHERE r.resume_id = :resume_id
        """)
        resume_result = db.execute(query, {"resume_id": rewrite_request.resume_id}).first()

        if not resume_result:
            logger.warning(f"Resume not found", resume_id=rewrite_request.resume_id)
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify is_baseline is true
        if not resume_result.is_baseline:
            logger.error(f"Resume is not a baseline resume", resume_id=rewrite_request.resume_id)
            raise HTTPException(status_code=400, detail="Resume must be a baseline resume")

        logger.debug(f"Retrieved baseline resume", resume_id=rewrite_request.resume_id)

        # Step 2: Retrieve job data
        job_query = text("""
            SELECT j.company, j.job_title, jd.job_desc, jd.job_qualification, jd.job_keyword
            FROM job j
            JOIN job_detail jd ON (j.job_id = jd.job_id)
            WHERE j.job_id = :job_id
        """)
        job_result = db.execute(job_query, {"job_id": rewrite_request.job_id}).first()

        if not job_result:
            logger.warning(f"Job not found", job_id=rewrite_request.job_id)
            raise HTTPException(status_code=404, detail="Job not found")

        if not job_result.job_desc:
            logger.error(f"Job description is empty", job_id=rewrite_request.job_id)
            raise HTTPException(status_code=400, detail="Job description is required")

        logger.debug(f"Retrieved job data", job_id=rewrite_request.job_id, company=job_result.company)

        # Step 2a: Check if a resume already exists for this job
        existing_resume_query = text("""
            SELECT jd.job_desc, r.resume_id, r.baseline_resume_id, rd.resume_html, rd.resume_html_rewrite,
                   rd.suggestion, rd.baseline_score, rd.rewrite_score, rd.keyword_final, rd.focus_final,
                   rd.resume_md_rewrite, rd.resume_markdown
            FROM job j
            LEFT JOIN job_detail jd ON (j.job_id = jd.job_id)
            LEFT JOIN resume r ON (j.resume_id = r.resume_id)
            LEFT JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
            WHERE j.job_id = :job_id
        """)
        existing_resume = db.execute(existing_resume_query, {"job_id": rewrite_request.job_id}).first()

        # Check if this is a re-run (resume already exists for this job)
        if existing_resume and existing_resume.resume_id:
            # Verify IDs match expected pattern
            if (existing_resume.resume_id != rewrite_request.resume_id and
                existing_resume.baseline_resume_id == rewrite_request.resume_id):

                logger.debug(f"Found existing resume for job", existing_resume_id=existing_resume.resume_id)

                # Compare keyword_final and focus_final arrays
                existing_keywords = existing_resume.keyword_final or []
                existing_focus = existing_resume.focus_final or []
                new_keywords = rewrite_request.keyword_final or []
                new_focus = rewrite_request.focus_final or []

                # Check if arrays are identical
                if set(existing_keywords) == set(new_keywords) and set(existing_focus) == set(new_focus):
                    # Return cached results
                    # Generate text diff between baseline and rewrite
                    text_changes = generate_text_diff(
                        existing_resume.resume_markdown if existing_resume.resume_markdown else "",
                        existing_resume.resume_md_rewrite if existing_resume.resume_md_rewrite else ""
                    )

                    logger.info(f"Returning cached resume (keywords/focus unchanged)", resume_id=existing_resume.resume_id)
                    return ResumeRewriteResponse(
                        resume_id=existing_resume.resume_id,
                        resume_html=existing_resume.resume_html,
                        resume_html_rewrite=existing_resume.resume_html_rewrite,
                        suggestion=existing_resume.suggestion,
                        baseline_score=existing_resume.baseline_score,
                        rewrite_score=existing_resume.rewrite_score,
                        text_changes=text_changes
                    )

                # Keywords/focus differ, so re-run with alternate logic
                logger.debug(f"Keywords/focus changed, reprocessing existing resume")

                # Initialize AI agent
                ai_agent = AiAgent(db)

                # Call AI agent to rewrite using the previous rewrite as base
                rewrite_result = ai_agent.resume_rewrite(
                    resume_markdown=existing_resume.resume_md_rewrite,
                    job_desc=existing_resume.job_desc,
                    keyword_final=rewrite_request.keyword_final,
                    focus_final=rewrite_request.focus_final,
                    job_title=job_result.job_title,
                    position_title="",  # Already replaced in previous rewrite
                    title_line_no=0
                )

                # logger.debug(f"AI rewrite completed (re-run)", suggestion_count=len(rewrite_result['suggestion']))
                logger.debug(f"AI rewrite completed (re-run)")

                # Calculate new rewrite_score using regex matching
                rewrite_score = calculate_keyword_score(job_result.job_keyword, rewrite_result['resume_md_rewrite'])

                logger.debug(f"Calculated new rewrite_score", rewrite_score=rewrite_score)

                # Convert rewritten markdown to HTML
                resume_html_rewrite = Conversion.mdToHtml(rewrite_result['resume_md_rewrite'])

                # Get original markdown and convert to HTML
                md_query = text("SELECT resume_markdown FROM resume_detail WHERE resume_id = :resume_id")
                md_result = db.execute(md_query, {"resume_id": existing_resume.resume_id}).first()

                resume_html = Conversion.mdToHtml(md_result.resume_markdown)

                # Generate text diff between baseline and new rewrite
                text_changes = generate_text_diff(
                    md_result.resume_markdown if md_result.resume_markdown else "",
                    rewrite_result['resume_md_rewrite']
                )

                # Update the existing resume_detail record
                update_query = text("""
                    UPDATE resume_detail
                    SET focus_count = :focus_count,
                        keyword_count = :keyword_count,
                        resume_md_rewrite = :resume_md_rewrite,
                        resume_html = :resume_html,
                        resume_html_rewrite = :resume_html_rewrite,
                        rewrite_score = :rewrite_score,
                        keyword_final = :keyword_final,
                        focus_final = :focus_final
                    WHERE resume_id = :resume_id
                """)

                db.execute(update_query, {
                    "resume_id": existing_resume.resume_id,
                    "focus_count": len(rewrite_request.focus_final),
                    "keyword_count": len(rewrite_request.keyword_final),
                    "resume_md_rewrite": rewrite_result['resume_md_rewrite'],
                    "resume_html": resume_html,
                    "resume_html_rewrite": resume_html_rewrite,
                    "rewrite_score": rewrite_score,
                    # "suggestion": rewrite_result['suggestion'],
                    "keyword_final": rewrite_request.keyword_final,
                    "focus_final": rewrite_request.focus_final
                })
                db.commit()

                logger.log_database_operation("UPDATE", "resume_detail", existing_resume.resume_id)
                logger.info(f"Updated existing resume successfully", resume_id=existing_resume.resume_id, rewrite_score=rewrite_score)

                # Return updated response
                return ResumeRewriteResponse(
                    resume_id=existing_resume.resume_id,
                    resume_html=resume_html,
                    resume_html_rewrite=resume_html_rewrite,
                    suggestion=[],  # rewrite_result['suggestion'],
                    baseline_score=existing_resume.baseline_score,
                    rewrite_score=rewrite_score,
                    text_changes=text_changes
                )

        # Step 3: Call AI agent to rewrite resume
        ai_agent = AiAgent(db)

        rewrite_result = ai_agent.resume_rewrite(
            resume_markdown=resume_result.resume_markdown,
            job_desc=job_result.job_desc,
            keyword_final=rewrite_request.keyword_final,
            focus_final=rewrite_request.focus_final,
            job_title=job_result.job_title,
            position_title=resume_result.position_title,
            title_line_no=resume_result.title_line_no
        )

        # logger.debug(f"AI rewrite completed", suggestion_count=len(rewrite_result['suggestion']))
        logger.debug(f"AI rewrite completed")

        # Step 4: Create filename for new resume
        company_part = clean_filename_part(job_result.company)
        job_title_part = clean_filename_part(job_result.job_title)
        file_name = f"{company_part}-{job_title_part}.md"

        # Ensure unique filename
        file_name = make_unique_filename(file_name, db)

        # Step 5: Write rewritten markdown to file
        base_path = Path(settings.resume_dir)
        base_path.mkdir(parents=True, exist_ok=True)
        file_path = base_path / file_name

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(rewrite_result['resume_md_rewrite'])

        logger.debug(f"Wrote rewritten resume to file", file_name=file_name)

        # Step 6: Insert new resume record
        # Ensure resume_title is unique
        base_resume_title = f"{job_result.company} - {job_result.job_title}"
        unique_resume_title = make_unique_resume_title(base_resume_title, db)

        new_resume = Resume(
            baseline_resume_id=rewrite_request.resume_id,
            job_id=rewrite_request.job_id,
            original_format=FileFormat.md,
            resume_title=unique_resume_title,
            file_name=file_name,
            is_baseline=False,
            is_default=False,
            is_active=True
        )

        db.add(new_resume)
        db.flush()  # Get the new resume_id

        logger.log_database_operation("INSERT", "resume", new_resume.resume_id)
        logger.debug(f"Created new resume record", new_resume_id=new_resume.resume_id)

        # Step 7: Convert both markdown versions to HTML
        resume_html = Conversion.mdToHtml(resume_result.resume_markdown)
        resume_html_rewrite = Conversion.mdToHtml(rewrite_result['resume_md_rewrite'])

        # Step 7a: Generate text diff between baseline and rewrite
        text_changes = generate_text_diff(
            resume_result.resume_markdown,
            rewrite_result['resume_md_rewrite']
        )

        logger.debug(f"Converted markdown to HTML")

        # Step 8: Insert resume_detail record
        new_detail = ResumeDetail(
            resume_id=new_resume.resume_id,
            resume_markdown=resume_result.resume_markdown,
            resume_md_rewrite=rewrite_result['resume_md_rewrite'],
            resume_html=resume_html,
            resume_html_rewrite=resume_html_rewrite,
            position_title=resume_result.position_title,
            title_line_no=resume_result.title_line_no,
            keyword_count=len(rewrite_request.keyword_final),
            resume_keyword=resume_result.resume_keyword,
            keyword_final=rewrite_request.keyword_final,
            focus_count=len(rewrite_request.focus_final),
            focus_final=rewrite_request.focus_final
            # suggestion=rewrite_result['suggestion']
        )

        db.add(new_detail)
        db.commit()

        logger.log_database_operation("INSERT", "resume_detail", new_resume.resume_id)
        logger.debug(f"Resume detail record created", resume_id=new_resume.resume_id)

        # Step 9: Calculate baseline_score using regex matching against baseline resume markdown
        baseline_score = calculate_keyword_score(job_result.job_keyword, resume_result.resume_markdown)

        logger.debug(f"Calculated baseline_score", baseline_score=baseline_score)

        # Step 10: Calculate rewrite_score using regex matching against rewritten resume markdown
        rewrite_score = calculate_keyword_score(job_result.job_keyword, rewrite_result['resume_md_rewrite'])

        logger.debug(f"Calculated rewrite_score", rewrite_score=rewrite_score)

        # Step 12: Update resume_detail with scores
        update_query = text("""
            UPDATE resume_detail
            SET baseline_score = :baseline_score,
                rewrite_score = :rewrite_score
            WHERE resume_id = :resume_id
        """)

        db.execute(update_query, {
            "resume_id": new_resume.resume_id,
            "baseline_score": baseline_score,
            "rewrite_score": rewrite_score
        })
        db.commit()

        logger.log_database_operation("UPDATE", "resume_detail", new_resume.resume_id)

        # Step 13: Update job record to associate the new resume
        job_update_query = text("""
            UPDATE job
            SET resume_id = :resume_id
            WHERE job_id = :job_id
        """)

        db.execute(job_update_query, {
            "resume_id": new_resume.resume_id,
            "job_id": rewrite_request.job_id
        })
        db.commit()

        logger.log_database_operation("UPDATE", "job", rewrite_request.job_id)
        logger.info(f"Resume rewrite completed successfully", new_resume_id=new_resume.resume_id, job_id=rewrite_request.job_id, baseline_score=baseline_score, rewrite_score=rewrite_score)

        # Step 14: Return response
        return ResumeRewriteResponse(
            resume_id=new_resume.resume_id,
            resume_html=resume_html,
            resume_html_rewrite=resume_html_rewrite,
            suggestion=[],  # rewrite_result['suggestion'],
            baseline_score=baseline_score,
            rewrite_score=rewrite_score,
            text_changes=text_changes
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValueError as e:
        # Handle AI parsing errors
        logger.error(f"AI processing error", error=str(e))
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error rewriting resume", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error rewriting resume: {str(e)}"
        )
