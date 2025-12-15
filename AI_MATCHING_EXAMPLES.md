# 🎯 AI Matching System - Examples & Usage

## Quick Start

### 1. API Endpoint

```
GET /projects/{project_id}/matches?limit=10&min_score=0.5
```

**Authorization:** Bearer token required. Only project author or admin can view matches.

**Query Parameters:**
- `limit` (default: 10): Maximum number of matches to return
- `min_score` (default: 0.3): Minimum match score threshold (0.0-1.0)

### 2. Example Request

```bash
curl -X GET "http://localhost:8000/projects/1/matches?limit=5&min_score=0.6" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Example Response

```json
{
  "project_id": 1,
  "project_title": "React E-commerce Website",
  "total_matches": 3,
  "timestamp": "2024-01-15T10:30:00Z",
  "matches": [
    {
      "freelancer_id": 42,
      "freelancer_name": "John Doe",
      "match_score": 0.847,
      "confidence": 0.92,
      "breakdown": {
        "skill_match": {
          "score": 0.90,
          "exact_matches": ["React", "TypeScript", "Node.js"],
          "semantic_matches": [
            {
              "required": "PostgreSQL",
              "freelancer": "SQL",
              "similarity": 0.75
            }
          ],
          "missing_skills": ["Docker"],
          "explanation": "Strong match with 3 exact skill matches. PostgreSQL requirement partially covered by SQL experience."
        },
        "experience_match": {
          "score": 0.85,
          "relevant_projects_count": 5,
          "domain_expertise": "high",
          "explanation": "Has completed 5 similar full-stack projects in the past year."
        },
        "performance_score": {
          "score": 0.88,
          "rating_contribution": 0.16,
          "completion_contribution": 0.05,
          "on_time_contribution": 0.05,
          "explanation": "Excellent track record: 4.8/5 average rating, 98% completion rate, 95% on-time delivery."
        },
        "temporal_score": {
          "score": 0.80,
          "activity_level": "high",
          "profile_completeness": 0.95,
          "last_active_days_ago": 2
        },
        "budget_alignment": {
          "score": 0.90,
          "rate_vs_budget": "within",
          "rate_difference_percent": -5.2
        }
      },
      "recommendation": "strong_match",
      "strengths": [
        "Excellent skill match with required technologies",
        "Proven track record in similar projects",
        "High client satisfaction ratings",
        "Recently active and responsive"
      ],
      "concerns": [
        "Missing Docker experience (may need to learn on the job)",
        "Rate slightly below budget average (may indicate availability)"
      ],
      "ai_explanation": "This freelancer is an excellent match for the project. They possess most required skills with strong past experience in similar domains. Their performance metrics indicate high reliability and client satisfaction. The only minor gap is Docker experience, which can be learned quickly given their strong technical background.",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "freelancer_id": 78,
      "freelancer_name": "Jane Smith",
      "match_score": 0.712,
      "confidence": 0.85,
      "breakdown": {
        "skill_match": {
          "score": 0.75,
          "exact_matches": ["React", "TypeScript"],
          "semantic_matches": [
            {
              "required": "Node.js",
              "freelancer": "Express.js",
              "similarity": 0.65
            }
          ],
          "missing_skills": ["PostgreSQL", "Docker"],
          "explanation": "Good match with core frontend skills. Backend experience via Express.js is related but not identical to Node.js."
        },
        "experience_match": {
          "score": 0.70,
          "relevant_projects_count": 3,
          "domain_expertise": "medium",
          "explanation": "Has experience with similar frontend-focused projects, but less backend experience."
        },
        "performance_score": {
          "score": 0.82,
          "rating_contribution": 0.14,
          "completion_contribution": 0.04,
          "on_time_contribution": 0.04,
          "explanation": "Good performance: 4.6/5 rating, 95% completion rate."
        },
        "temporal_score": {
          "score": 0.75,
          "activity_level": "medium",
          "profile_completeness": 0.80,
          "last_active_days_ago": 7
        },
        "budget_alignment": {
          "score": 0.85,
          "rate_vs_budget": "within",
          "rate_difference_percent": 2.1
        }
      },
      "recommendation": "good_match",
      "strengths": [
        "Strong React and TypeScript skills",
        "Good client ratings",
        "Reasonable rate"
      ],
      "concerns": [
        "Missing some backend skills (PostgreSQL, Docker)",
        "Less backend experience compared to frontend"
      ],
      "ai_explanation": "Good match with strong frontend capabilities. While backend experience is limited, the freelancer shows adaptability. Consider if backend work can be handled separately or if training is acceptable.",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "freelancer_id": 123,
      "freelancer_name": "Bob Johnson",
      "match_score": 0.598,
      "confidence": 0.70,
      "breakdown": {
        "skill_match": {
          "score": 0.60,
          "exact_matches": ["React"],
          "semantic_matches": [
            {
              "required": "TypeScript",
              "freelancer": "JavaScript",
              "similarity": 0.50
            }
          ],
          "missing_skills": ["Node.js", "PostgreSQL", "Docker"],
          "explanation": "Partial match with React skills. TypeScript missing but JavaScript experience may be adaptable."
        },
        "experience_match": {
          "score": 0.55,
          "relevant_projects_count": 2,
          "domain_expertise": "low",
          "explanation": "Limited experience with similar full-stack projects."
        },
        "performance_score": {
          "score": 0.65,
          "rating_contribution": 0.10,
          "completion_contribution": 0.03,
          "on_time_contribution": 0.02,
          "explanation": "Acceptable performance: 4.2/5 rating, 90% completion rate."
        },
        "temporal_score": {
          "score": 0.70,
          "activity_level": "medium",
          "profile_completeness": 0.70,
          "last_active_days_ago": 14
        },
        "budget_alignment": {
          "score": 0.75,
          "rate_vs_budget": "slightly_below",
          "rate_difference_percent": -15.5
        }
      },
      "recommendation": "moderate_match",
      "strengths": [
        "Has React experience",
        "Reasonable pricing",
        "Willing to learn"
      ],
      "concerns": [
        "Missing multiple required skills",
        "Limited full-stack experience",
        "Lower performance metrics"
      ],
      "ai_explanation": "Moderate match with significant skill gaps. While the freelancer has React experience, they lack backend and DevOps skills. Suitable if training time is acceptable and budget is a primary concern.",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Prompt Engineering Examples

### Example 1: Skill Semantic Similarity Prompt

**Input:**
```python
required_skills = ["React", "TypeScript", "Node.js", "PostgreSQL"]
freelancer_skills = ["React", "JavaScript", "Express.js", "MongoDB"]
```

**Gemini Response:**
```json
{
  "similarity_score": 0.65,
  "exact_matches": ["React"],
  "semantic_matches": [
    {
      "required": "TypeScript",
      "freelancer": "JavaScript",
      "similarity": 0.70
    },
    {
      "required": "Node.js",
      "freelancer": "Express.js",
      "similarity": 0.75
    },
    {
      "required": "PostgreSQL",
      "freelancer": "MongoDB",
      "similarity": 0.40
    }
  ],
  "explanation": "React is an exact match. TypeScript and JavaScript are closely related (TypeScript is a superset of JavaScript). Express.js is built on Node.js, so there's strong similarity. PostgreSQL and MongoDB are both databases but use different paradigms (SQL vs NoSQL), so similarity is lower."
}
```

### Example 2: Project Experience Match Prompt

**Input Project:**
```
Title: "E-commerce Platform with Payment Integration"
Description: "Build a full-stack e-commerce platform using React, Node.js, and Stripe API. Include shopping cart, user authentication, and order management."
Skills: ["React", "Node.js", "Stripe", "MongoDB"]
```

**Freelancer's Past Project:**
```
Title: "Online Store with React"
Description: "Developed a React-based online store with shopping cart functionality and user accounts."
Skills: ["React", "JavaScript", "Firebase"]
```

**Gemini Response:**
```json
{
  "experience_match_score": 0.72,
  "most_relevant_projects": [
    {
      "project_id": 45,
      "similarity": 0.72,
      "reasons": [
        "Same domain (e-commerce)",
        "Overlapping frontend technology (React)",
        "Similar features (shopping cart, user accounts)"
      ]
    }
  ],
  "explanation": "Strong domain match (e-commerce) and technology overlap (React). The freelancer has experience with core features like shopping cart and user authentication. However, the new project requires more backend complexity (Node.js, payment integration) which is not present in past work.",
  "confidence": 0.80
}
```

---

## Bias Mitigation Examples

### Good Prompt (Bias-Aware):

```
**FREELANCER PROFILE:**
{
  "id": 42,
  "skills": ["React", "TypeScript", "Node.js"],
  "bio": "Full-stack developer with 5 years experience...",
  "hourly_rate": 50,
  "location": "Remote"
}

**BIAS MITIGATION:**
- DO NOT consider: name, location (unless project requires it), ethnicity, gender
- Focus ONLY on: skills, experience, performance metrics
- If freelancer is new (no reviews), use neutral scores (0.5-0.6), not zeros
```

**Result:** Match score based purely on technical criteria.

### Bad Prompt (Biased):

```
**FREELANCER:**
Name: John Smith
Location: San Francisco, USA
Skills: React, TypeScript
Years of Experience: 5
```

**Problem:** Without explicit bias mitigation, the model might favor:
- Common English names
- Specific geographic locations
- Experience years over actual performance

**Result:** Potentially biased matching favoring certain demographics.

---

## Frontend Integration Example

### React Component

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface MatchResult {
  freelancer_id: number;
  freelancer_name: string;
  match_score: number;
  recommendation: string;
  strengths: string[];
  concerns: string[];
  ai_explanation: string;
}

function ProjectMatches({ projectId }: { projectId: number }) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [projectId]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/projects/${projectId}/matches`, {
        params: { limit: 5, min_score: 0.5 }
      });
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading matches...</div>;

  return (
    <div className="matches-container">
      <h2>AI-Recommended Freelancers</h2>
      {matches.map((match) => (
        <div key={match.freelancer_id} className="match-card">
          <div className="match-header">
            <h3>{match.freelancer_name}</h3>
            <span className={`badge ${match.recommendation}`}>
              {match.recommendation.replace('_', ' ')}
            </span>
            <span className="score">{Math.round(match.match_score * 100)}% Match</span>
          </div>
          
          <div className="strengths">
            <h4>Strengths:</h4>
            <ul>
              {match.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          
          {match.concerns.length > 0 && (
            <div className="concerns">
              <h4>Considerations:</h4>
              <ul>
                {match.concerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="explanation">{match.ai_explanation}</p>
          
          <button onClick={() => contactFreelancer(match.freelancer_id)}>
            Contact Freelancer
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Configuration

### Environment Variables

```bash
# .env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Gemini Model Selection

- **`gemini-2.0-flash-exp`** (default): Fast, cost-effective, good for matching
- **`gemini-1.5-pro`**: More accurate, slower, higher cost
- **`gemini-1.5-flash`**: Balanced option

### Temperature Settings

- **0.2-0.3** (recommended): More deterministic, consistent scoring
- **0.4-0.6**: More creative, less consistent
- **0.7+**: Too variable for matching tasks

---

## Error Handling

### Common Errors

1. **API Key Missing:**
```json
{
  "detail": "Matching service unavailable: GEMINI_API_KEY not configured"
}
```

2. **Unauthorized Access:**
```json
{
  "detail": "Not authorized. Only project author or admin can view matches."
}
```

3. **Project Not Found:**
```json
{
  "detail": "Project not found"
}
```

4. **API Rate Limit:**
```json
{
  "detail": "Error generating matches: API rate limit exceeded"
}
```

---

## Performance Optimization

### Caching Strategy

```python
# Cache skill similarity results (same skills = same similarity)
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_skill_similarity(skill1: str, skill2: str) -> float:
    # Cache results for frequently compared skills
    pass
```

### Batch Processing

For multiple projects, consider:
- Background job processing
- Redis queue for async matching
- Rate limiting to avoid API throttling

---

## Testing

### Unit Test Example

```python
def test_matching_service():
    # Create test data
    project = Project(id=1, title="Test Project", skills=["React", "Node.js"])
    freelancer = User(id=1, role="freelancer")
    
    # Mock Gemini API response
    with patch('backend.services.gemini_service.call_gemini_api') as mock_api:
        mock_api.return_value = json.dumps({
            "match_score": 0.85,
            "recommendation": "strong_match"
        })
        
        # Test matching
        service = MatchingService(db)
        matches = service.match_freelancers_to_project(project_id=1)
        
        assert len(matches) > 0
        assert matches[0]['match_score'] == 0.85
```

---

**Document Version:** 1.0  
**Last Updated:** 2024

