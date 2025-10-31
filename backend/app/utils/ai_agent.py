import os
import json
import sys
from pathlib import Path
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.config import settings


class AiAgent:
    """
    AI Agent class for handling resume analysis and processing using OpenAI API.
    """

    def __init__(self, db: Session):
        """
        Initialize the AI Agent with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.api_key = settings.openai_api_key
        self.model = settings.ai_model
        self.project = settings.openai_project

        # Initialize OpenAI client
        client_kwargs = {"api_key": self.api_key}
        if self.project:
            client_kwargs["project"] = self.project

        self.client = OpenAI(**client_kwargs)

        # Path to prompt templates
        self.prompts_dir = Path(__file__).parent / 'prompts'

    def _load_prompt(self, prompt_name: str) -> str:
        """
        Load a prompt template from the prompts directory.

        Args:
            prompt_name: Name of the prompt file (without extension)

        Returns:
            Prompt template as string
        """
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"

        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt template not found: {prompt_name}")

        with open(prompt_path, 'r') as f:
            return f.read()

    def get_markdown(self, resume_id: int) -> str:
        """
        Retrieve the markdown content of a resume from the database.

        Args:
            resume_id: ID of the resume to retrieve

        Returns:
            Markdown content of the resume

        Raises:
            ValueError: If resume not found
        """
        query = text("SELECT resume_markdown FROM resume_detail WHERE resume_id = :resume_id")
        result = self.db.execute(query, {"resume_id": resume_id}).first()

        if not result:
            raise ValueError(f"Resume not found for resume_id: {resume_id}")

        return result[0]

    def extract_data(self, resume_id: int, bad_list: list = None) -> dict:
        """
        Extract job title, keywords, and suggestions from a resume using AI.

        Args:
            resume_id: ID of the resume to analyze
            bad_list: List of job titles to exclude from selection

        Returns:
            Dictionary containing:
                - job_title: dict with job_title and line_number
                - keywords: list of extracted keywords
                - suggestions: list of improvement suggestions
        """
        if bad_list is None:
            bad_list = []

        # Get the markdown resume
        md_resume = self.get_markdown(resume_id)

        # Load the prompt template
        prompt_template = self._load_prompt('extract_data')

        # Format the prompt with variables using replace to avoid issues with curly braces
        bad_list_str = "\n".join([f"- {title}" for title in bad_list]) if bad_list else "None"
        prompt = prompt_template.replace('{md_resume}', md_resume)
        prompt = prompt.replace('{bad_list}', bad_list_str)

        # Make API call to OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Expert resume writer and analyst. You analyze resumes and provide structured data in JSON format."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the response content
        response_text = response.choices[0].message.content

        # Parse JSON response
        try:
            # Try to parse the response as JSON
            result = json.loads(response_text)

            # Validate the structure
            if not all(key in result for key in ['job_title', 'keywords', 'suggestions']):
                raise ValueError("Response missing required keys")

            if not all(key in result['job_title'] for key in ['job_title', 'line_number']):
                raise ValueError("job_title missing required keys")

            return result

        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                    return result
                except json.JSONDecodeError:
                    pass

            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

    def job_extraction(self, job_id: int) -> dict:
        """
        Extract job qualifications and keywords from a job description using AI.

        Args:
            job_id: ID of the job to analyze

        Returns:
            Dictionary containing:
                - job_qualification: extracted qualification section text
                - keywords: list of extracted keywords

        Raises:
            ValueError: If job not found or job_desc is empty
        """
        # First verify the job exists
        job_query = text("SELECT job_id FROM job WHERE job_id = :job_id AND job_active = true")
        job_result = self.db.execute(job_query, {"job_id": job_id}).first()

        if not job_result:
            raise ValueError(f"Job not found or inactive for job_id: {job_id}")

        # Get the job description from job_detail table
        query = text("SELECT job_desc FROM job_detail WHERE job_id = :job_id")
        result = self.db.execute(query, {"job_id": job_id}).first()

        if not result:
            raise ValueError(f"No job description found. Please edit the job and add a job description before using resume optimization.")

        job_desc = result[0]
        if not job_desc:
            raise ValueError(f"Job description is empty. Please edit the job and add a job description before using resume optimization.")

        # Load the prompt template
        prompt_template = self._load_prompt('job_extract')

        # Format the prompt with the job description
        # Use replace instead of format to avoid issues with curly braces in the template
        prompt = prompt_template.replace('{job_desc}', job_desc)

        # Make API call to OpenAI
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Expert job analyst. You analyze job descriptions and extract qualifications and keywords in JSON format."},
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract the response content
            response_text = response.choices[0].message.content

            if not response_text:
                raise ValueError("OpenAI returned empty response")

            # Debug: print the raw response
            print(f"DEBUG: Raw OpenAI response: {repr(response_text[:500])}", file=sys.stderr, flush=True)

        except Exception as e:
            raise ValueError(f"OpenAI API call failed: {str(e)}")

        # Parse JSON response
        try:
            # Remove any leading/trailing whitespace and try to parse as JSON
            response_text = response_text.strip()
            print(f"DEBUG: After strip: {repr(response_text[:500])}", file=sys.stderr, flush=True)
            result = json.loads(response_text)
            print(f"DEBUG: Successfully parsed JSON", file=sys.stderr, flush=True)

            # Validate the structure
            if not all(key in result for key in ['job_qualification', 'keywords']):
                missing_keys = [key for key in ['job_qualification', 'keywords'] if key not in result]
                raise ValueError(f"Response missing required keys: {missing_keys}. Response was: {response_text[:500]}")

            # Update the job_detail record with extracted data
            # Convert keywords list to PostgreSQL array format
            keywords = result.get('keywords', [])

            update_query = text("""
                UPDATE job_detail
                SET job_qualification = :job_qualification,
                    job_keyword = :job_keyword
                WHERE job_id = :job_id
            """)

            self.db.execute(update_query, {
                "job_id": job_id,
                "job_qualification": result.get('job_qualification', ''),
                "job_keyword": keywords
            })
            self.db.commit()

            return result

        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from markdown code blocks
            import re

            # Print debug info for troubleshooting
            print(f"DEBUG: JSON parsing failed. Response text: {response_text[:1000]}", file=sys.stderr, flush=True)

            # Try multiple regex patterns to extract JSON
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if not json_match:
                # Try without code blocks, just find JSON object
                json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))

                    # Validate structure in markdown block too
                    if not all(key in result for key in ['job_qualification', 'keywords']):
                        missing_keys = [key for key in ['job_qualification', 'keywords'] if key not in result]
                        raise ValueError(f"Response missing required keys: {missing_keys}")

                    # Update the job_detail record
                    # Convert keywords list to PostgreSQL array format
                    keywords = result.get('keywords', [])

                    update_query = text("""
                        UPDATE job_detail
                        SET job_qualification = :job_qualification,
                            job_keyword = :job_keyword
                        WHERE job_id = :job_id
                    """)

                    self.db.execute(update_query, {
                        "job_id": job_id,
                        "job_qualification": result.get('job_qualification', ''),
                        "job_keyword": keywords
                    })
                    self.db.commit()

                    return result
                except (json.JSONDecodeError, KeyError) as e:
                    raise ValueError(f"Failed to parse JSON from markdown block: {str(e)}")

            raise ValueError(f"Failed to parse AI response as JSON. Original error: {type(e).__name__}: {str(e)}. Full response: {response_text}")

    def resume_rewrite(
        self,
        resume_markdown: str,
        job_desc: str,
        keyword_final: list,
        focus_final: list,
        job_title: str,
        position_title: str,
        title_line_no: int
    ) -> dict:
        """
        Rewrite a resume based on job description and keywords using AI.

        Args:
            resume_markdown: Original markdown resume content
            job_desc: Job description text
            keyword_final: List of final keywords to incorporate
            focus_final: List of focus areas to emphasize
            job_title: Target job title
            position_title: Current position title in resume
            title_line_no: Line number of position title

        Returns:
            Dictionary containing:
                - resume_md_rewrite: rewritten markdown resume
                - suggestion: list of improvement suggestions

        Raises:
            ValueError: If AI response parsing fails
        """
        # Load the prompt template
        prompt_template = self._load_prompt('resume_rewrite')

        # Format lists for the prompt
        keyword_final_str = "\n".join([f"- {kw}" for kw in keyword_final]) if keyword_final else "None"
        focus_final_str = "\n".join([f"- {focus}" for focus in focus_final]) if focus_final else "None"

        # Format the prompt with variables using replace to avoid issues with curly braces
        # Handle None values by converting to empty string
        prompt = prompt_template.replace('{resume_markdown}', resume_markdown or '')
        prompt = prompt.replace('{job_desc}', job_desc or '')
        prompt = prompt.replace('{keyword_final}', keyword_final_str)
        prompt = prompt.replace('{focus_final}', focus_final_str)
        prompt = prompt.replace('{job_title}', job_title or '')
        prompt = prompt.replace('{position_title}', position_title or '')
        prompt = prompt.replace('{title_line_no}', str(title_line_no) if title_line_no is not None else '0')

        # Make API call to OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Expert resume writer and career consultant. You rewrite resumes to optimize for specific job opportunities while maintaining authenticity and providing structured output in JSON format."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the response content
        response_text = response.choices[0].message.content

        # Parse JSON response
        try:
            # Try to parse the response as JSON
            result = json.loads(response_text)

            # Validate the structure - only require 'resume_md_rewrite'
            # Note: 'suggestions' has been removed from requirements as per user request
            required_keys = ['resume_md_rewrite']
            if not all(key in result for key in required_keys):
                missing_keys = [key for key in required_keys if key not in result]
                print(f"DEBUG resume_rewrite: Missing keys: {missing_keys}", file=sys.stderr, flush=True)
                print(f"DEBUG resume_rewrite: Available keys: {list(result.keys())}", file=sys.stderr, flush=True)
                print(f"DEBUG resume_rewrite: Response preview: {response_text[:500]}", file=sys.stderr, flush=True)
                raise ValueError(f"Response missing required keys: {missing_keys}. Available keys: {list(result.keys())}")

            # Set suggestion to empty list (feature disabled for now)
            result['suggestion'] = []

            return result

        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                    # Set suggestion to empty list (feature disabled for now)
                    result['suggestion'] = []
                    return result
                except json.JSONDecodeError:
                    pass

            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

    def html_styling_diff(
        self,
        resume_markdown: str,
        resume_html_rewrite: str
    ) -> dict:
        """
        Convert markdown resume to HTML using the styling from an HTML rewrite,
        and generate a diff of text content changes.

        Args:
            resume_markdown: Original markdown resume content
            resume_html_rewrite: HTML rewritten resume to use for styling reference

        Returns:
            Dictionary containing:
                - new_html_file: HTML version of markdown with same styling as rewrite
                - text_changes: list of text differences between documents

        Raises:
            ValueError: If AI response parsing fails
        """
        # Load the prompt template
        prompt_template = self._load_prompt('html_and_diff')

        # Format the prompt with variables using replace to avoid issues with curly braces
        prompt = prompt_template.replace('{resume_markdown}', resume_markdown or '')
        prompt = prompt.replace('{resume_html_rewrite}', resume_html_rewrite or '')

        # Make API call to OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Expert HTML developer and diff analyzer. You convert markdown to HTML matching existing styling and identify text content differences in structured JSON format."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the response content
        response_text = response.choices[0].message.content

        # Debug: print the raw response
        print(f"DEBUG html_styling_diff: Raw OpenAI response length: {len(response_text)}", file=sys.stderr, flush=True)
        print(f"DEBUG html_styling_diff: First 500 chars: {repr(response_text[:500])}", file=sys.stderr, flush=True)

        # Parse JSON response
        try:
            # Try to parse the response as JSON with strict=False to handle invalid escapes
            result = json.loads(response_text, strict=False)

            # Validate the structure
            if not all(key in result for key in ['new_html_file', 'text_changes']):
                raise ValueError("Response missing required keys")

            return result

        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from markdown code blocks
            import re
            print(f"DEBUG html_styling_diff: JSON parsing failed, trying markdown extraction", file=sys.stderr, flush=True)

            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                try:
                    extracted_json = json_match.group(1)
                    print(f"DEBUG html_styling_diff: Extracted JSON length: {len(extracted_json)}", file=sys.stderr, flush=True)
                    result = json.loads(extracted_json, strict=False)

                    # Validate structure
                    if not all(key in result for key in ['new_html_file', 'text_changes']):
                        raise ValueError("Response missing required keys")

                    return result
                except json.JSONDecodeError as e2:
                    print(f"DEBUG html_styling_diff: Markdown extraction also failed: {str(e2)}", file=sys.stderr, flush=True)
                    pass

            # Print more debug info
            print(f"DEBUG html_styling_diff: Full response:\n{response_text[:2000]}", file=sys.stderr, flush=True)
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

    def write_cover_letter(self, letter_tone: str, letter_length: str, instruction: str,
                          job_desc: str, company: str, job_title: str, resume_md_rewrite: str,
                          first_name: str, last_name: str, city: str, state: str,
                          email: str, phone: str) -> dict:
        """
        Generate a cover letter using AI based on job details and resume.

        Args:
            letter_tone: Tone of the cover letter (professional, casual, enthusiastic, informational)
            letter_length: Length of the cover letter (short, medium, long)
            instruction: Additional instructions for cover letter generation
            job_desc: Job description text
            company: Company name
            job_title: Job position title
            resume_md_rewrite: Resume markdown content
            first_name: Applicant's first name
            last_name: Applicant's last name
            city: Applicant's city
            state: Applicant's state
            email: Applicant's email address
            phone: Applicant's phone number

        Returns:
            Dictionary containing:
                - letter_content: Generated cover letter in markdown format

        Raises:
            ValueError: If AI response cannot be parsed
        """
        # Load the prompt template
        prompt_template = self._load_prompt('cover_letter')

        # Format the prompt with all variables
        prompt = prompt_template.replace('{letter_tone}', letter_tone)
        prompt = prompt.replace('{letter_length}', letter_length)
        prompt = prompt.replace('{instruction}', instruction or '')
        prompt = prompt.replace('{job_desc}', job_desc or '')
        prompt = prompt.replace('{company}', company or '')
        prompt = prompt.replace('{job_title}', job_title or '')
        prompt = prompt.replace('{resume_md_rewrite}', resume_md_rewrite or '')
        prompt = prompt.replace('{first_name}', first_name or '')
        prompt = prompt.replace('{last_name}', last_name or '')
        prompt = prompt.replace('{city}', city or '')
        prompt = prompt.replace('{state}', state or '')
        prompt = prompt.replace('{phone}', phone or '')
        prompt = prompt.replace('{email}', email or '')

        print(f"DEBUG write_cover_letter: Generating cover letter for {company} - {job_title}", file=sys.stderr, flush=True)

        # Make API call to OpenAI
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a professional job finding coach that specializes in writing cover letters. You write personalized, compelling cover letters that highlight the candidate's strengths and match with the job requirements."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the response content
        response_text = response.choices[0].message.content

        print(f"DEBUG write_cover_letter: Received response from AI", file=sys.stderr, flush=True)

        # Parse JSON response
        try:
            # Try to parse the response as JSON
            result = json.loads(response_text)

            # Validate required key
            if 'letter_content' not in result:
                print(f"DEBUG write_cover_letter: Response missing 'letter_content' key. Available keys: {list(result.keys())}", file=sys.stderr, flush=True)
                raise ValueError(f"Response missing required key: 'letter_content'. Available keys: {list(result.keys())}")

            print(f"DEBUG write_cover_letter: Successfully parsed response", file=sys.stderr, flush=True)
            return result

        except json.JSONDecodeError as e:
            print(f"DEBUG write_cover_letter: JSON decode failed: {str(e)}", file=sys.stderr, flush=True)
            # If JSON parsing fails, try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                    if 'letter_content' in result:
                        print(f"DEBUG write_cover_letter: Successfully extracted from markdown", file=sys.stderr, flush=True)
                        return result
                except json.JSONDecodeError as e2:
                    print(f"DEBUG write_cover_letter: Markdown extraction also failed: {str(e2)}", file=sys.stderr, flush=True)
                    pass

            # Print debug info
            print(f"DEBUG write_cover_letter: Full response:\n{response_text[:2000]}", file=sys.stderr, flush=True)
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
