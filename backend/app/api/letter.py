from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..core.database import get_db
from ..core.config import settings
from ..models.models import CoverLetter as CoverLetterModel
from ..schemas.letter import Letter, LetterCreate, LetterUpdate, LetterListItem
from ..utils.logger import logger
from ..utils.ai_agent import AiAgent
from ..utils.conversion import Conversion
from ..utils.job_helpers import update_job_activity

router = APIRouter()


@router.get("/letter", response_model=Letter)
async def get_letter(cover_id: int, db: Session = Depends(get_db)):
    """
    Get a specific cover letter by cover_id.

    Args:
        cover_id: The ID of the cover letter to retrieve
        db: Database session

    Returns:
        Cover letter details
    """
    try:
        query = text("""
            SELECT cover_id, resume_id, job_id, letter_length, letter_tone,
                   instruction, letter_content, file_name, letter_created
            FROM cover_letter
            WHERE cover_id = :cover_id
        """)

        result = db.execute(query, {"cover_id": cover_id}).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cover letter with ID {cover_id} not found"
            )

        return {
            "cover_id": result.cover_id,
            "resume_id": result.resume_id,
            "job_id": result.job_id,
            "letter_length": result.letter_length,
            "letter_tone": result.letter_tone,
            "instruction": result.instruction,
            "letter_content": result.letter_content,
            "file_name": result.file_name or "",
            "letter_created": result.letter_created
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cover letter", cover_id=cover_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching cover letter: {str(e)}"
        )


@router.get("/letter/list", response_model=List[LetterListItem])
async def get_letter_list(db: Session = Depends(get_db)):
    """
    Get a list of all active cover letters with job information.

    Args:
        db: Database session

    Returns:
        List of active cover letters with summary information
    """
    try:
        query = text("""
            SELECT cl.letter_tone, cl.letter_length, cl.letter_created,
                   cl.cover_id, cl.file_name, j.company, j.job_title
            FROM cover_letter cl
            JOIN job j ON (cl.job_id = j.job_id)
            WHERE cl.cover_id > 0 AND cl.letter_active = true
            ORDER BY cl.letter_created DESC, j.company ASC
        """)

        results = db.execute(query).fetchall()

        return [
            {
                "letter_length": row.letter_length,
                "letter_tone": row.letter_tone,
                "file_name": row.file_name or "",
                "letter_created": row.letter_created,
                "cover_id": row.cover_id,
                "company": row.company or "",
                "job_title": row.job_title or ""
            }
            for row in results
        ]

    except Exception as e:
        logger.error(f"Error fetching cover letter list", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching cover letter list: {str(e)}"
        )


@router.post("/letter", status_code=status.HTTP_200_OK)
async def save_letter(letter_data: dict, db: Session = Depends(get_db)):
    """
    Create or update a cover letter.

    If cover_id is provided, updates the existing letter.
    If cover_id is not provided, creates a new letter.

    Args:
        letter_data: Cover letter data including all fields
        db: Database session

    Returns:
        Success status with cover_id
    """
    try:
        cover_id = letter_data.get('cover_id')

        # Validate letter_length
        valid_lengths = ['short', 'medium', 'long']
        if letter_data.get('letter_length') not in valid_lengths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"letter_length must be one of: {', '.join(valid_lengths)}"
            )

        # Validate letter_tone
        valid_tones = ['professional', 'casual', 'enthusiastic', 'informational']
        if letter_data.get('letter_tone') not in valid_tones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"letter_tone must be one of: {', '.join(valid_tones)}"
            )

        if cover_id:
            # Update existing cover letter
            update_query = text("""
                UPDATE cover_letter
                SET resume_id = :resume_id,
                    job_id = :job_id,
                    letter_length = :letter_length,
                    letter_tone = :letter_tone,
                    instruction = :instruction,
                    letter_content = :letter_content,
                    file_name = :file_name
                WHERE cover_id = :cover_id
            """)

            db.execute(update_query, {
                "cover_id": cover_id,
                "resume_id": letter_data.get('resume_id'),
                "job_id": letter_data.get('job_id'),
                "letter_length": letter_data.get('letter_length'),
                "letter_tone": letter_data.get('letter_tone'),
                "instruction": letter_data.get('instruction'),
                "letter_content": letter_data.get('letter_content'),
                "file_name": letter_data.get('file_name')
            })
            db.commit()

            # Update job activity
            job_id = letter_data.get('job_id')
            if job_id:
                try:
                    update_job_activity(db, job_id)
                except Exception as e:
                    logger.warning(f"Failed to update job activity", job_id=job_id, error=str(e))

            logger.info(f"Updated cover letter", cover_id=cover_id)
            return {"status": "success", "cover_id": cover_id}

        else:
            # Insert new cover letter
            insert_query = text("""
                INSERT INTO cover_letter (
                    resume_id, job_id, letter_length, letter_tone,
                    instruction, letter_content, file_name
                ) VALUES (
                    :resume_id, :job_id, :letter_length, :letter_tone,
                    :instruction, :letter_content, :file_name
                )
                RETURNING cover_id
            """)

            result = db.execute(insert_query, {
                "resume_id": letter_data.get('resume_id'),
                "job_id": letter_data.get('job_id'),
                "letter_length": letter_data.get('letter_length'),
                "letter_tone": letter_data.get('letter_tone'),
                "instruction": letter_data.get('instruction'),
                "letter_content": letter_data.get('letter_content'),
                "file_name": letter_data.get('file_name')
            })

            new_cover_id = result.fetchone()[0]

            # Update the job record with the cover_id
            job_id = letter_data.get('job_id')
            if job_id:
                update_job_query = text("""
                    UPDATE job
                    SET cover_id = :cover_id
                    WHERE job_id = :job_id
                """)
                db.execute(update_job_query, {
                    "cover_id": new_cover_id,
                    "job_id": job_id
                })

            db.commit()

            # Update job activity
            if job_id:
                try:
                    update_job_activity(db, job_id)
                except Exception as e:
                    logger.warning(f"Failed to update job activity", job_id=job_id, error=str(e))

            logger.info(f"Created new cover letter", cover_id=new_cover_id, job_id=job_id)
            return {"status": "success", "cover_id": new_cover_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving cover letter", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving cover letter: {str(e)}"
        )


@router.delete("/letter", status_code=status.HTTP_200_OK)
async def delete_letter(cover_id: int, db: Session = Depends(get_db)):
    """
    Soft delete a cover letter by setting letter_active to false.

    Args:
        cover_id: The ID of the cover letter to delete
        db: Database session

    Returns:
        Success status
    """
    try:
        # Check if the cover letter exists
        check_query = text("""
            SELECT cover_id FROM cover_letter WHERE cover_id = :cover_id
        """)

        result = db.execute(check_query, {"cover_id": cover_id}).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cover letter with ID {cover_id} not found"
            )

        # Soft delete by setting letter_active to false
        delete_query = text("""
            UPDATE cover_letter
            SET letter_active = false
            WHERE cover_id = :cover_id
        """)

        db.execute(delete_query, {"cover_id": cover_id})
        db.commit()

        logger.info(f"Soft deleted cover letter", cover_id=cover_id)
        return {"status": "success", "cover_id": cover_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting cover letter", cover_id=cover_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting cover letter: {str(e)}"
        )


@router.post("/letter/write", status_code=status.HTTP_200_OK)
async def write_cover_letter(request_data: dict, db: Session = Depends(get_db)):
    """
    Generate a cover letter using AI and update the database.

    Args:
        request_data: Dictionary containing cover_id
        db: Database session

    Returns:
        Dictionary containing the generated letter_content
    """
    try:
        cover_id = request_data.get('cover_id')

        if not cover_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cover_id is required"
            )

        # Query for all required data
        query = text("""
            SELECT cl.letter_tone, cl.letter_length, cl.instruction, jd.job_desc,
                   j.company, j.job_title, rd.resume_md_rewrite,
                   p.first_name, p.last_name, p.city, p.state, p.email, p.phone
            FROM cover_letter cl
            JOIN job j ON (cl.job_id = j.job_id)
            JOIN job_detail jd ON (j.job_id = jd.job_id)
            JOIN resume r ON (cl.resume_id = r.resume_id)
            JOIN resume_detail rd ON (r.resume_id = rd.resume_id),
            personal p
            WHERE cl.cover_id = :cover_id
        """)

        result = db.execute(query, {"cover_id": cover_id}).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cover letter with ID {cover_id} not found or missing required data"
            )

        # Extract data from query result
        letter_tone = result.letter_tone
        letter_length = result.letter_length
        instruction = result.instruction
        job_desc = result.job_desc
        company = result.company
        job_title = result.job_title
        resume_md_rewrite = result.resume_md_rewrite
        first_name = result.first_name
        last_name = result.last_name
        city = result.city
        state = result.state
        email = result.email
        phone = result.phone

        logger.info(f"Generating cover letter", cover_id=cover_id, company=company, job_title=job_title)

        # Initialize AI agent and generate cover letter
        ai_agent = AiAgent(db)
        ai_result = ai_agent.write_cover_letter(
            letter_tone=letter_tone,
            letter_length=letter_length,
            instruction=instruction,
            job_desc=job_desc,
            company=company,
            job_title=job_title,
            resume_md_rewrite=resume_md_rewrite,
            first_name=first_name,
            last_name=last_name,
            city=city,
            state=state,
            email=email,
            phone=phone
        )

        letter_content = ai_result.get('letter_content')

        if not letter_content:
            raise ValueError("AI did not return letter_content")

        # Update the cover_letter record with the generated content
        update_query = text("""
            UPDATE cover_letter
            SET letter_content = :letter_content
            WHERE cover_id = :cover_id
        """)

        db.execute(update_query, {
            "cover_id": cover_id,
            "letter_content": letter_content
        })
        db.commit()

        logger.info(f"Cover letter generated and saved", cover_id=cover_id)

        return {"letter_content": letter_content}

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"AI processing error", cover_id=cover_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error generating cover letter", cover_id=cover_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating cover letter: {str(e)}"
        )


@router.post("/letter/convert", status_code=status.HTTP_200_OK)
async def convert_cover_letter(request_data: dict, db: Session = Depends(get_db)):
    """
    Convert a cover letter to DOCX format.

    Args:
        request_data: Dictionary containing cover_id and format
        db: Database session

    Returns:
        Dictionary containing the generated file_name
    """
    try:
        cover_id = request_data.get('cover_id')
        output_format = request_data.get('format', 'docx')

        if not cover_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cover_id is required"
            )

        # Only support DOCX for now
        if output_format != 'docx':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only 'docx' format is currently supported"
            )

        # Query for cover letter data
        query = text("""
            SELECT cl.letter_content, cl.file_name, j.company, j.job_title
            FROM cover_letter cl
            JOIN job j ON (cl.job_id = j.job_id)
            WHERE cl.cover_id = :cover_id
        """)

        result = db.execute(query, {"cover_id": cover_id}).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cover letter with ID {cover_id} not found"
            )

        # Extract data
        letter_content = result.letter_content
        company = result.company or "unknown"
        job_title = result.job_title or "position"

        if not letter_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cover letter content is empty. Generate content first using /letter/write"
            )

        # Create filename: <company>-<job_title>.docx with spaces replaced by underscores, lowercase
        file_name = f"{company}-{job_title}.docx"
        file_name = file_name.replace(" ", "_").lower()

        logger.info(f"Converting cover letter to DOCX", cover_id=cover_id, file_name=file_name)

        # Convert markdown to DOCX using a new standalone method
        import subprocess
        import tempfile
        from pathlib import Path

        # Create temporary markdown file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
            temp_md.write(letter_content)
            temp_md_path = temp_md.name

        # Output path for docx
        output_path = Path(settings.cover_letter_dir) / file_name

        try:
            # Convert markdown to DOCX using pandoc
            result = subprocess.run(
                ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'docx', '-o', str(output_path)],
                capture_output=True,
                text=True,
                check=True
            )

            # Clean up temporary file
            import os
            os.unlink(temp_md_path)

        except subprocess.CalledProcessError as e:
            # Clean up temporary file on error
            import os
            if os.path.exists(temp_md_path):
                os.unlink(temp_md_path)
            raise Exception(f"Pandoc conversion to DOCX failed: {e.stderr}")

        # Update the cover_letter record with the filename
        update_query = text("""
            UPDATE cover_letter
            SET file_name = :file_name
            WHERE cover_id = :cover_id
        """)

        db.execute(update_query, {
            "cover_id": cover_id,
            "file_name": file_name
        })
        db.commit()

        logger.info(f"Cover letter converted to DOCX", cover_id=cover_id, file_name=file_name)

        return {"file_name": file_name}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting cover letter", cover_id=cover_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting cover letter: {str(e)}"
        )
