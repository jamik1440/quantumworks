# 🤖 AI Task Creation Assistant - Design Document

## Executive Summary

An AI-powered assistant that helps users create high-quality project/task postings by converting unstructured text into structured data, detecting unclear requirements, and suggesting realistic budgets and deadlines.

---

## 1. 🎯 System Architecture

### 1.1 Workflow

```
User Input (Unstructured Text)
    ↓
[Stage 1: Initial Parsing]
    ↓
Structured Data Extraction
    ↓
[Stage 2: Validation & Gap Detection]
    ↓
Missing/Unclear Requirements?
    ├─ YES → Generate Follow-up Questions → User Response → Loop
    └─ NO → [Stage 3: Enhancement & Suggestions]
    ↓
Budget & Deadline Suggestions
    ↓
[Stage 4: Final JSON Generation]
    ↓
Structured Task Data (Ready to Post)
```

### 1.2 Three-Stage Processing

1. **Parsing Stage**: Extract structured data from raw text
2. **Clarification Stage**: Detect gaps and ask follow-up questions
3. **Enhancement Stage**: Suggest budget, deadline, and finalize structure

---

## 2. 📝 Prompt Design

### 2.1 Stage 1: Initial Parsing Prompt

```python
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
2. **Description**: A well-structured project description
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
```

### 2.2 Stage 2: Follow-up Questions Prompt

```python
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
      "question": "What specific features do you need in the e-commerce website?",
      "field": "description",
      "priority": "critical|important|nice_to_have",
      "expected_answer_type": "list|text|number|date"
    }}
  ],
  "context_summary": "Brief summary of what we know so far",
  "next_steps": "What happens after user answers"
}}
"""
```

### 2.3 Stage 3: Budget & Deadline Suggestion Prompt

```python
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
```

### 2.4 Stage 4: Final JSON Generation Prompt

```python
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
```

---

## 3. ✅ Validation Rules

### 3.1 Field Validation

```python
VALIDATION_RULES = {
    "title": {
        "required": True,
        "min_length": 10,
        "max_length": 60,
        "pattern": None,  # Any characters allowed
        "error_messages": {
            "too_short": "Title must be at least 10 characters",
            "too_long": "Title must not exceed 60 characters"
        }
    },
    "description": {
        "required": True,
        "min_length": 50,
        "max_length": 2000,
        "pattern": None,
        "error_messages": {
            "too_short": "Description must be at least 50 characters",
            "too_long": "Description must not exceed 2000 characters"
        }
    },
    "category": {
        "required": True,
        "allowed_values": ["Development", "Design", "Marketing", "AI"],
        "error_messages": {
            "invalid": "Category must be one of: Development, Design, Marketing, AI"
        }
    },
    "skills": {
        "required": True,
        "min_count": 1,
        "max_count": 10,
        "each_skill": {
            "min_length": 2,
            "max_length": 30
        },
        "error_messages": {
            "too_few": "At least 1 skill is required",
            "too_many": "Maximum 10 skills allowed",
            "invalid_skill": "Each skill must be 2-30 characters"
        }
    },
    "budget": {
        "required": True,
        "pattern": r"^\$?\d+(-\$?\d+)?$|^Fixed:\s?\$?\d+$|^\d+\s?USD$",
        "error_messages": {
            "invalid": "Budget must be in format: $500-$1000, Fixed: $500, or 500 USD"
        }
    }
}
```

### 3.2 Completeness Check

```python
def check_completeness(extracted_data: dict) -> dict:
    """Check if all required fields are present and valid."""
    missing = []
    invalid = []
    
    # Check required fields
    required_fields = ["title", "description", "category", "skills"]
    for field in required_fields:
        if field not in extracted_data or not extracted_data[field]:
            missing.append(field)
    
    # Validate category
    if extracted_data.get("category") not in ["Development", "Design", "Marketing", "AI"]:
        invalid.append("category")
    
    # Validate skills
    skills = extracted_data.get("skills", [])
    if not skills or len(skills) == 0:
        missing.append("skills")
    elif len(skills) > 10:
        invalid.append("skills")
    
    return {
        "is_complete": len(missing) == 0 and len(invalid) == 0,
        "missing_fields": missing,
        "invalid_fields": invalid,
        "completeness_score": 1.0 - (len(missing) + len(invalid)) / len(required_fields)
    }
```

---

## 4. 📊 Example Input → Output

### Example 1: Well-Structured Input

**Input:**
```
"I need a React e-commerce website with shopping cart, user authentication, and payment integration. Budget is around $2000. Need it done in 2 weeks."
```

**Stage 1 Output:**
```json
{
  "extracted_data": {
    "title": "React E-commerce Website with Payment Integration",
    "description": "Build a full-stack e-commerce website using React. Features include: shopping cart functionality, user authentication system, and payment integration (Stripe/PayPal). The website should be responsive and have an admin dashboard for managing products and orders.",
    "category": "Development",
    "required_skills": ["React", "Node.js", "Stripe API", "MongoDB", "Authentication"],
    "scope": "Medium",
    "complexity": "Moderate"
  },
  "budget_estimate": {
    "min": 1800,
    "max": 2500,
    "currency": "USD",
    "confidence": 0.9,
    "reasoning": "User provided budget of $2000, which aligns with medium-scope React projects"
  },
  "timeline_estimate": {
    "duration_days": 14,
    "duration_weeks": 2,
    "confidence": 0.95,
    "reasoning": "User specified 2 weeks, which is realistic for this scope"
  },
  "missing_information": [
    {
      "field": "description",
      "severity": "important",
      "question": "Do you need an admin dashboard for managing products?",
      "reason": "This affects project scope and timeline"
    }
  ],
  "confidence_score": 0.85,
  "needs_clarification": false
}
```

**Final Output:**
```json
{
  "title": "React E-commerce Website with Payment Integration",
  "description": "Build a full-stack e-commerce website using React. Features include: shopping cart functionality, user authentication system, and payment integration (Stripe/PayPal). The website should be responsive and have an admin dashboard for managing products and orders.",
  "category": "Development",
  "skills": "React, Node.js, Stripe API, MongoDB, Authentication",
  "budget": "$1800-$2500",
  "status": "pending",
  "metadata": {
    "ai_generated": true,
    "confidence": 0.85,
    "enhancements_applied": ["description_enhanced", "skills_extracted"],
    "original_input": "I need a React e-commerce website..."
  }
}
```

### Example 2: Unclear Input (Needs Clarification)

**Input:**
```
"I want a website for my business"
```

**Stage 1 Output:**
```json
{
  "extracted_data": {
    "title": "Business Website",
    "description": "Website for business (details needed)",
    "category": "Development",
    "required_skills": [],
    "scope": "Unknown",
    "complexity": "Unknown"
  },
  "budget_estimate": {
    "min": 0,
    "max": 0,
    "currency": "USD",
    "confidence": 0.1,
    "reasoning": "Insufficient information to estimate budget"
  },
  "timeline_estimate": {
    "duration_days": 0,
    "duration_weeks": 0,
    "confidence": 0.1,
    "reasoning": "Insufficient information to estimate timeline"
  },
  "missing_information": [
    {
      "field": "description",
      "severity": "critical",
      "question": "What type of website do you need? (e.g., portfolio, e-commerce, blog, business landing page)",
      "reason": "Essential to determine scope and requirements"
    },
    {
      "field": "required_skills",
      "severity": "critical",
      "question": "What technologies or features do you need? (e.g., React, WordPress, payment integration)",
      "reason": "Needed to match with appropriate freelancers"
    },
    {
      "field": "budget",
      "severity": "important",
      "question": "What is your budget range for this project?",
      "reason": "Helps suggest realistic expectations"
    }
  ],
  "confidence_score": 0.2,
  "needs_clarification": true
}
```

**Stage 2 Follow-up Questions:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What type of website do you need? (e.g., portfolio, e-commerce, blog, business landing page)",
      "field": "description",
      "priority": "critical",
      "expected_answer_type": "text"
    },
    {
      "id": "q2",
      "question": "What technologies or features do you need? (e.g., React, WordPress, payment integration, contact forms)",
      "field": "required_skills",
      "priority": "critical",
      "expected_answer_type": "list"
    },
    {
      "id": "q3",
      "question": "What is your budget range for this project?",
      "field": "budget",
      "priority": "important",
      "expected_answer_type": "number"
    },
    {
      "id": "q4",
      "question": "When do you need this completed?",
      "field": "deadline",
      "priority": "important",
      "expected_answer_type": "date"
    }
  ],
  "context_summary": "You want to create a website for your business, but we need more details to create an accurate project posting.",
  "next_steps": "After you answer these questions, I'll generate a complete project description with suggested budget and timeline."
}
```

### Example 3: Partial Input with Budget

**Input:**
```
"Need a logo design for my startup. Budget is $500."
```

**Stage 1 Output:**
```json
{
  "extracted_data": {
    "title": "Logo Design for Startup",
    "description": "Design a professional logo for a startup company. The logo should be modern, versatile, and suitable for various applications (website, business cards, social media).",
    "category": "Design",
    "required_skills": ["Logo Design", "Brand Identity", "Adobe Illustrator"],
    "scope": "Brief",
    "complexity": "Simple"
  },
  "budget_estimate": {
    "min": 400,
    "max": 600,
    "currency": "USD",
    "confidence": 0.95,
    "reasoning": "User provided $500, which is typical for logo design projects"
  },
  "timeline_estimate": {
    "duration_days": 5,
    "duration_weeks": 1,
    "confidence": 0.85,
    "reasoning": "Logo design typically takes 3-7 days for brief projects"
  },
  "missing_information": [
    {
      "field": "description",
      "severity": "nice_to_have",
      "question": "Do you have any specific style preferences or color schemes in mind?",
      "reason": "Helps designers understand your vision better"
    }
  ],
  "confidence_score": 0.90,
  "needs_clarification": false
}
```

**Budget/Deadline Suggestion:**
```json
{
  "budget_suggestion": {
    "min": 400,
    "max": 600,
    "currency": "USD",
    "hourly_equivalent": {
      "min": 40,
      "max": 60
    },
    "reasoning": "Logo design projects typically range from $300-$800. Your budget of $500 is in the mid-range, suitable for a professional designer with 2-5 years experience. This allows for 2-3 revision rounds and final deliverables in multiple formats.",
    "confidence": 0.95
  },
  "deadline_suggestion": {
    "duration_days": 5,
    "duration_weeks": 1,
    "suggested_deadline_date": "2024-01-22",
    "reasoning": "Logo design projects typically take 3-7 days. This includes initial concepts (1-2 days), revisions (1-2 days), and finalization (1 day). Rush orders may be possible but may incur additional fees.",
    "confidence": 0.85,
    "milestones": [
      {
        "name": "Initial Concepts",
        "days_from_start": 2,
        "deliverable": "2-3 logo concept options"
      },
      {
        "name": "Revisions",
        "days_from_start": 4,
        "deliverable": "Refined logo based on feedback"
      },
      {
        "name": "Final Delivery",
        "days_from_start": 5,
        "deliverable": "Final logo files in multiple formats (PNG, SVG, AI)"
      }
    ]
  },
  "recommendations": [
    "Budget is appropriate for a professional logo design",
    "Timeline of 5-7 days is realistic and allows for quality work",
    "Consider requesting logo variations (horizontal, vertical, icon-only) in the project scope"
  ]
}
```

---

## 5. 🔄 Conversation Flow

### 5.1 Single-Pass Flow (Complete Input)

```
User: "I need a React website with authentication. Budget $2000, 2 weeks."
    ↓
AI: Parse → Validate → Enhance
    ↓
Response: Complete project JSON + Suggestions
```

### 5.2 Multi-Pass Flow (Incomplete Input)

```
User: "I want a website"
    ↓
AI: Parse → Detect Missing Info
    ↓
Response: Follow-up Questions (Q1, Q2, Q3, Q4)
    ↓
User: Answers Q1-Q4
    ↓
AI: Merge Answers → Validate → Enhance
    ↓
Response: Complete project JSON + Suggestions
```

### 5.3 Iterative Refinement

```
User: "Logo design, $500"
    ↓
AI: Parse → Generate Initial JSON
    ↓
Response: "Here's your project. Would you like to add: style preferences, color scheme, usage requirements?"
    ↓
User: "Yes, add modern style, blue and white colors"
    ↓
AI: Update JSON → Finalize
    ↓
Response: Complete project JSON
```

---

## 6. 🎨 User Experience Design

### 6.1 Input Interface

```
┌─────────────────────────────────────────┐
│  🤖 AI Task Assistant                  │
├─────────────────────────────────────────┤
│                                         │
│  Describe your project:                 │
│  ┌───────────────────────────────────┐ │
│  │ I need a React e-commerce...     │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Optional:                              │
│  Budget: [_______]  Deadline: [____]   │
│                                         │
│  [✨ Generate Project]                 │
└─────────────────────────────────────────┘
```

### 6.2 Clarification Interface

```
┌─────────────────────────────────────────┐
│  📋 Let's clarify a few things...      │
├─────────────────────────────────────────┤
│                                         │
│  Q1: What type of website?              │
│  ○ Portfolio  ○ E-commerce  ○ Blog     │
│                                         │
│  Q2: What technologies?                │
│  [React] [Node.js] [MongoDB]           │
│                                         │
│  Q3: Budget range?                      │
│  [$500] - [$2000]                      │
│                                         │
│  [Continue]                             │
└─────────────────────────────────────────┘
```

### 6.3 Preview Interface

```
┌─────────────────────────────────────────┐
│  ✨ Your Project is Ready!              │
├─────────────────────────────────────────┤
│                                         │
│  Title: React E-commerce Website       │
│  Category: Development                  │
│  Skills: React, Node.js, MongoDB        │
│                                         │
│  💰 Suggested Budget: $1800-$2500      │
│  📅 Suggested Timeline: 2 weeks        │
│                                         │
│  [Edit] [Post Project]                  │
└─────────────────────────────────────────┘
```

---

## 7. 🛡️ Error Handling

### 7.1 Common Errors

```python
ERROR_HANDLERS = {
    "insufficient_input": {
        "message": "Please provide more details about your project.",
        "action": "ask_follow_up_questions"
    },
    "invalid_category": {
        "message": "Category must be one of: Development, Design, Marketing, AI",
        "action": "suggest_correction"
    },
    "budget_too_low": {
        "message": "Budget seems too low for the scope. Suggested minimum: $X",
        "action": "suggest_budget"
    },
    "deadline_too_short": {
        "message": "Timeline seems unrealistic. Suggested minimum: X days",
        "action": "suggest_timeline"
    },
    "api_error": {
        "message": "AI service temporarily unavailable. Please try again.",
        "action": "retry_with_fallback"
    }
}
```

---

## 8. 📈 Success Metrics

- **Completion Rate**: % of users who complete project creation
- **Clarification Rate**: % of projects requiring follow-up questions
- **User Satisfaction**: Rating of AI suggestions
- **Time Saved**: Average time reduction vs manual form filling
- **Quality Score**: % of projects with complete, valid data

---

**Document Version:** 1.0  
**Last Updated:** 2024

