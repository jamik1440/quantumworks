"""
AI-Powered Talent Matching Service
Matches freelancers to projects using Google Gemini API.
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json
from backend import models
from backend.services.gemini_service import call_gemini_api

# Comprehensive matching prompt template
COMPREHENSIVE_MATCHING_PROMPT = """
You are an advanced AI talent matching system for a freelance marketplace. Your goal is to accurately match freelancers with projects based on multiple factors while avoiding bias.

**PROJECT INFORMATION:**
{{
  "id": {project_id},
  "title": "{project_title}",
  "description": "{project_description}",
  "required_skills": {required_skills},
  "category": "{category}",
  "budget_range": {{"min": {budget_min}, "max": {budget_max}}}
}}

**FREELANCER PROFILE:**
{{
  "id": {freelancer_id},
  "skills": {freelancer_skills},
  "bio": "{bio}",
  "hourly_rate": {hourly_rate},
  "location": "{location}"
}}

**PERFORMANCE METRICS:**
{{
  "average_rating": {avg_rating},
  "total_reviews": {total_reviews},
  "completed_projects": {completed_count},
  "completion_rate": {completion_rate},
  "on_time_delivery_rate": {on_time_rate},
  "positive_feedback_ratio": {positive_ratio}
}}

**PAST PROJECTS (Most relevant):**
{past_projects_summary}

**MATCHING CRITERIA (Weighted):**

1. **Skill Match (40%):**
   - Exact skill matches: +0.4 per match
   - Semantic skill similarities: +0.2-0.3 per similar skill
   - Consider skill depth, not just breadth

2. **Experience Relevance (25%):**
   - Similar past projects: +0.2-0.25
   - Domain expertise: +0.1-0.15
   - Complexity handling: +0.05-0.1

3. **Performance Indicators (20%):**
   - Ratings above 4.5: +0.15
   - High completion rate: +0.05
   - On-time delivery: +0.05
   - Note: New freelancers (no reviews) get neutral 0.10

4. **Temporal Factors (10%):**
   - Active profile: +0.05
   - Profile completeness: +0.05

5. **Budget Alignment (5%):**
   - Rate within budget: +0.05
   - Slightly outside but reasonable: +0.02-0.03

**BIAS MITIGATION (CRITICAL):**
- DO NOT consider: age, gender, location (unless project requires it), ethnicity, name
- DO NOT favor: popular skills over niche skills, common names over unique names
- DO NOT assume: skill level based on project count, experience from years alone
- DO consider: actual performance metrics, skill relevance, project quality
- If freelancer is new (no reviews), assign neutral scores (0.5-0.6) for performance, not zero

**OUTPUT REQUIREMENTS:**
Provide a comprehensive matching analysis in JSON format:

{{
  "match_score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "breakdown": {{
    "skill_match": {{
      "score": 0.0-1.0,
      "exact_matches": ["skill1", "skill2"],
      "semantic_matches": ["skill3 → related_skill"],
      "missing_skills": ["skill4"],
      "explanation": "..."
    }},
    "experience_match": {{
      "score": 0.0-1.0,
      "relevant_projects_count": 3,
      "domain_expertise": "high|medium|low",
      "explanation": "..."
    }},
    "performance_score": {{
      "score": 0.0-1.0,
      "rating_contribution": 0.0-0.15,
      "completion_contribution": 0.0-0.05,
      "explanation": "..."
    }},
    "temporal_score": {{
      "score": 0.0-1.0,
      "activity_level": "high|medium|low",
      "profile_completeness": 0.0-1.0
    }},
    "budget_alignment": {{
      "score": 0.0-1.0,
      "rate_vs_budget": "within|slightly_above|slightly_below|out_of_range"
    }}
  }},
  "recommendation": "strong_match|good_match|moderate_match|weak_match|poor_match",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "ai_explanation": "Detailed explanation of the match score and reasoning"
}}

**IMPORTANT:**
- Be objective and data-driven
- Avoid assumptions not supported by provided data
- If information is missing, use neutral values, not zeros
- Provide honest assessments, not inflated scores
"""

class MatchingService:
    """AI-powered talent matching service."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def match_freelancers_to_project(
        self, 
        project_id: int, 
        limit: int = 10,
        min_score: float = 0.3
    ) -> List[Dict]:
        """Match freelancers to a project and return top matches."""
        
        # Get project
        project = self.db.query(models.Project).filter(
            models.Project.id == project_id
        ).first()
        
        if not project:
            return []
        
        # Get all active freelancers
        # Note: When Profile model is added, join with Profile table
        freelancers = self.db.query(models.User).filter(
            models.User.role == 'freelancer',
            models.User.is_active == True
        ).all()
        
        matches = []
        
        for freelancer in freelancers:
            try:
                match_result = await self._calculate_match(
                    project=project,
                    freelancer=freelancer
                )
                
                if match_result and match_result.get('match_score', 0) >= min_score:
                    matches.append({
                        'freelancer_id': freelancer.id,
                        'freelancer_name': freelancer.full_name,
                        **match_result
                    })
            except Exception as e:
                print(f"Error matching freelancer {freelancer.id}: {e}")
                continue
        
        # Sort by match_score descending
        matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        
        return matches[:limit]
    
    async def _calculate_match(
        self,
        project: models.Project,
        freelancer: models.User
    ) -> Optional[Dict]:
        """Calculate comprehensive match score using AI."""
        
        # Note: This implementation assumes Profile/Review/Task models exist
        # For current schema, use placeholder values
        # TODO: Update when Profile, Review, Task models are added
        
        # Try to get profile if exists
        profile = getattr(freelancer, 'profile', None)
        
        # Get performance metrics (if Review model exists)
        try:
            reviews = self.db.query(models.Review).filter(
                models.Review.reviewee_id == freelancer.id
            ).all() if hasattr(models, 'Review') else []
        except:
            reviews = []
        
        # Get tasks (if Task model exists)
        try:
            tasks = self.db.query(models.Task).filter(
                models.Task.freelancer_id == freelancer.id
            ).all() if hasattr(models, 'Task') else []
        except:
            tasks = []
        
        # Calculate metrics
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else None
        completed_tasks = [t for t in tasks if getattr(t, 'status', None) == 'completed'] if tasks else []
        completion_rate = len(completed_tasks) / len(tasks) if tasks else None
        
        # Get past projects (via completed tasks or direct ownership)
        if completed_tasks:
            project_ids = [getattr(t, 'project_id', None) for t in completed_tasks[:10]]
            project_ids = [pid for pid in project_ids if pid]
            past_projects = self.db.query(models.Project).filter(
                models.Project.id.in_(project_ids)
            ).all() if project_ids else []
        else:
            # Fallback: get projects authored by freelancer (if applicable)
            past_projects = []
        
        # Prepare past projects summary
        past_projects_summary = []
        for p in past_projects[:5]:
            skills_list = p.skills if isinstance(p.skills, list) else (p.skills.split(',') if p.skills else [])
            past_projects_summary.append({
                "id": p.id,
                "title": p.title,
                "description": (p.description or "")[:200],
                "skills": skills_list,
                "category": p.category or ""
            })
        
        # Prepare skills lists
        project_skills = project.skills if isinstance(project.skills, list) else (project.skills.split(',') if project.skills else [])
        
        # Get freelancer skills (from profile if exists, otherwise empty)
        if profile:
            freelancer_skills = profile.skills if isinstance(profile.skills, list) else (profile.skills.split(',') if profile.skills else [])
        else:
            # Fallback: no skills available for current schema
            freelancer_skills = []
        
        # Build prompt
        prompt = COMPREHENSIVE_MATCHING_PROMPT.format(
            project_id=project.id,
            project_title=project.title.replace('"', '\\"'),
            project_description=(project.description or "").replace('"', '\\"'),
            required_skills=json.dumps(project_skills),
            category=project.category or "",
            budget_min=float(project.budget_min or 0),
            budget_max=float(project.budget_max or 0),
            
            freelancer_id=freelancer.id,
            freelancer_skills=json.dumps(freelancer_skills),
            bio=(profile.bio if profile and hasattr(profile, 'bio') else "").replace('"', '\\"'),
            hourly_rate=float(profile.hourly_rate if profile and hasattr(profile, 'hourly_rate') else 0),
            location=profile.location if profile and hasattr(profile, 'location') else "",
            
            avg_rating=float(avg_rating) if avg_rating else 0,
            total_reviews=len(reviews),
            completed_count=len(completed_tasks),
            completion_rate=float(completion_rate) if completion_rate else 0,
            on_time_rate=0.95,  # Calculate properly in production
            positive_ratio=len([r for r in reviews if r.rating >= 4]) / len(reviews) if reviews else 0,
            
            past_projects_summary=json.dumps(past_projects_summary, indent=2)
        )
        
        # Call Gemini API
        try:
            response_text = await call_gemini_api(
                prompt,
                model="gemini-2.0-flash-exp",
                temperature=0.3
            )
            
            # Parse response
            # Try to extract JSON from response (might have markdown formatting)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            match_data = json.loads(response_text)
            
            # Add timestamp
            match_data['timestamp'] = datetime.utcnow().isoformat()
            
            # Validate structure
            if 'match_score' in match_data:
                return match_data
            else:
                print(f"Invalid response format from Gemini: {response_text[:200]}")
                return None
                
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response: {response_text[:500]}")
            return None
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return None


def get_matching_service(db: Session) -> MatchingService:
    """Factory function to get matching service instance."""
    return MatchingService(db)

