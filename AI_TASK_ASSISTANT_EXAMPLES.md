# 🤖 AI Task Assistant - Usage Examples

## Quick Start

### API Endpoints

1. **`POST /ai/task/parse`** - Parse unstructured input
2. **`POST /ai/task/questions`** - Generate follow-up questions
3. **`POST /ai/task/suggest`** - Suggest budget/deadline
4. **`POST /ai/task/generate`** - Generate final JSON

All endpoints require authentication (Bearer token).

---

## Example 1: Complete Input (Single Pass)

### Request

```bash
POST /ai/task/parse
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "user_input": "I need a React e-commerce website with shopping cart, user authentication, and payment integration. Budget is around $2000. Need it done in 2 weeks.",
  "budget": "$2000",
  "deadline": "2 weeks"
}
```

### Response

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

### Next Step: Get Budget/Deadline Suggestions

```bash
POST /ai/task/suggest
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "React E-commerce Website with Payment Integration",
  "description": "Build a full-stack e-commerce website...",
  "category": "Development",
  "skills": ["React", "Node.js", "Stripe API", "MongoDB", "Authentication"],
  "scope": "Medium",
  "complexity": "Moderate"
}
```

### Response

```json
{
  "budget_suggestion": {
    "min": 1800,
    "max": 2500,
    "currency": "USD",
    "hourly_equivalent": {
      "min": 30,
      "max": 50
    },
    "reasoning": "Medium-scope React projects typically cost $1500-$3000. Your budget of $2000 is appropriate for a mid-level developer. This allows for 40-65 hours of work at $30-50/hour.",
    "confidence": 0.9
  },
  "deadline_suggestion": {
    "duration_days": 14,
    "duration_weeks": 2,
    "suggested_deadline_date": "2024-02-01",
    "reasoning": "A medium-scope e-commerce website typically takes 10-14 days for an experienced developer. This includes: setup (1 day), core features (5-7 days), payment integration (2-3 days), testing and refinements (2-3 days).",
    "confidence": 0.85,
    "milestones": [
      {
        "name": "Project Setup & Planning",
        "days_from_start": 1,
        "deliverable": "Project structure, database schema, API endpoints"
      },
      {
        "name": "Core Features",
        "days_from_start": 7,
        "deliverable": "Shopping cart, user authentication, product listing"
      },
      {
        "name": "Payment Integration",
        "days_from_start": 11,
        "deliverable": "Stripe/PayPal integration, checkout flow"
      },
      {
        "name": "Testing & Refinements",
        "days_from_start": 14,
        "deliverable": "Final testing, bug fixes, deployment"
      }
    ]
  },
  "recommendations": [
    "Budget is appropriate for a mid-level React developer",
    "Timeline of 2 weeks is realistic for this scope",
    "Consider breaking into phases if budget is tight",
    "Ensure freelancer has experience with payment APIs"
  ]
}
```

### Final Step: Generate Project JSON

```bash
POST /ai/task/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "complete_data": {
    "title": "React E-commerce Website with Payment Integration",
    "description": "Build a full-stack e-commerce website...",
    "category": "Development",
    "required_skills": ["React", "Node.js", "Stripe API", "MongoDB"],
    "scope": "Medium",
    "complexity": "Moderate"
  },
  "user_input": "I need a React e-commerce website...",
  "budget": "$1800-$2500",
  "deadline": "2 weeks"
}
```

### Response

```json
{
  "title": "React E-commerce Website with Payment Integration",
  "description": "Build a full-stack e-commerce website using React. Features include: shopping cart functionality, user authentication system, and payment integration (Stripe/PayPal). The website should be responsive and have an admin dashboard for managing products and orders.\n\n**Key Requirements:**\n- Responsive design for mobile and desktop\n- Secure user authentication\n- Shopping cart with add/remove items\n- Payment processing via Stripe or PayPal\n- Admin dashboard for product management\n- Order tracking system",
  "category": "Development",
  "skills": "React, Node.js, Stripe API, MongoDB, Authentication",
  "budget": "$1800-$2500",
  "status": "pending",
  "metadata": {
    "ai_generated": true,
    "confidence": 0.85,
    "enhancements_applied": ["description_enhanced", "skills_extracted", "budget_validated"],
    "original_input": "I need a React e-commerce website with shopping cart, user authentication, and payment integration. Budget is around $2000. Need it done in 2 weeks."
  }
}
```

---

## Example 2: Incomplete Input (Multi-Pass)

### Step 1: Parse Initial Input

```bash
POST /ai/task/parse
{
  "user_input": "I want a website for my business"
}
```

### Response

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
    "confidence": 0.1
  },
  "timeline_estimate": {
    "duration_days": 0,
    "confidence": 0.1
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
    }
  ],
  "confidence_score": 0.2,
  "needs_clarification": true
}
```

### Step 2: Generate Follow-up Questions

```bash
POST /ai/task/questions
{
  "extracted_data": {
    "title": "Business Website",
    "category": "Development"
  },
  "missing_info": [
    {
      "field": "description",
      "severity": "critical",
      "question": "What type of website do you need?",
      "reason": "Essential to determine scope"
    }
  ]
}
```

### Response

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

### Step 3: User Answers Questions

User provides: "E-commerce website, React and Node.js, $1500, 3 weeks"

### Step 4: Re-parse with Additional Info

```bash
POST /ai/task/parse
{
  "user_input": "I want an e-commerce website for my business. I need React and Node.js. Budget is $1500. Need it in 3 weeks."
}
```

### Response (Now Complete)

```json
{
  "extracted_data": {
    "title": "E-commerce Website with React and Node.js",
    "description": "Build an e-commerce website for business using React frontend and Node.js backend. Features should include product listing, shopping cart, and checkout functionality.",
    "category": "Development",
    "required_skills": ["React", "Node.js", "MongoDB", "Payment Integration"],
    "scope": "Medium",
    "complexity": "Moderate"
  },
  "budget_estimate": {
    "min": 1200,
    "max": 1800,
    "confidence": 0.85
  },
  "timeline_estimate": {
    "duration_days": 21,
    "confidence": 0.9
  },
  "missing_information": [],
  "confidence_score": 0.88,
  "needs_clarification": false
}
```

---

## Frontend Integration Example

### React Component

```typescript
import { useState } from 'react';
import { api } from '../services/api';

interface ParsedData {
  extracted_data: {
    title: string;
    description: string;
    category: string;
    required_skills: string[];
    scope: string;
    complexity: string;
  };
  budget_estimate: {
    min: number;
    max: number;
    confidence: number;
  };
  timeline_estimate: {
    duration_days: number;
    confidence: number;
  };
  missing_information: Array<{
    field: string;
    severity: string;
    question: string;
  }>;
  needs_clarification: boolean;
}

function AITaskAssistant() {
  const [userInput, setUserInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleParse = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/task/parse', {
        user_input: userInput
      });
      setParsedData(response.data);
      
      if (response.data.needs_clarification) {
        // Generate follow-up questions
        const questionsResponse = await api.post('/ai/task/questions', {
          extracted_data: response.data.extracted_data,
          missing_info: response.data.missing_information
        });
        setQuestions(questionsResponse.data.questions);
      }
    } catch (error) {
      console.error('Error parsing input:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleGenerateFinal = async () => {
    if (!parsedData) return;
    
    setLoading(true);
    try {
      // Merge answers into user input
      const completeInput = userInput + ' ' + Object.values(answers).join(' ');
      
      // Get budget/deadline suggestions
      const suggestResponse = await api.post('/ai/task/suggest', {
        title: parsedData.extracted_data.title,
        description: parsedData.extracted_data.description,
        category: parsedData.extracted_data.category,
        skills: parsedData.extracted_data.required_skills,
        scope: parsedData.extracted_data.scope,
        complexity: parsedData.extracted_data.complexity
      });
      
      // Generate final JSON
      const finalResponse = await api.post('/ai/task/generate', {
        complete_data: parsedData.extracted_data,
        user_input: completeInput,
        budget: `$${suggestResponse.data.budget_suggestion.min}-$${suggestResponse.data.budget_suggestion.max}`,
        deadline: `${suggestResponse.data.deadline_suggestion.duration_days} days`
      });
      
      // Use finalResponse.data to create project
      console.log('Final project JSON:', finalResponse.data);
      
    } catch (error) {
      console.error('Error generating final JSON:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-task-assistant">
      <h2>🤖 AI Task Assistant</h2>
      
      <div className="input-section">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Describe your project..."
          rows={5}
        />
        <button onClick={handleParse} disabled={loading}>
          {loading ? 'Processing...' : '✨ Generate Project'}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="questions-section">
          <h3>Let's clarify a few things:</h3>
          {questions.map((q) => (
            <div key={q.id}>
              <label>{q.question}</label>
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerQuestion(q.id, e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleParse}>Continue</button>
        </div>
      )}

      {parsedData && !parsedData.needs_clarification && (
        <div className="preview-section">
          <h3>✨ Your Project is Ready!</h3>
          <div>
            <strong>Title:</strong> {parsedData.extracted_data.title}
          </div>
          <div>
            <strong>Category:</strong> {parsedData.extracted_data.category}
          </div>
          <div>
            <strong>Skills:</strong> {parsedData.extracted_data.required_skills.join(', ')}
          </div>
          <div>
            <strong>Suggested Budget:</strong> ${parsedData.budget_estimate.min}-${parsedData.budget_estimate.max}
          </div>
          <button onClick={handleGenerateFinal} disabled={loading}>
            Generate Final Project
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Common Errors

1. **Insufficient Input:**
```json
{
  "detail": "Please provide more details about your project."
}
```

2. **AI Service Unavailable:**
```json
{
  "detail": "AI service unavailable: GEMINI_API_KEY not configured"
}
```

3. **Invalid Category:**
```json
{
  "detail": "Category must be one of: Development, Design, Marketing, AI"
}
```

---

## Validation Rules

- **Title**: 10-60 characters
- **Description**: 50-2000 characters
- **Category**: Must be one of: Development, Design, Marketing, AI
- **Skills**: 1-10 skills, each 2-30 characters
- **Budget**: Valid format (e.g., "$500-$1000", "Fixed: $500")

---

**Document Version:** 1.0  
**Last Updated:** 2024

