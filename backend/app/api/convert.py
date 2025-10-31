from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from enum import Enum
import os

from ..core.database import get_db
from ..core.config import settings
from ..utils.conversion import Conversion
from ..utils.logger import logger


router = APIRouter()


class OutputFormat(str, Enum):
    """Valid output formats for conversion"""
    odt = "odt"
    docx = "docx"
    pdf = "pdf"
    html = "html"


class ConvertRequest(BaseModel):
    file_name: str


class ConvertResponse(BaseModel):
    file_content: str


@router.post("/convert/odt2md", response_model=ConvertResponse)
async def convert_odt_to_md(request: ConvertRequest):
    """
    Convert ODT file to Markdown.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with markdown content
    """
    try:
        markdown_content = Conversion.odtToMd(request.file_name)
        return ConvertResponse(file_content=markdown_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/odt2html", response_model=ConvertResponse)
async def convert_odt_to_html(request: ConvertRequest):
    """
    Convert ODT file to HTML.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with HTML content
    """
    try:
        html_content = Conversion.odtToHtml(request.file_name)
        return ConvertResponse(file_content=html_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/docx2md", response_model=ConvertResponse)
async def convert_docx_to_md(request: ConvertRequest):
    """
    Convert DOCX file to Markdown.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with markdown content
    """
    try:
        markdown_content = Conversion.docxToMd(request.file_name)
        return ConvertResponse(file_content=markdown_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/docx2html", response_model=ConvertResponse)
async def convert_docx_to_html(request: ConvertRequest):
    """
    Convert DOCX file to HTML.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with HTML content
    """
    try:
        html_content = Conversion.docxToHtml(request.file_name)
        return ConvertResponse(file_content=html_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/pdf2md", response_model=ConvertResponse)
async def convert_pdf_to_md(request: ConvertRequest):
    """
    Convert PDF file to Markdown.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with markdown content
    """
    try:
        markdown_content = Conversion.pdfToMd(request.file_name)
        return ConvertResponse(file_content=markdown_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert/pdf2html", response_model=ConvertResponse)
async def convert_pdf_to_html(request: ConvertRequest):
    """
    Convert PDF file to HTML.

    Args:
        request: Contains file_name to convert

    Returns:
        ConvertResponse with HTML content
    """
    try:
        html_content = Conversion.pdfToHtml(request.file_name)
        return ConvertResponse(file_content=html_content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class Html2DocxResponse(BaseModel):
    file_name: str


@router.get("/convert/html2docx", response_model=Html2DocxResponse)
async def convert_html_to_docx(job_id: int, db: Session = Depends(get_db)):
    """
    Convert resume markdown to DOCX format for a specific job.

    This endpoint checks if the conversion has already been performed by
    looking at the resume_detail.rewrite_file_name field. If the file
    already exists, it returns the existing filename. Otherwise, it
    performs the conversion from markdown to DOCX and returns the new filename.

    Query parameters:
    - job_id: ID of the job

    Returns:
    - file_name: Name of the generated DOCX file
    """
    logger.info(f"Markdown to DOCX conversion requested", job_id=job_id)

    try:
        # Check if conversion already exists
        check_query = text("""
            SELECT rd.rewrite_file_name, rd.resume_id
            FROM job j
            JOIN resume_detail rd ON (j.resume_id = rd.resume_id)
            WHERE j.job_id = :job_id
        """)

        result = db.execute(check_query, {"job_id": job_id}).first()

        if not result:
            logger.warning(f"No resume found for job", job_id=job_id)
            raise HTTPException(status_code=404, detail="No resume associated with this job")

        # If rewrite_file_name already exists, check if file actually exists
        with open('/tmp/convert_debug.log', 'a') as f:
            f.write(f"DEBUG ENDPOINT: rewrite_file_name = {result.rewrite_file_name}\n")
        if result.rewrite_file_name:
            # Check if file actually exists
            file_path = os.path.join('/app', settings.base_job_file_path, 'resumes', result.rewrite_file_name)
            with open('/tmp/convert_debug.log', 'a') as f:
                f.write(f"DEBUG ENDPOINT: Checking if file exists at {file_path}\n")
                f.write(f"DEBUG ENDPOINT: File exists: {os.path.exists(file_path)}\n")
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                with open('/tmp/convert_debug.log', 'a') as f:
                    f.write(f"DEBUG ENDPOINT: Returning cached filename (file exists)\n")
                logger.debug(f"Using existing DOCX file", file_name=result.rewrite_file_name, job_id=job_id)
                return Html2DocxResponse(file_name=result.rewrite_file_name)
            else:
                with open('/tmp/convert_debug.log', 'a') as f:
                    f.write(f"DEBUG ENDPOINT: File doesn't exist or is empty, regenerating\n")

        # Otherwise, perform the conversion from markdown to DOCX
        with open('/tmp/convert_debug.log', 'a') as f:
            f.write(f"DEBUG ENDPOINT: About to call md2docx\n")
        logger.debug(f"Performing Markdown to DOCX conversion", job_id=job_id)
        conversion_result = Conversion.md2docx(job_id, db)
        with open('/tmp/convert_debug.log', 'a') as f:
            f.write(f"DEBUG ENDPOINT: md2docx returned {conversion_result}\n")

        logger.log_database_operation("UPDATE", "resume_detail", result.resume_id)
        logger.info(f"Markdown to DOCX conversion completed", job_id=job_id, file_name=conversion_result['file_name'])

        return Html2DocxResponse(file_name=conversion_result['file_name'])

    except ValueError as e:
        logger.error(f"Validation error during conversion", job_id=job_id, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error during Markdown to DOCX conversion", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error converting Markdown to DOCX: {str(e)}"
        )


@router.get("/file/download/resume/{file_name}")
async def download_resume_file(file_name: str):
    """
    Download a resume file from the resume directory.

    Args:
        file_name: Name of the file to download

    Returns:
        FileResponse with the requested file
    """
    logger.info(f"Resume file download requested", file_name=file_name)

    try:
        # Construct the full file path
        resume_dir = os.path.join('/app', settings.base_job_file_path, 'resumes')
        file_path = os.path.join(resume_dir, file_name)

        # Check if file exists
        if not os.path.exists(file_path):
            logger.warning(f"Resume file not found", file_name=file_name, file_path=file_path)
            raise HTTPException(status_code=404, detail=f"File not found: {file_name}")

        # Check if it's actually a file (not a directory)
        if not os.path.isfile(file_path):
            logger.warning(f"Path is not a file", file_name=file_name, file_path=file_path)
            raise HTTPException(status_code=400, detail=f"Invalid file path: {file_name}")

        logger.info(f"Serving resume file", file_name=file_name)

        # Return the file
        return FileResponse(
            path=file_path,
            filename=file_name,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume file", file_name=file_name, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading file: {str(e)}"
        )


class ConvertFinalRequest(BaseModel):
    """Request schema for /v1/convert/final endpoint"""
    resume_id: int
    output_format: OutputFormat


class ConvertFinalResponse(BaseModel):
    """Response schema for /v1/convert/final endpoint"""
    file_name: str


@router.post("/convert/final", response_model=ConvertFinalResponse)
async def convert_final(
    request: ConvertFinalRequest,
    db: Session = Depends(get_db)
):
    """
    Convert the final resume (resume_md_rewrite) to the specified output format.

    This endpoint:
    1. Retrieves the resume_md_rewrite content from resume_detail table
    2. Converts it to the requested format (odt, docx, pdf, or html)
    3. Saves the file with the same base name as the original but with new extension
    4. Returns the new filename

    Args:
        request: ConvertFinalRequest with resume_id and output_format
        db: Database session

    Returns:
        ConvertFinalResponse with the generated file_name

    Raises:
        HTTPException: If resume not found or conversion fails
    """
    try:
        logger.info(f"Converting final resume", resume_id=request.resume_id, output_format=request.output_format)

        # Query to get resume data
        query = text("""
            SELECT r.file_name, rd.resume_md_rewrite
            FROM resume r
            JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
            WHERE r.resume_id = :resume_id
        """)

        result = db.execute(query, {"resume_id": request.resume_id}).first()

        if not result:
            logger.error(f"Resume not found", resume_id=request.resume_id)
            raise HTTPException(status_code=404, detail=f"Resume not found for resume_id: {request.resume_id}")

        if not result.resume_md_rewrite:
            logger.error(f"No rewritten markdown content found", resume_id=request.resume_id)
            raise HTTPException(status_code=400, detail=f"No rewritten markdown content found for resume_id: {request.resume_id}")

        # Extract values
        original_file_name = result.file_name
        md_content = result.resume_md_rewrite

        # Generate new filename with requested extension
        if '.' in original_file_name:
            base_name = original_file_name.rsplit('.', 1)[0]
        else:
            base_name = original_file_name

        new_file_name = f"{base_name}.{request.output_format.value}"

        logger.debug(f"Converting resume", original_file_name=original_file_name, new_file_name=new_file_name)

        # Convert based on output format
        if request.output_format.value == "html":
            # For HTML, save the converted content directly
            html_content = Conversion.mdToHtml(md_content)
            output_path = Conversion._get_file_path(new_file_name)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            logger.debug(f"HTML file created", file_path=str(output_path))

        elif request.output_format.value == "docx":
            # For DOCX, use pandoc directly
            import subprocess
            import tempfile

            # Create temporary markdown file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
                temp_md.write(md_content)
                temp_md_path = temp_md.name

            # Output path for docx
            output_path = Conversion._get_file_path(new_file_name)

            try:
                # Convert markdown to DOCX using pandoc
                result = subprocess.run(
                    ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'docx', '-o', str(output_path)],
                    capture_output=True,
                    text=True,
                    check=True
                )

                # Clean up temporary file
                os.unlink(temp_md_path)
                logger.debug(f"DOCX file created", file_path=str(output_path))

            except subprocess.CalledProcessError as e:
                # Clean up temporary file on error
                if os.path.exists(temp_md_path):
                    os.unlink(temp_md_path)
                logger.error(f"Pandoc conversion failed", error=e.stderr)
                raise HTTPException(status_code=500, detail=f"Pandoc conversion failed: {e.stderr}")

        elif request.output_format.value == "odt":
            # For ODT, use md2odt
            output_path = Conversion.md2odt(md_content, new_file_name)
            logger.debug(f"ODT file created", file_path=output_path)

        elif request.output_format.value == "pdf":
            # For PDF, use md2pdf
            output_path = Conversion.md2pdf(md_content, new_file_name)
            logger.debug(f"PDF file created", file_path=output_path)

        logger.info(f"Resume conversion completed successfully", resume_id=request.resume_id, output_file=new_file_name)

        return ConvertFinalResponse(file_name=new_file_name)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error converting resume", resume_id=request.resume_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Error converting resume: {str(e)}")
