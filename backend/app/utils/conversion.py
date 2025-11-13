import os
from pathlib import Path
from typing import Optional
from ..core.config import settings
from ..utils.logger import logger


class Conversion:
    """
    Utility class for converting resume files between different formats.
    Supports conversions from ODT, DOCX, and PDF to Markdown and HTML.
    """

    # Class variable for resume directory path
    RESUME_DIR = settings.resume_dir

    @classmethod
    def _get_file_path(cls, file_name: str) -> Path:
        """
        Helper method to construct full file path.

        Args:
            file_name: Name of the file

        Returns:
            Path object for the file
        """
        return Path(cls.RESUME_DIR) / file_name

    @classmethod
    def rename_file(cls, filename: str, mime_type: str) -> str:
        """
        Rename a file by replacing its extension with the specified mime_type.

        Args:
            filename: Original filename (e.g., "resume.pdf")
            mime_type: Target mime type/extension (e.g., "docx", "odt", "pdf")

        Returns:
            New filename with updated extension (e.g., "resume.docx")
        """
        # Remove existing extension
        if '.' in filename:
            base_name = filename.rsplit('.', 1)[0]
        else:
            base_name = filename

        # Add new extension
        return f"{base_name}.{mime_type}"

    @classmethod
    def _markdown_to_html(cls, markdown_content: str) -> str:
        """
        Convert Markdown content to HTML.

        Args:
            markdown_content: Markdown text

        Returns:
            HTML content as string
        """
        try:
            import markdown

            # Convert markdown to HTML with common extensions
            html_content = markdown.markdown(
                markdown_content,
                extensions=[
                    'extra',          # Tables, fenced code blocks, etc.
                    'nl2br',          # Newline to <br>
                    'sane_lists',     # Better list handling
                    'codehilite',     # Syntax highlighting for code
                    'toc'             # Table of contents
                ]
            )

            # Wrap in basic HTML structure
            html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        h1, h2, h3, h4, h5, h6 {{
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }}
        table th, table td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        table th {{
            background-color: #f2f2f2;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background-color: #f4f4f4;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
        }}
        pre code {{
            background-color: transparent;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 16px;
            color: #666;
        }}
        ul, ol {{
            padding-left: 24px;
        }}
        a {{
            color: #0066cc;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""

            return html

        except Exception as e:
            raise Exception(f"Error converting Markdown to HTML: {str(e)}")

    # ODT conversions
    @classmethod
    def odtToMd(cls, file_name: str) -> str:
        """
        Convert ODT file to Markdown.

        Args:
            file_name: Name of the ODT file

        Returns:
            Markdown content as string
        """
        try:
            import subprocess

            file_path = cls._get_file_path(file_name)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_name}")

            # Use pandoc for ODT to Markdown conversion
            result = subprocess.run(
                ['pandoc', str(file_path), '-f', 'odt', '-t', 'markdown'],
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout
        except subprocess.CalledProcessError as e:
            raise Exception(f"Error converting ODT to Markdown: {e.stderr}")
        except Exception as e:
            raise Exception(f"Error converting ODT to Markdown: {str(e)}")

    @classmethod
    def odtToHtml(cls, file_name: str) -> str:
        """
        Convert ODT file to HTML.

        Args:
            file_name: Name of the ODT file

        Returns:
            HTML content as string
        """
        try:
            import subprocess

            file_path = cls._get_file_path(file_name)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_name}")

            # Use pandoc for ODT to HTML conversion
            result = subprocess.run(
                ['pandoc', str(file_path), '-f', 'odt', '-t', 'html'],
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout
        except subprocess.CalledProcessError as e:
            raise Exception(f"Error converting ODT to HTML: {e.stderr}")
        except Exception as e:
            raise Exception(f"Error converting ODT to HTML: {str(e)}")

    # DOCX conversions
    @classmethod
    def docxToMd(cls, file_name: str) -> str:
        """
        Convert DOCX file to Markdown.

        Args:
            file_name: Name of the DOCX file

        Returns:
            Markdown content as string
        """
        try:
            from docx2md.convert import do_convert

            file_path = cls._get_file_path(file_name)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_name}")

            # Convert DOCX to Markdown
            markdown_content = do_convert(str(file_path))

            return markdown_content
        except Exception as e:
            raise Exception(f"Error converting DOCX to Markdown: {str(e)}")

    @classmethod
    def docxToHtml(cls, file_name: str) -> str:
        """
        Convert DOCX file to HTML.

        Args:
            file_name: Name of the DOCX file

        Returns:
            HTML content as string
        """
        try:
            import mammoth

            file_path = cls._get_file_path(file_name)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_name}")

            # Convert DOCX to HTML using mammoth
            with open(file_path, 'rb') as docx_file:
                result = mammoth.convert_to_html(docx_file)
                html_content = result.value

            return html_content
        except Exception as e:
            raise Exception(f"Error converting DOCX to HTML: {str(e)}")

    # PDF conversions using MarkItDown
    @classmethod
    def pdfToMd(cls, file_name: str) -> str:
        """
        Convert PDF file to Markdown using MarkItDown.
        Preserves document structure including headings, lists, tables, and formatting.

        Args:
            file_name: Name of the PDF file

        Returns:
            Markdown content as string
        """
        try:
            from markitdown import MarkItDown

            file_path = cls._get_file_path(file_name)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_name}")

            # Initialize MarkItDown converter
            md = MarkItDown()

            # Convert to markdown
            result = md.convert(str(file_path))

            return result.text_content

        except FileNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error converting PDF to Markdown: {str(e)}")

    @classmethod
    def pdfToHtml(cls, file_name: str) -> str:
        """
        Convert PDF file to HTML.
        First converts to Markdown using MarkItDown, then converts Markdown to HTML.

        Args:
            file_name: Name of the PDF file

        Returns:
            HTML content as string
        """
        try:
            # Convert PDF to Markdown first
            markdown_content = cls.pdfToMd(file_name)

            # Convert Markdown to HTML
            return cls._markdown_to_html(markdown_content)

        except Exception as e:
            raise Exception(f"Error converting PDF to HTML: {str(e)}")

    # Markdown conversions
    @classmethod
    def mdToHtml(cls, markdown_content: str) -> str:
        """
        Convert Markdown content to HTML.

        Args:
            markdown_content: Markdown text content

        Returns:
            HTML content as string
        """
        try:
            return cls._markdown_to_html(markdown_content)
        except Exception as e:
            raise Exception(f"Error converting Markdown to HTML: {str(e)}")

    @classmethod
    def md2docx(cls, markdown_content: str, output_file_name: str, reference_file: Optional[str] = None) -> str:
        """
        Convert Markdown content to DOCX format.

        Args:
            markdown_content: Markdown text content
            output_file_name: Name for the output DOCX file
            reference_file: Optional reference DOCX file for styling (filename only, not full path)

        Returns:
            Path to the created DOCX file
        """
        try:
            import subprocess
            import tempfile

            # Create temporary markdown file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
                temp_md.write(markdown_content)
                temp_md_path = temp_md.name

            # Output path for docx
            output_path = cls._get_file_path(output_file_name)
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                # Build pandoc command
                pandoc_cmd = ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'docx', '-o', str(output_path)]

                # Add reference doc if provided
                if reference_file:
                    logger.debug(f"Using reference file: {reference_file}")

                    reference_path = cls._get_file_path(reference_file)
                    if os.path.exists(reference_path):
                        pandoc_cmd.extend(['--reference-doc', str(reference_path)])

                # Convert markdown to DOCX using pandoc
                result = subprocess.run(
                    pandoc_cmd,
                    capture_output=True,
                    text=True,
                    check=True
                )

                # Clean up temporary file
                os.unlink(temp_md_path)

                return str(output_path)

            except subprocess.CalledProcessError as e:
                # Clean up temporary file on error
                if os.path.exists(temp_md_path):
                    os.unlink(temp_md_path)
                raise Exception(f"Pandoc conversion to DOCX failed: {e.stderr}")

        except Exception as e:
            raise Exception(f"Error converting Markdown to DOCX: {str(e)}")

    # Markdown to DOCX conversion
    @classmethod
    def md2docx_from_job(cls, job_id: int, db) -> dict:
        """
        Convert resume markdown to DOCX format for a specific job.

        This method:
        1. Retrieves the resume_md_rewrite for the job's associated resume
        2. Converts the markdown to DOCX format using pandoc
        3. Saves the DOCX file with a -tailored.docx suffix
        4. Updates the resume_detail.rewrite_file_name field
        5. Returns the new filename

        Args:
            job_id: ID of the job
            db: Database session

        Returns:
            Dictionary with file_name key
        """
        try:
            import subprocess
            import tempfile
            from sqlalchemy import text

            # Query to get resume data
            query = text("""
                SELECT rd.resume_md_rewrite, r.file_name, r.resume_id
                FROM job j
                JOIN resume r ON (j.resume_id = r.resume_id)
                JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
                WHERE j.job_id = :job_id
            """)

            result = db.execute(query, {"job_id": job_id}).first()

            if not result:
                raise ValueError(f"No resume found for job_id {job_id}")

            if not result.resume_md_rewrite:
                raise ValueError(f"No rewritten markdown content found for job_id {job_id}")

            # Extract values
            md_content = result.resume_md_rewrite
            original_file_name = result.file_name
            resume_id = result.resume_id

            # Remove file extension from original filename
            if '.' in original_file_name:
                base_name = original_file_name.rsplit('.', 1)[0]
            else:
                base_name = original_file_name

            # Create new filename with -tailored.docx suffix
            new_file_name = f"{base_name}-tailored.docx"

            # Create temporary markdown file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
                temp_md.write(md_content)
                temp_md_path = temp_md.name

            # Output path for docx
            output_path = cls._get_file_path(new_file_name)

            try:
                # Convert markdown to DOCX using pandoc
                with open('/tmp/convert_debug.log', 'a') as f:
                    f.write(f"DEBUG: About to run pandoc with temp_md_path={temp_md_path}, output_path={output_path}\n")
                    f.write(f"DEBUG: Temp file exists: {os.path.exists(temp_md_path)}\n")
                    f.write(f"DEBUG: Temp file size: {os.path.getsize(temp_md_path) if os.path.exists(temp_md_path) else 'N/A'}\n")

                result = subprocess.run(
                    ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'docx', '-o', str(output_path)],
                    capture_output=True,
                    text=True,
                    check=True
                )

                with open('/tmp/convert_debug.log', 'a') as f:
                    f.write(f"DEBUG: Pandoc completed. Return code: {result.returncode}\n")
                    f.write(f"DEBUG: Pandoc stdout: {result.stdout}\n")
                    f.write(f"DEBUG: Pandoc stderr: {result.stderr}\n")
                    f.write(f"DEBUG: Output file exists: {os.path.exists(output_path)}\n")
                    f.write(f"DEBUG: Output file size: {os.path.getsize(output_path) if os.path.exists(output_path) else 'N/A'}\n")

                # Clean up temporary file
                os.unlink(temp_md_path)

                # Update resume_detail with the new filename
                update_query = text("""
                    UPDATE resume_detail
                    SET rewrite_file_name = :file_name
                    WHERE resume_id = :resume_id
                """)

                db.execute(update_query, {
                    "file_name": new_file_name,
                    "resume_id": resume_id
                })
                db.commit()

                return {"file_name": new_file_name}

            except subprocess.CalledProcessError as e:
                # Clean up temporary file on error
                if os.path.exists(temp_md_path):
                    os.unlink(temp_md_path)
                raise Exception(f"Pandoc conversion failed: {e.stderr}")

        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Error converting Markdown to DOCX: {str(e)}")

    # Markdown to ODT conversion
    @classmethod
    def md2odt(cls, markdown_content: str, output_file_name: str, reference_file: Optional[str] = None) -> str:
        """
        Convert Markdown content to ODT format.

        Args:
            markdown_content: Markdown text content
            output_file_name: Name for the output ODT file
            reference_file: Optional reference ODT file for styling (filename only, not full path)

        Returns:
            Path to the created ODT file
        """
        try:
            import subprocess
            import tempfile

            # Create temporary markdown file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
                temp_md.write(markdown_content)
                temp_md_path = temp_md.name

            # Output path for odt
            output_path = cls._get_file_path(output_file_name)
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                # Build pandoc command
                pandoc_cmd = ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'odt', '-o', str(output_path)]

                # Add reference doc if provided
                if reference_file:
                    reference_path = cls._get_file_path(reference_file)
                    if os.path.exists(reference_path):
                        pandoc_cmd.extend(['--reference-doc', str(reference_path)])

                # Convert markdown to ODT using pandoc
                result = subprocess.run(
                    pandoc_cmd,
                    capture_output=True,
                    text=True,
                    check=True
                )

                # Clean up temporary file
                os.unlink(temp_md_path)

                return str(output_path)

            except subprocess.CalledProcessError as e:
                # Clean up temporary file on error
                if os.path.exists(temp_md_path):
                    os.unlink(temp_md_path)
                raise Exception(f"Pandoc conversion to ODT failed: {e.stderr}")

        except Exception as e:
            raise Exception(f"Error converting Markdown to ODT: {str(e)}")

    # Markdown to PDF conversion
    @classmethod
    def md2pdf(cls, markdown_content: str, output_file_name: str, output_dir: str = None) -> str:
        """
        Convert Markdown content to PDF format.

        Args:
            markdown_content: Markdown text content
            output_file_name: Name for the output PDF file
            output_dir: Optional directory path for output (defaults to RESUME_DIR)

        Returns:
            Path to the created PDF file
        """
        try:
            import subprocess
            import tempfile

            # Create temporary markdown file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as temp_md:
                temp_md.write(markdown_content)
                temp_md_path = temp_md.name

            # Determine output path
            if output_dir:
                output_path = Path(output_dir) / output_file_name
                # Create directory if it doesn't exist
                os.makedirs(output_dir, exist_ok=True)
            else:
                output_path = cls._get_file_path(output_file_name)
                # Ensure directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                # Convert markdown to PDF using pandoc
                result = subprocess.run(
                    ['pandoc', temp_md_path, '-f', 'markdown', '-t', 'pdf', '-o', str(output_path)],
                    capture_output=True,
                    text=True,
                    check=True
                )

                # Clean up temporary file
                os.unlink(temp_md_path)

                return str(output_path)

            except subprocess.CalledProcessError as e:
                # Clean up temporary file on error
                if os.path.exists(temp_md_path):
                    os.unlink(temp_md_path)
                raise Exception(f"Pandoc conversion to PDF failed: {e.stderr}")

        except Exception as e:
            raise Exception(f"Error converting Markdown to PDF: {str(e)}")

    # HTML to DOCX conversion (legacy method, keeping for backwards compatibility)
    @classmethod
    def html2docx(cls, job_id: int, db) -> dict:
        """
        Convert resume HTML to DOCX format for a specific job.

        This is a legacy method that converts HTML to DOCX.
        Consider using md2docx instead for markdown-based conversions.

        This method:
        1. Retrieves the resume_html_rewrite for the job's associated resume
        2. Converts the HTML to DOCX format
        3. Saves the DOCX file with a -tailored.docx suffix
        4. Updates the resume_detail.rewrite_file_name field
        5. Returns the new filename

        Args:
            job_id: ID of the job
            db: Database session

        Returns:
            Dictionary with file_name key
        """
        try:
            from html2docx import html2docx
            from sqlalchemy import text

            # Query to get resume data
            query = text("""
                SELECT rd.resume_html_rewrite, rd.suggestion, r.file_name, r.resume_id
                FROM job j
                JOIN resume r ON (j.resume_id = r.resume_id)
                JOIN resume_detail rd ON (r.resume_id = rd.resume_id)
                WHERE j.job_id = :job_id
            """)

            result = db.execute(query, {"job_id": job_id}).first()

            if not result:
                raise ValueError(f"No resume found for job_id {job_id}")

            if not result.resume_html_rewrite:
                raise ValueError(f"No rewritten HTML content found for job_id {job_id}")

            # Extract values
            html_content = result.resume_html_rewrite
            original_file_name = result.file_name
            resume_id = result.resume_id

            # Remove file extension from original filename
            if '.' in original_file_name:
                base_name = original_file_name.rsplit('.', 1)[0]
            else:
                base_name = original_file_name

            # Create new filename with -tailored.docx suffix
            new_file_name = f"{base_name}-tailored.docx"

            # Convert HTML to DOCX
            docx_file = html2docx(html_content, title="Resume")

            # Write DOCX file to resume directory
            file_path = cls._get_file_path(new_file_name)

            # Save the document
            with open(file_path, 'wb') as f:
                docx_file.save(f)

            # Update resume_detail with the new filename
            update_query = text("""
                UPDATE resume_detail
                SET rewrite_file_name = :file_name
                WHERE resume_id = :resume_id
            """)

            db.execute(update_query, {
                "file_name": new_file_name,
                "resume_id": resume_id
            })
            db.commit()

            return {"file_name": new_file_name}

        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Error converting HTML to DOCX: {str(e)}")
