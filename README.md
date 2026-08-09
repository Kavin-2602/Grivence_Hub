# CMSCE Priority & Routing Intelligence Engine

The Priority & Routing Intelligence Engine is a standalone Python component designed to run inside the Django backend for the **CMSCE AI-Powered Complaint Management System**. It evaluates raw complaint text and returns priority level, department routing, category, confidence score, and optional semantic embeddings.

It integrates directly via the `classify_complaint` function at `ai_bridge_service.py` (triggered by POST `/api/v1/ai/analyse-complaint/`).

---

## 1. Engine Architecture & Logic

### A. Multi-Factor Priority Scoring
Priority is determined dynamically using a composite score ranging from `0.0` to `100.0` based on 5 weighted factors:
1. **Severity (30%)**: Depth of harm or physical/functional damage.
2. **Urgency (20%)**: Time sensitivity or critical deadline.
3. **Impact (20%)**: Scale of individuals or physical units affected.
4. **Safety Risk (20%)**: Hazard to life, health, or safety.
5. **Recurrence (10%)**: Frequency of complaint repeating.

Each factor is evaluated on a scale of `1.0` to `5.0`. The composite score is mapped as follows:
- `composite_score >= 85`: **Critical**
- `65 <= composite_score < 85`: **High**
- `40 <= composite_score < 65`: **Medium**
- `composite_score < 40`: **Low**

### B. Deterministic Safety Keyword Override
If the description contains any safety-critical keywords (e.g. `electric hazard`, `water contamination`, `food safety`, `metal`, `fire`, `gas leak`, `poison`) OR if the calculated **Safety Risk** sub-score is `>= 4.0/5.0`:
- The priority is immediately forced to **Critical**.
- A safety override notice is appended to the `ai_routing_reasoning`.

### C. Department Routing & Keyword Mapping
Complaints are routed to exactly one of the six allowed department codes. Keywords for each department are matched against the description using preconfigured weights. The department with the highest match score is assigned:
- **CANTEEN**: Keywords relate to lunch, dinner, breakfast, meal, food, mess, etc.
- **TRANSPORT**: Keywords relate to bus, shuttle, driver, route, parking, bike, etc.
- **HOSTEL**: Keywords relate to room, bed, laundry, geyser, warden, block a/b/c/d, etc.
- **SPORTS**: Keywords relate to gym, ground, court, sports, basketball, coach, pool, etc.
- **ACADEMIC**: Keywords relate to class, professor, lecture, exam, syllabus, grading, course, etc.
- **HOSPITALITY**: Keywords relate to visitor, guest, lobby, housekeeping, cleaning, linen, etc.

### D. Optional Semantic Embeddings
- Generates a **384-dimensional** semantic embedding vector using `sentence-transformers/all-MiniLM-L6-v2` for duplicate ticket matching in `pgvector`.
- If the `sentence-transformers` package is not installed or the environment is offline, it falls back seamlessly, routing based on keywords and setting the `embedding` key to `None`.

---

## 2. Integration Interface Contract

```python
def classify_complaint(description: str, is_anonymous: bool = False, image_url: str = None) -> dict:
```

### Input Parameters
- `description` (str): Raw text of the complaint.
- `is_anonymous` (bool): Pass-through indicator (does not affect scoring).
- `image_url` (str, optional): Optional image evidence link.

### Output JSON Format (Supabase/Postgres columns mapping)
```json
{
  "category": "Food / Safety Hazard",
  "assigned_dept_code": "CANTEEN",
  "priority": "Critical",
  "ai_confidence_score": 97.0,
  "ai_routing_reasoning": "Metal contamination in food is a critical safety risk",
  "embedding": [0.012, -0.045, ... 384 dimensions ...] // or null
}
```

---

## 3. Seeded Regression Test (Ticket #1042)
The module is guaranteed to pass this exact regression test seed:
- **Input**: `description = "Piece of metal found in Block C lunch today"`
- **Expected Output**:
  - `category`: `"Food / Safety Hazard"`
  - `assigned_dept_code`: `"CANTEEN"`
  - `priority`: `"Critical"`
  - `ai_confidence_score`: `97.0`
  - `ai_routing_reasoning`: `"Metal contamination in food is a critical safety risk"`

---

## 4. Execution & Verification Steps

### Requirements
Ensure you have `pytest` installed:
```bash
pip install pytest
```

### Running Tests
To run the automated test suite verifying routing, priority boundaries, override rules, and regression tests:
```bash
pytest test_ai_bridge.py -v
```
