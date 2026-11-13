# VEGALIFE — Canva AI slide prompt

Paste **Block A** into Canva AI (Magic Design → "Generate a presentation"). Then paste **Block B** slide by slide if Canva asks for per-slide copy. **Block C** is the demo cue card — not for Canva.

Confirmed facts only. Nothing below references a feature the app cannot do.

---

## Block A — Master prompt (paste this whole block)

```
Create a 4-slide presentation deck for a Vietnamese student capstone project, in English.

PROJECT
VEGALIFE — a web platform for the Vietnamese plant-based (vegan) community. React single-page app on top of a Spring Boot REST API. The deck introduces the project and leads into a live 20-minute product demo.

DECK CONSTRAINTS — follow exactly
- Exactly 4 slides. No agenda slide, no thank-you slide, no appendix.
- 16:9 widescreen.
- The deck must be readable in under 5 minutes total. Target 40 words or fewer of body text per slide. No paragraphs. Bullets of 3-6 words.
- Leave the right third of slides 2 and 3 empty or low-contrast — the presenter talks there and points at the screen.
- Use short section labels, not sentence-case titles: "01 · WHO WE ARE", "02 · THE PROBLEM", "03 · THE SOLUTION", "04 · HOW IT'S BUILT".
- Slide 4 is the last slide; the demo follows immediately with no slides on screen.

VISUAL STYLE
- Organic, editorial, calm. Plant-based brand, not a startup pitch deck.
- Primary color: deep green #12724A. Secondary: light green #E6F2EC, warm off-white #F4F5F7, near-black text #0D1117.
- Accent used sparingly: amber #B45309 for callouts only. No gradients on text, no neon, no purple.
- Fonts: a serif with character for headings (Fraunces or a similar modern serif), clean geometric sans for body (Inter or similar).
- Photography: real food photography — fresh vegetables, mushrooms, herbs, tofu, Vietnamese dishes. Overhead or 45-degree shots, natural daylight, shallow depth of field. No stock "corporate team meeting" photos. No AI-looking smooth illustration of food.
- Icons: thin line icons only, single stroke weight, green.
- Generous whitespace. Thin 1px hairline dividers instead of boxes and shadows.
- Every slide carries a small footer: "VEGALIFE · Capstone Project 2026" on the left and the slide number on the right.

SLIDE 1 — WHO WE ARE
Left half: team and project identity. Right half: one large food photograph bleeding to the edge.
Content blocks: project name "VEGALIFE" as the dominant element, a one-line descriptor underneath ("A plant-based lifestyle platform for Vietnam"), and a row of 4-5 team members with name placeholders.
Layout: asymmetric, not centered. Treat the project name like a magazine masthead.

SLIDE 2 — THE PROBLEM
Split layout. Left: a short problem statement plus 3 short pain-point lines. Right: a single food photograph at low opacity, or empty.
Tone: specific and factual, not dramatic. No "millions of people suffer" statistics — we do not have them.
Visual device: 3 numbered pain points (1, 2, 3) as large serif numerals in green, with one short line each.

SLIDE 3 — THE SOLUTION
The densest slide, but still scannable. 
Top: one sentence naming the audience and the value ("For home cooks, we turn scattered vegan knowledge into one place to read, plan, cook and ask.").
Below: a grid of 6 feature tiles, 3 columns x 2 rows. Each tile = thin line icon + 2-4 word label + at most 6 words of description. No boxes around tiles — use hairline dividers or just spacing.
This slide may use a light green (#E6F2EC) background panel behind the grid to separate it from the intro slides.

SLIDE 4 — HOW IT'S BUILT
Two clean columns.
Left column "Frontend": a compact stack list.
Right column "Backend & third parties": a compact stack list.
Below both columns, a single horizontal strip of small logos or text labels for third-party services — rendered as monochrome text labels if logos are unavailable.
Style: technical and quiet. Monospace or small-caps labels. No 3D tech illustrations, no glowing server icons.

Do not invent statistics, user numbers, awards, press mentions, or client logos. If a number is not in the provided copy, leave it out.
```

---

## Block B — Slide copy deck (paste per slide if Canva asks)

### Slide 1 — 01 · WHO WE ARE

**Project name:** VEGALIFE
**Descriptor:** A plant-based lifestyle platform for Vietnam
**Sub-line:** Capstone project · FPT University · Semester 8

**Team** — replace with real names and roles:

| Name | Role |
|---|---|
| `[Name 1]` | Team lead · Backend |
| `[Name 2]` | Frontend · UI/UX |
| `[Name 3]` | Backend · Database |
| `[Name 4]` | Frontend · QA |
| `[Name 5]` | Business analysis · Docs |

> **Speaker note (do not print on slide):** VEGALIFE is a full-stack web app. Team of 5, built over one semester. Frontend is a React SPA; backend is a Spring Boot REST API on PostgreSQL.

### Slide 2 — 02 · THE PROBLEM

**Headline:** Eating plant-based in Vietnam means juggling five different apps.

**Three pain points** (large serif numeral + one short line):

1. **Knowledge is scattered** — recipes live in Facebook groups, blogs, screenshots. Nothing is searchable.
2. **No one checks the nutrition** — home cooks cannot tell whether a day of vegan meals hits their protein target.
3. **Finding a place is guesswork** — there is no map of vegan restaurants, groceries and markets near you.

**Closing line:** We wanted one platform that answers all three.

> **Speaker note:** Keep this grounded. These are three things we personally ran into. Do not claim market-size numbers we did not measure.

### Slide 3 — 03 · THE SOLUTION

**Headline:** One platform to read, plan, cook and ask.

**Opening line:** For home cooks and anyone exploring a plant-based diet, VEGALIFE turns scattered knowledge into a single place — with tools that check the numbers for you.

**Six feature tiles** (icon + label + ≤ 6 words):

| # | Label | Description |
|---|---|---|
| 1 | **Stories & posts** | Rich-text posts with recipes attached, comments and votes |
| 2 | **Vegan recipes** | Ingredient-level recipes, nutrition computed from ingredients |
| 3 | **Weekly meal plans** | 7-day planner that enforces balanced-repetition rules |
| 4 | **Nearby places** | Map of vegan restaurants, cafés, groceries, markets |
| 5 | **AI nutrition assistant** | Chat about macros, swaps, BMI — with a request quota |
| 6 | **Moderation console** | Admin approves posts, recipes, comments, categories |

**Footer line:** Bilingual — English and Vietnamese, switchable anywhere in the app.

> **Speaker note:** Two things worth saying out loud. (a) Nutrition is not typed in by the user — the backend derives it from the ingredients, so the number cannot be faked by the author. (b) Nothing is public until a moderator approves it.

### Slide 4 — 04 · HOW IT'S BUILT

**Frontend**

- React 19 · TypeScript 6
- Vite 8
- Tailwind CSS 4 (design tokens)
- React Router 7
- TanStack Query 5 · Zustand
- Formik + Yup
- TipTap 3 (rich-text editor)
- Leaflet / React-Leaflet (maps)
- i18next (EN / VI)

**Backend & infrastructure**

- Spring Boot 3.5 · Java 21
- PostgreSQL · Flyway migrations
- Spring Security + JWT
- Spring Data JPA / Hibernate
- SpringDoc OpenAPI (Swagger)
- Deployed on Render

**Third parties** (monochrome text strip)

`Google Identity Services` · `VNPay sandbox` · `LLM API` · `S3-compatible storage` · `OpenStreetMap + Esri tiles`

**Closing line:** Browser-only SPA. Everything the demo shows is a live API call against the deployed backend — no mocked screens.

> **Speaker note:** Name the third parties precisely — Google for sign-in, VNPay for the sandbox payment flow, an external LLM for the nutrition chat, S3-compatible presigned uploads for media, OpenStreetMap with an automatic Esri fallback for map tiles.

---

## Block C — Demo cue card (for the presenter, not Canva)

**Budget:** slides 0:00–5:00 · demo 5:00–25:00 · buffer 25:00–30:00.

Transition line after slide 4: *"That's the build. Let me show you what it actually does."*

Four demo flows, in this order. Data to type comes from `DOCS/DEMO-DATA.md`; step-by-step clicks are in `DOCS/DEMO-SCRIPT.md`.

| # | Flow | Time | What to hit |
|---|---|---|---|
| 1 | Guest browses, hits a login wall | 4 min | Home → Explore (filters, search) → vote/comment blocked → log in |
| 2 | Write and publish a post | 3 min | Composer dialog → publish → appears in feed |
| 3 | Nearby places | 3 min | Area dropdown → category pills → map/list views → place detail |
| 4 | AI assistant + weekly meal plan | 5 min | Quota banner → ask a question → build a 7-day plan → status transition |

**Pre-flight:** wake the backend (`/api/health`) 10 minutes before; log in as user in tab 1 and admin in tab 2; claim the free AI plan; allow location or remember the district dropdown; confirm one approved recipe and one draft post exist.

**If asked about gaps:** the admin dashboard numbers are still computed client-side (the `GET /api/admin/dashboard` endpoint exists but the frontend is not wired to it yet). Video posts cannot be authored from the UI — video content is uploaded and moderated through the admin surface. Say so plainly rather than clicking around.
