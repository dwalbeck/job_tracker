import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from app.utils.conversion import Conversion


class TestConversion:
    """Test suite for the Conversion class."""

    def test_rename_file(self):
        """Test file extension renaming."""
        assert Conversion.rename_file("document.docx", "pdf") == "document.pdf"
        assert Conversion.rename_file("file.txt", "md") == "file.md"
        assert Conversion.rename_file("noextension", "html") == "noextension.html"

    @patch('subprocess.run')
    def test_convert_file_docx_to_md(self, mock_subprocess, temp_dir):
        """Test DOCX to Markdown conversion using pandoc."""
        input_file = temp_dir / "test.docx"
        output_file = temp_dir / "test.md"
        input_file.touch()

        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        result = Conversion.convert_file('docx', 'md', str(input_file), str(output_file))

        assert result is True
        mock_subprocess.assert_called_once()
        call_args = mock_subprocess.call_args[0][0]
        assert 'pandoc' in call_args
        assert str(input_file) in call_args
        assert str(output_file) in call_args
        assert '-f' in call_args
        assert 'docx' in call_args
        assert '-t' in call_args
        assert 'markdown' in call_args

    @patch('subprocess.run')
    def test_convert_file_odt_to_md(self, mock_subprocess, temp_dir):
        """Test ODT to Markdown conversion using pandoc."""
        input_file = temp_dir / "test.odt"
        output_file = temp_dir / "test.md"
        input_file.touch()

        mock_subprocess.return_value = Mock(returncode=0, stdout="", stderr="")

        result = Conversion.convert_file('odt', 'md', str(input_file), str(output_file))

        assert result is True
        mock_subprocess.assert_called_once()
        call_args = mock_subprocess.call_args[0][0]
        assert 'pandoc' in call_args
        assert '-f' in call_args
        assert 'odt' in call_args

    @patch('app.utils.conversion.Conversion._get_file_path')
    @patch('markitdown.MarkItDown')
    def test_convert_file_pdf_to_md(self, mock_markitdown, mock_get_path, temp_dir):
        """Test PDF to Markdown conversion using MarkItDown."""
        input_file = temp_dir / "test.pdf"
        output_file = temp_dir / "test.md"
        input_file.touch()

        # Mock MarkItDown
        mock_converter = Mock()
        mock_result = Mock()
        mock_result.text_content = "# Test Content\n\nThis is a test."
        mock_converter.convert.return_value = mock_result
        mock_markitdown.return_value = mock_converter

        result = Conversion.convert_file('pdf', 'md', str(input_file), str(output_file))

        assert result is True
        assert output_file.exists()
        content = output_file.read_text()
        assert "Test Content" in content

    def test_convert_file_unsupported_format(self, temp_dir):
        """Test unsupported conversion format."""
        input_file = temp_dir / "test.xyz"
        output_file = temp_dir / "test.md"
        input_file.touch()

        result = Conversion.convert_file('xyz', 'md', str(input_file), str(output_file))

        assert result is False

    @patch('subprocess.run')
    def test_convert_file_subprocess_error(self, mock_subprocess, temp_dir):
        """Test handling of subprocess errors."""
        import subprocess

        input_file = temp_dir / "test.docx"
        output_file = temp_dir / "test.md"
        input_file.touch()

        mock_subprocess.side_effect = subprocess.CalledProcessError(1, 'pandoc', stderr="Error")

        result = Conversion.convert_file('docx', 'md', str(input_file), str(output_file))

        assert result is False

    @patch('app.utils.conversion.Conversion.docx2html_docx_parser_converter')
    @patch('app.utils.conversion.SessionLocal')
    def test_convert_file_docx_to_html_with_preference(self, mock_session, mock_converter, temp_dir):
        """Test DOCX to HTML conversion with database preference."""
        input_file = temp_dir / "test.docx"
        output_file = temp_dir / "test.html"
        input_file.touch()

        # Mock database result
        mock_db = Mock()
        mock_result = Mock()
        mock_result.docx2html = 'docx-parser-converter'
        mock_db.execute.return_value.first.return_value = mock_result
        mock_session.return_value = mock_db

        mock_converter.return_value = True

        result = Conversion.convert_file('docx', 'html', str(input_file), str(output_file))

        assert result is True
        mock_converter.assert_called_once_with(str(input_file), str(output_file))
