import pytest
from unittest.mock import Mock, patch
from sqlalchemy import text


class TestConvertFileEndpoint:
    """Test suite for the /v1/convert/file endpoint."""

    @patch('app.utils.conversion.Conversion.convert_file')
    def test_convert_file_docx_to_md_success(self, mock_convert, client, test_db, temp_dir):
        """Test successful DOCX to Markdown conversion."""
        # Create test resume
        test_db.execute(text("""
            INSERT INTO resume (resume_id, resume_title, file_name, original_format, is_baseline, is_default, is_active)
            VALUES (1, 'Test Resume', 'test.docx', 'docx', true, false, true)
        """))
        test_db.commit()

        # Mock successful conversion
        mock_convert.return_value = True

        # Mock file read
        md_content = "# Test Resume\n\nThis is a test."
        with patch('builtins.open', create=True) as mock_open:
            mock_file = Mock()
            mock_file.read.return_value = md_content
            mock_file.__enter__.return_value = mock_file
            mock_open.return_value = mock_file

            response = client.post("/v1/convert/file", json={
                "resume_id": 1,
                "source_format": "docx",
                "target_format": "md"
            })

        assert response.status_code == 200
        data = response.json()
        assert data['file'] == 'test.md'
        assert data['file_content'] == md_content

    @patch('app.utils.conversion.Conversion.convert_file')
    def test_convert_file_docx_to_html_success(self, mock_convert, client, test_db):
        """Test successful DOCX to HTML conversion."""
        # Create test resume
        test_db.execute(text("""
            INSERT INTO resume (resume_id, resume_title, file_name, original_format, is_baseline, is_default, is_active)
            VALUES (2, 'Test Resume', 'test.docx', 'docx', true, false, true)
        """))
        test_db.commit()

        # Mock successful conversion
        mock_convert.return_value = True

        # Mock file read
        html_content = "<!DOCTYPE html><html><body><h1>Test</h1></body></html>"
        with patch('builtins.open', create=True) as mock_open:
            mock_file = Mock()
            mock_file.read.return_value = html_content
            mock_file.__enter__.return_value = mock_file
            mock_open.return_value = mock_file

            response = client.post("/v1/convert/file", json={
                "resume_id": 2,
                "source_format": "docx",
                "target_format": "html"
            })

        assert response.status_code == 200
        data = response.json()
        assert data['file'] == 'test.html'
        assert data['file_content'] == html_content

    def test_convert_file_resume_not_found(self, client):
        """Test conversion with non-existent resume."""
        response = client.post("/v1/convert/file", json={
            "resume_id": 999,
            "source_format": "docx",
            "target_format": "md"
        })

        assert response.status_code == 404
        assert "Resume not found" in response.json()['detail']

    @patch('app.utils.conversion.Conversion.convert_file')
    def test_convert_file_conversion_failure(self, mock_convert, client, test_db):
        """Test handling of conversion failures."""
        # Create test resume
        test_db.execute(text("""
            INSERT INTO resume (resume_id, resume_title, file_name, original_format, is_baseline, is_default, is_active)
            VALUES (3, 'Test Resume', 'test.docx', 'docx', true, false, true)
        """))
        test_db.commit()

        # Mock failed conversion
        mock_convert.return_value = False

        response = client.post("/v1/convert/file", json={
            "resume_id": 3,
            "source_format": "docx",
            "target_format": "md"
        })

        assert response.status_code == 500
        assert "conversion failed" in response.json()['detail'].lower()

    @patch('app.utils.conversion.Conversion.convert_file')
    def test_convert_file_optimized_resume(self, mock_convert, client, test_db):
        """Test conversion of optimized resume (source: html)."""
        # Create test resume with HTML file
        test_db.execute(text("""
            INSERT INTO resume (resume_id, resume_title, file_name, original_format, is_baseline, is_default, is_active)
            VALUES (4, 'Test Resume', 'test.html', 'html', false, false, true)
        """))
        test_db.commit()

        # Mock successful conversion
        mock_convert.return_value = True

        response = client.post("/v1/convert/file", json={
            "resume_id": 4,
            "source_format": "html",
            "target_format": "docx"
        })

        assert response.status_code == 200
        # For optimized resumes, filename should have '-final' appended
        data = response.json()
        assert '-final' in data['file']


class TestConvertFinalEndpoint:
    """Test suite for the /v1/convert/final endpoint."""

    @patch('app.utils.conversion.Conversion.html2docx')
    def test_convert_final_to_docx(self, mock_html2docx, client, test_db):
        """Test converting final resume to DOCX."""
        # Create baseline and optimized resumes
        test_db.execute(text("""
            INSERT INTO resume (resume_id, resume_title, file_name, original_format, is_baseline, is_default, is_active, baseline_resume_id)
            VALUES
                (10, 'Baseline', 'baseline.docx', 'docx', true, false, true, NULL),
                (11, 'Optimized', 'optimized.html', 'html', false, false, true, 10)
        """))

        test_db.execute(text("""
            INSERT INTO resume_detail (resume_id, resume_html_rewrite)
            VALUES (11, '<html><body><h1>Optimized Resume</h1></body></html>')
        """))
        test_db.commit()

        # Mock conversion
        mock_html2docx.return_value = ('/path/to/output.docx', '<html>cleaned</html>')

        response = client.post("/v1/convert/final", json={
            "resume_id": 11,
            "output_format": "docx"
        })

        assert response.status_code == 200
        data = response.json()
        assert data['file_name'] == 'optimized.docx'

    def test_convert_final_resume_not_found(self, client):
        """Test conversion with non-existent resume."""
        response = client.post("/v1/convert/final", json={
            "resume_id": 999,
            "output_format": "pdf"
        })

        assert response.status_code == 404


class TestLegacyConvertEndpoints:
    """Test suite for legacy conversion endpoints."""

    @patch('app.utils.conversion.Conversion.docxToMd')
    def test_convert_docx2md(self, mock_convert, client):
        """Test legacy DOCX to MD endpoint."""
        mock_convert.return_value = "# Test Content"

        response = client.post("/v1/convert/docx2md", json={
            "file_name": "test.docx"
        })

        assert response.status_code == 200
        data = response.json()
        assert data['file_content'] == "# Test Content"

    @patch('app.utils.conversion.Conversion.docxToHtml')
    def test_convert_docx2html(self, mock_convert, client):
        """Test legacy DOCX to HTML endpoint."""
        mock_convert.return_value = "<html><body>Test</body></html>"

        response = client.post("/v1/convert/docx2html", json={
            "file_name": "test.docx"
        })

        assert response.status_code == 200
        data = response.json()
        assert data['file_content'] == "<html><body>Test</body></html>"
