# Chatita — Product Vision

## Core Mission

> Chatita is a bilingual diabetes companion that helps people understand their food, blood sugar, and daily choices through culturally relevant, non-judgmental guidance grounded in clinical best practices.

## The Shift

**From:** "An AI tool that tells diabetics what foods are good or bad"

**To:** "A culturally-aware diabetes companion that helps people make informed food decisions based on their personal goals, health conditions, lifestyle, and culture."

---

## 1. Personalization, Not Generic Advice

The strongest theme from both consultations. Diabetes management is highly individualized.

### User Profile (v2 target)
- Age, height, weight
- Activity level
- Diabetes type (Type 1 / Type 2 / Prediabetes)
- Weight goal (lose / gain / maintain)
- Other medical conditions: heart disease, kidney disease, hypertension
- Current medications
- Daily calorie target
- Daily carbohydrate target
- Number of meals/snacks per day

### Outcome
Recommendations become: *"Based on YOUR goals, this meal fits."* — not *"This meal is good."*

---

## 2. Meal Balance Over Carb Minimization

**Critical insight:** Low carb ≠ good meal. A balanced meal contains protein, fiber, healthy fats, and *appropriate* carbohydrates.

### New Meal Scoring Philosophy
Score meals on:
- Carbs
- Fiber (directly impacts glucose response)
- Protein
- Fat
- Calories
- Portion size
- Processing level
- Blood sugar impact
- User's personal goals
- Existing medical conditions

### Language Shift
Instead of: *"Great because low carb"*
Say: *"Great because it provides protein, fiber, moderate carbohydrates, and fits your lunch goals."*

---

## 3. Fiber Is a Primary Metric

Add fiber (and added sugar where possible) to all meal analysis, photo analysis, and restaurant guidance. Fiber directly impacts glucose response — it belongs alongside carbs as a first-class metric.

---

## 4. Cultural Food Philosophy

**One of the strongest pain points.** Generic AI suggestions often say "replace rice with cauliflower rice." Users don't want to replace their food. They want to keep it.

### New Philosophy
Help users:
- Keep cultural foods
- Adjust portions
- Modify preparation method
- Add complementary balance

### Examples

| Food | Old AI | Better |
|------|--------|--------|
| Biryani | Replace with cauliflower rice | Reduce rice slightly, increase chicken, add cucumber salad, reduce potatoes |
| Tortillas | Avoid tortillas | Two tortillas instead of four, add vegetables, increase protein |

### Cultural Food Database (long-term)
Build specific support for: Mexican, Pakistani, Indian, Middle Eastern, Dominican, Puerto Rican, Arab, African, Chinese, Vietnamese, Filipino foods.

---

## 5. Portion Guidance Over Restriction

**Recurring theme.** People are tired of hearing "don't eat that." Focus instead on:
- Portion recommendations
- Visual serving sizes (palm, fist, etc.)
- Plate method
- Meal balancing

The food often isn't the problem — the quantity is.

---

## 6. Meal Composition Guidance

Teach eating patterns that directly reduce glucose spikes:

**Meal Order:**
1. Fiber / vegetables first
2. Protein next
3. Carbohydrates last

**Eating Habits:**
- Eat slowly
- Sit while eating
- Drink water with meals
- Avoid distracted eating

---

## 7. Explain Why

Every recommendation should include reasoning.

Instead of: *"Great Choice"*
Say: *"Great Choice because: 28g protein, 8g fiber, moderate carbohydrates, fits your lunch target."*

---

## 8. Daily Nutrition Context

A meal should be judged against the user's day, not in isolation.

Future Chatita knows:
- *"You have already consumed 90g carbs today."*
- *"This fits within today's targets."*
- Remaining calories, carbs, protein for the day

---

## 9. Hypoglycemia Education

Teach the full protocol, not just "eat sugar when low":

**Low Blood Sugar Protocol:**
1. 15g fast-acting carbs (juice, glucose tablets, honey)
2. Wait 15 minutes, recheck
3. Follow with protein to prevent rebound
4. Avoid repeated sugar spikes

---

## 10. Diabetes Goal Education

Educational content on typical targets:
- Fasting glucose goals
- Post-meal glucose goals
- A1C goals
- Time in range

Always note: *Individual goals may differ. Always follow your healthcare provider's personal targets.*

---

## 11. CGM + Fingerstick Parity

Many patients cannot afford CGMs, lose access, or are never prescribed them. Chatita must work equally well for:
- CGM users (real-time data)
- Manual glucose logging users (fingerstick)

This is critical for underserved populations.

---

## 12. Clinical Governance (Pre-Scale)

Before scaling, build:
- Source guidelines (ADA Standards of Care, evidence-based nutrition guidance)
- Clinical review process
- Audit logs
- Human review layer
- Version control for AI prompts

### AI → Clinical Rules → User (not AI → User)
Potential workflow:
1. AI generates recommendation
2. Clinical framework checks against ADA guidelines
3. Approved guidance displayed to user

---

## 13. Companion Positioning

Chatita should not say: *"Eat this."*

Chatita should say: *"Based on your goals, here are options to consider."*

**Tone:** Supportive, non-judgmental, educational, empowering.

---

## Implementation Priority

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | System prompt rewrite (companion philosophy) | ✅ Done |
| P0 | Balance-over-restriction in all AI prompts | ✅ Done |
| P0 | Cultural food sensitivity in all AI prompts | ✅ Done |
| P0 | Fiber as primary metric | ✅ Done |
| P0 | Explain WHY in recommendations | ✅ Done |
| P1 | Extended user profile (schema + onboarding) | ✅ Done |
| P1 | Daily nutrition context in chat | ✅ Done |
| P1 | Portion guidance language | ✅ Done |
| P2 | Hypoglycemia protocol in chat | ✅ Done |
| P2 | Meal composition guidance | ✅ Done |
| P3 | Cultural food database | Backlog |
| P3 | Dietitian review layer | Backlog |
| P3 | Clinical governance framework | Backlog |
| P3 | Fingerstick parity audit | Backlog |
