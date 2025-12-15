"""
Google Gemini API Service
Handles all interactions with Google Gemini API for AI-powered features.
"""
import os
import json
from typing import Optional, Dict, Any
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

import asyncio

async def call_gemini_api(
    prompt: str,
    model: str = "gemini-2.0-flash-exp",
    temperature: float = 0.3,
    response_schema: Optional[Dict[str, Any]] = None
) -> str:
    """
    Call Google Gemini API with optional structured output (Async).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured. Set GEMINI_API_KEY environment variable.")
    
    try:
        # Create model
        generation_config = {
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Add structured output if schema provided
        if response_schema:
            generation_config.update({
                "response_mime_type": "application/json",
                "response_schema": response_schema
            })
        
        model_instance = genai.GenerativeModel(
            model_name=model,
            generation_config=generation_config
        )
        
        # Generate content with timeout
        # Using 15s timeout as per readiness report recommendation (allow slightly more than 10s)
        response = await asyncio.wait_for(
            model_instance.generate_content_async(prompt),
            timeout=15.0
        )
        
        return response.text
        
    except asyncio.TimeoutError:
        print("Gemini API Timeout")
        raise Exception("AI service timed out. Please try again.")
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise

async def calculate_semantic_similarity(skills1: list, skills2: list) -> float:
    """
    Calculate semantic similarity between two skill sets using Gemini.
    Returns similarity score 0.0 to 1.0.
    """
    if not skills1 or not skills2:
        return 0.0
    
    prompt = f"""
Evaluate how semantically similar these two sets of skills are.

**Skills Set 1:** {', '.join(skills1)}
**Skills Set 2:** {', '.join(skills2)}

Consider:
- Exact matches (same skill name)
- Semantic similarities (e.g., "JavaScript" ≈ "JS", "React" ≈ "React.js")
- Related technologies (e.g., "Vue" is somewhat related to "React")
- Domain similarities (e.g., frontend skills are related)

Return a JSON object:
{{
  "similarity_score": 0.0-1.0,
  "exact_matches": ["skill1", "skill2"],
  "semantic_matches": [
    {{"skill1": "X", "skill2": "Y", "similarity": 0.8}}
  ],
  "explanation": "Brief explanation"
}}
"""
    
    try:
        response = await call_gemini_api(prompt, temperature=0.2)
        result = json.loads(response)
        return result.get("similarity_score", 0.0)
    except Exception as e:
        print(f"Error calculating semantic similarity: {e}")
        # Fallback: simple overlap calculation
        set1 = set(s.lower() for s in skills1)
        set2 = set(s.lower() for s in skills2)
        if not set1 or not set2:
            return 0.0
        return len(set1 & set2) / len(set1 | set2)

