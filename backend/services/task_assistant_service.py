"""
AI Task Creation Assistant Service
Helps users create high-quality project/task postings from unstructured text.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import re
from backend.services.gemini_service import call_gemini_api

# Prompt templates
INITIAL_PARSING_PROMPT = """
You are an expert project requirements analyst. Your task is to extract structured information from unstructured user input about a project/task they want to post.

**USER INPUT:**
{user_input}

**OPTIONAL CONTEXT:**
- Budget: {budget}
- Deadline: {deadline}

**TASK:**
Extract and structure the following information:

1. **Title**: A clear, concise project title (max 60 characters)
2. **Description**: A well-structured project description (50-2000 characters)
3. **Category**: One of: Development, Design, Marketing, AI
4. **Required Skills**: List of technical skills/tools needed
5. **Scope**: Brief, Medium, Large, Enterprise
6. **Complexity**: Simple, Moderate, Complex, Very Complex
7. **Budget Range** (if not provided): Estimate min and max in USD
8. **Timeline** (if not provided): Estimate in days/weeks
9. **Missing Information**: What critical details are unclear or missing?

**OUTPUT FORMAT (JSON):**
{{
  "extracted_data": {{
    "title": "string",
    "description": "string",
    "category": "Development|Design|Marketing|AI",
    "required_skills": ["skill1", "skill2"],
    "scope": "Brief|Medium|Large|Enterprise",
    "complexity": "Simple|Moderate|Complex|Very Complex"
  }},
  "budget_estimate": {{
    "min": 0,
    "max": 0,
    "currency": "USD",
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  }},
  "timeline_estimate": {{
    "duration_days": 0,
    "duration_weeks": 0,
    "confidence": 0.0-1.0,
    "reasoning": "explanation"
  }},
  "missing_information": [
    {{
      "field": "field_name",
      "severity": "critical|important|nice_to_have",
      "question": "What specific question to ask user",
      "reason": "Why this information is needed"
    }}
  ],
  "confidence_score": 0.0-1.0,
  "needs_clarification": true|false
}}
"""

FOLLOW_UP_QUESTIONS_PROMPT = """
You are a helpful project assistant. The user provided initial project information, but some critical details are missing or unclear.

**EXTRACTED DATA SO FAR:**
{extracted_data}

**MISSING INFORMATION:**
{missing_info}

**TASK:**
Generate 2-4 follow-up questions to clarify the missing information. Questions should be:
- Clear and specific
- Not overwhelming (max 4 questions)
- Prioritized by importance (critical first)
- Conversational and helpful

**OUTPUT FORMAT (JSON):**
{{
  "questions": [
    {{
      "id": "q1",
      "question": "What specific features do you need?",
      "field": "description",
      "priority": "critical|important|nice_to_have",
      "expected_answer_type": "list|text|number|date"
    }}
  ],
  "context_summary": "Brief summary of what we know so far",
  "next_steps": "What happens after user answers"
}}
"""

BUDGET_DEADLINE_PROMPT = """
You are a freelance marketplace pricing expert. Based on project requirements, suggest realistic budget and deadline.

**PROJECT DETAILS:**
{{
  "title": "{title}",
  "description": "{description}",
  "category": "{category}",
  "required_skills": {skills},
  "scope": "{scope}",
  "complexity": "{complexity}"
}}

**MARKET DATA (for reference):**
- Average hourly rate by category:
  - Development: $25-100/hour
  - Design: $20-80/hour
  - Marketing: $15-60/hour
  - AI: $50-150/hour
- Typical project durations:
  - Brief: 1-7 days
  - Medium: 1-4 weeks
  - Large: 1-3 months
  - Enterprise: 3+ months

**TASK:**
Suggest realistic budget range and deadline based on:
1. Project complexity and scope
2. Required skills (specialized skills = higher rates)
3. Market rates for the category
4. Typical project timelines

**OUTPUT FORMAT (JSON):**
{{
  "budget_suggestion": {{
    "min": 0,
    "max": 0,
    "currency": "USD",
    "hourly_equivalent": {{
      "min": 0,
      "max": 0
    }},
    "reasoning": "Detailed explanation of budget calculation",
    "confidence": 0.0-1.0
  }},
  "deadline_suggestion": {{
    "duration_days": 0,
    "duration_weeks": 0,
    "suggested_deadline_date": "YYYY-MM-DD",
    "reasoning": "Detailed explanation of timeline",
    "confidence": 0.0-1.0,
    "milestones": [
      {{
        "name": "Milestone 1",
        "days_from_start": 0,
        "deliverable": "description"
      }}
    ]
  }},
  "recommendations": [
    "Consider breaking into phases",
    "Budget allows for mid-level freelancer",
    "Timeline is realistic for scope"
  ]
}}
"""

FINAL_GENERATION_PROMPT = """
You are a project data validator. Generate the final, complete, validated project JSON ready for posting.

**COMPLETE PROJECT DATA:**
{complete_data}

**USER PROVIDED:**
- Budget: {budget}
- Deadline: {deadline}

**TASK:**
Generate a final, validated project JSON that:
1. Has all required fields
2. Meets validation rules
3. Is ready for API submission
4. Includes enhanced description (if needed)

**VALIDATION RULES:**
- Title: 10-60 characters, descriptive
- Description: 50-2000 characters, well-structured
- Category: Must be one of: Development, Design, Marketing, AI
- Skills: Array of strings, each 2-30 characters
- Budget: Valid format (string like "$500-$1000" or "Fixed: $500")
- Status: Default to "pending" for new projects

**OUTPUT FORMAT (JSON):**
{{
  "title": "string",
  "description": "string (enhanced if needed)",
  "category": "Development|Design|Marketing|AI",
  "skills": "comma-separated string",
  "budget": "string",
  "status": "pending",
  "metadata": {{
    "ai_generated": true,
    "confidence": 0.0-1.0,
    "enhancements_applied": ["description_enhanced", "skills_extracted"],
    "original_input": "{user_input}"
  }}
}}
"""

# Validation rules
VALIDATION_RULES = {
    "title": {
        "min_length": 10,
        "max_length": 60
    },
    "description": {
        "min_length": 50,
        "max_length": 2000
    },
    "category": {
        "allowed_values": ["Development", "Design", "Marketing", "AI"]
    },
    "skills": {
        "min_count": 1,
        "max_count": 10
    }
}


class TaskAssistantService:
    """AI-powered task creation assistant."""
    
    async def parse_user_input(
        self,
        user_input: str,
        budget: Optional[str] = None,
        deadline: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stage 1: Parse unstructured user input into structured data.
        
        Returns:
            Dict with extracted_data, budget_estimate, timeline_estimate, missing_information
        """
        prompt = INITIAL_PARSING_PROMPT.format(
            user_input=user_input,
            budget=budget or "Not provided",
            deadline=deadline or "Not provided"
        )
        
        try:
            response = await call_gemini_api(prompt, temperature=0.3)
            
            # Parse JSON from response
            json_text = self._extract_json(response)
            result = json.loads(json_text)
            
            return result
        except Exception as e:
            print(f"Error parsing user input: {e}")
            # Return fallback structure
            return {
                "extracted_data": {},
                "budget_estimate": {"min": 0, "max": 0, "confidence": 0.0},
                "timeline_estimate": {"duration_days": 0, "confidence": 0.0},
                "missing_information": [],
                "confidence_score": 0.0,
                "needs_clarification": True
            }
    
    async def generate_follow_up_questions(
        self,
        extracted_data: Dict,
        missing_info: List[Dict]
    ) -> Dict[str, Any]:
        """
        Stage 2: Generate follow-up questions for missing information.
        """
        prompt = FOLLOW_UP_QUESTIONS_PROMPT.format(
            extracted_data=json.dumps(extracted_data, indent=2),
            missing_info=json.dumps(missing_info, indent=2)
        )
        
        try:
            response = await call_gemini_api(prompt, temperature=0.4)
            json_text = self._extract_json(response)
            result = json.loads(json_text)
            return result
        except Exception as e:
            print(f"Error generating follow-up questions: {e}")
            return {
                "questions": [],
                "context_summary": "Unable to generate questions",
                "next_steps": "Please provide more details"
            }
    
    async def suggest_budget_and_deadline(
        self,
        title: str,
        description: str,
        category: str,
        skills: List[str],
        scope: str,
        complexity: str
    ) -> Dict[str, Any]:
        """
        Stage 3: Suggest realistic budget and deadline.
        """
        prompt = BUDGET_DEADLINE_PROMPT.format(
            title=title,
            description=description,
            category=category,
            skills=json.dumps(skills),
            scope=scope,
            complexity=complexity
        )
        
        try:
            response = await call_gemini_api(prompt, temperature=0.3)
            json_text = self._extract_json(response)
            result = json.loads(json_text)
            return result
        except Exception as e:
            print(f"Error suggesting budget/deadline: {e}")
            return {
                "budget_suggestion": {"min": 0, "max": 0, "confidence": 0.0},
                "deadline_suggestion": {"duration_days": 0, "confidence": 0.0},
                "recommendations": []
            }
    
    async def generate_final_json(
        self,
        complete_data: Dict,
        user_input: str,
        budget: Optional[str] = None,
        deadline: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stage 4: Generate final, validated project JSON.
        """
        prompt = FINAL_GENERATION_PROMPT.format(
            complete_data=json.dumps(complete_data, indent=2),
            budget=budget or "Not provided",
            deadline=deadline or "Not provided",
            user_input=user_input[:500]  # Truncate for prompt
        )
        
        try:
            response = await call_gemini_api(prompt, temperature=0.2)  # Lower temp for consistency
            json_text = self._extract_json(response)
            result = json.loads(json_text)
            
            # Validate result
            validated = self._validate_final_json(result)
            return validated
        except Exception as e:
            print(f"Error generating final JSON: {e}")
            return {}
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from Gemini response (may have markdown formatting)."""
        # Try to find JSON in markdown code blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            return text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            return text[start:end].strip()
        else:
            # Assume entire response is JSON
            return text.strip()
    
    def _validate_final_json(self, data: Dict) -> Dict:
        """Validate and fix final JSON according to rules."""
        # Validate title
        if "title" in data:
            title = data["title"]
            if len(title) < VALIDATION_RULES["title"]["min_length"]:
                data["title"] = title + " Project"  # Fallback
            elif len(title) > VALIDATION_RULES["title"]["max_length"]:
                data["title"] = title[:57] + "..."
        
        # Validate description
        if "description" in data:
            desc = data["description"]
            if len(desc) < VALIDATION_RULES["description"]["min_length"]:
                data["description"] = desc + " " + "Additional details needed."
            elif len(desc) > VALIDATION_RULES["description"]["max_length"]:
                data["description"] = desc[:1997] + "..."
        
        # Validate category
        if "category" in data:
            if data["category"] not in VALIDATION_RULES["category"]["allowed_values"]:
                data["category"] = "Development"  # Default
        
        # Validate skills
        if "skills" in data:
            if isinstance(data["skills"], str):
                skills_list = [s.strip() for s in data["skills"].split(",")]
            else:
                skills_list = data["skills"]
            
            # Filter valid skills
            valid_skills = [
                s for s in skills_list
                if 2 <= len(s) <= 30
            ][:VALIDATION_RULES["skills"]["max_count"]]
            
            if not valid_skills:
                valid_skills = ["General"]  # Fallback
            
            data["skills"] = ", ".join(valid_skills)
        
        # Ensure status
        if "status" not in data:
            data["status"] = "pending"
        
        return data
    
    def check_completeness(self, extracted_data: Dict) -> Dict:
        """Check if all required fields are present and valid."""
        missing = []
        invalid = []
        
        required_fields = ["title", "description", "category", "skills"]
        for field in required_fields:
            if field not in extracted_data or not extracted_data[field]:
                missing.append(field)
        
        # Validate category
        if extracted_data.get("category") not in VALIDATION_RULES["category"]["allowed_values"]:
            invalid.append("category")
        
        # Validate skills
        skills = extracted_data.get("required_skills", [])
        if not skills or len(skills) == 0:
            missing.append("skills")
        elif len(skills) > VALIDATION_RULES["skills"]["max_count"]:
            invalid.append("skills")
        
        completeness_score = 1.0 - (len(missing) + len(invalid)) / len(required_fields)
        
        return {
            "is_complete": len(missing) == 0 and len(invalid) == 0,
            "missing_fields": missing,
            "invalid_fields": invalid,
            "completeness_score": max(0.0, completeness_score)
        }


def get_task_assistant_service() -> TaskAssistantService:
    """Factory function to get task assistant service instance."""
    return TaskAssistantService()

