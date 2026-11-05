---
name: Vegetarian Lifestyle System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#3f4a3c'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7a6b'
  outline-variant: '#becab9'
  surface-tint: '#006e1c'
  primary: '#006e1c'
  on-primary: '#ffffff'
  primary-container: '#4caf50'
  on-primary-container: '#003c0b'
  inverse-primary: '#78dc77'
  secondary: '#1b6d24'
  on-secondary: '#ffffff'
  secondary-container: '#a0f399'
  on-secondary-container: '#217128'
  tertiary: '#556158'
  on-tertiary: '#ffffff'
  tertiary-container: '#929e94'
  on-tertiary-container: '#2a352d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#94f990'
  primary-fixed-dim: '#78dc77'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005313'
  secondary-fixed: '#a3f69c'
  secondary-fixed-dim: '#88d982'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#d9e6da'
  tertiary-fixed-dim: '#bdcabe'
  on-tertiary-fixed: '#131e17'
  on-tertiary-fixed-variant: '#3e4a41'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system embodies a balanced, dependable lifestyle health aesthetic tailored for mindful eating, daily recipe discovery, and nutritional well-being. It relies on clarity, warmth, and organic freshness without resorting to clinical sterility or gimmicky futuristic cues.

The design movement blends **Modern Utilitarianism** with **Organic Lifestyle Minimalism**:
- Clean white card surfaces elevated against a warm, sunlit organic canvas.
- Crisp leaf-green accents that signal growth, vitality, and verified health choices.
- Thoughtful hierarchy that lets high-resolution ingredient photography, clear meal plans, and nutritional facts take center stage.
- Honest, grounded typography and functional borders delivering intuitive navigation and cognitive ease.

## Colors

The palette establishes an immediate link to fresh botanical nourishment, utilizing balanced green tones against warm off-white foundations.

### Surface Tones
- **Canvas Base (`#FAFDF7`):** A soft, warm natural ground that reduces harsh eye glare compared to stark white.
- **Card & Elevated Surface (`#FFFFFF`):** Crisp pure white applied to interactive modules, floating panels, form containers, and dialogs.
- **Container Highlight (`#E8F5E9`):** A soft leaf tint for pill chips, active filter selections, AI dietary suggestions, and nutritional highlights.

### Core Accents
- **Primary Action (`#4CAF50`):** Core leaf green allocated to primary call-to-actions, primary button fills, key status indicators, and active navigation links.
- **Deep Botanical Accent (`#2E7D32`):** Grounded forest green providing deep visual weight for brand headings, featured card titles, and high-emphasis focal tags.

### Typography & Structure
- **Text Primary (`#1F2937`):** High-contrast charcoal slate ensuring effortless readability across recipe steps and data tables.
- **Text Secondary (`#6B7280`):** Neutral gray for timestamps, nutritional subheaders, and helper copy.
- **Structural Border (`#E5E7EB`):** Subtle dividers and low-contrast borders maintaining structure without visual noise.

### Functional States
- **Warning (`#F59E0B`):** Warm amber for dietary alerts, allergen tags, and timer notifications.
- **Error (`#EF4444`):** Pure coral red for validation errors, missing ingredient warnings, and destructive actions.

## Typography

Typography relies entirely on **Inter** to deliver immediate, systematic legibility across complex culinary steps, grocery checklists, and nutritional dashboards.

- **Headings:** Set with tighter tracking (`-0.01em` to `-0.02em`) and strong weights (600 and 700) rendered in `#2E7D32` or `#1F2937` to anchor content sections firmly.
- **Body:** Kept neutral with ample line-height (1.4x to 1.5x) in `#1F2937` for effortless reading of long-form recipe guides and nutritional guidelines.
- **Labels & Numbers:** Rendered with medium-to-semibold weights for metric readouts (calories, grams, cooking durations) and chip tags.

## Layout & Spacing

The layout model utilizes a standard 12-column responsive fluid grid designed around a desktop web application baseline.

### Layout Geometry
- **Max Content Width:** Centered within a constrained maximum canvas of 1280px for desktop workflows to ensure optimal reading span for recipe directions.
- **Desktop Grid:** 12 columns with 32px (`2rem`) gutters and 48px (`3rem`) horizontal page margins.
- **Tablet Grid:** 8 columns with 24px (`1.5rem`) gutters and 32px (`2rem`) page margins.
- **Mobile Grid:** 4 columns with 16px (`1rem`) gutters and 16px (`1rem`) page margins.

### Vertical Rhythm
Component gaps adhere strictly to the 4px / 8px baseline rhythm:
- `space-xs` (4px): Micro gaps between icons and adjacent labels.
- `space-sm` (8px): Spacing inside buttons, compact list items, and input internal padding.
- `space-md` (16px): Gaps between form fields, chip groups, and content blocks within cards.
- `space-lg` (24px): Standard internal padding for cards, modals, and container margins.
- `space-xl` (32px): Separation between unrelated dashboard sections and recipe hero components.
- `space-2xl` (48px): Major section separations across primary page templates.

## Elevation & Depth

Visual hierarchy avoids heavy drop shadows and faux skeuomorphic bevels, favoring crisp low-contrast containment and light, natural ambient diffusion.

### Elevation Levels
- **Level 0 (Flat / Canvas):** Used for the base page background (`#FAFDF7`). Flat with no shadow.
- **Level 1 (Card / Resting Surface):** White surface (`#FFFFFF`) with a hairline outline (`1px solid #E5E7EB`) and a soft ambient shadow: `0 1px 3px 0 rgba(31, 41, 55, 0.04), 0 1px 2px -1px rgba(31, 41, 55, 0.04)`.
- **Level 2 (Hover / Active Cards / Dropdowns):** Subtle elevation for interactive recipe cards on hover and contextual menus: `0 4px 6px -1px rgba(31, 41, 55, 0.06), 0 2px 4px -2px rgba(31, 41, 55, 0.04)`.
- **Level 3 (Modals / Overlays / Side Drawers):** Floating dialogs, recipe detail drawers, and pantry ingredient pickers: `0 12px 24px -4px rgba(31, 41, 55, 0.08), 0 8px 16px -4px rgba(31, 41, 55, 0.04)`.

All elevations are accompanied by the subtle structural border (`#E5E7EB`) to maintain boundary integrity when resting on warm backgrounds.

## Shapes

The shape system expresses an approachable, soft geometry consistent with organic lifestyle aesthetics while remaining structured and practical for a data-dense web application.

- **Base Radius (Roundedness 2 / 8px - 10px):** Form inputs, dropdown selectors, and small thumbnails.
- **Button Radius (10px - 12px):** Primary, secondary, and ghost buttons feature soft corners for high tactile affinity without appearing toy-like.
- **Card & Container Radius (12px - 16px):** Recipe cards, nutritional summary boxes, and dialog surfaces use 16px corners to soften container boundaries.
- **Full Pill Radius (9999px):** Applied exclusively to category chips, dietary filters (e.g., Vegan, Gluten-Free, High-Protein), status badges, and search bars.

## Components

### Buttons
- **Primary Button:** Background `#4CAF50`, text `#FFFFFF`, radius 10px–12px, font `label-lg`. Hover state shifts to `#43A047`. Focus ring uses `2px solid #2E7D32` with a 2px offset.
- **Secondary Button:** Background `#E8F5E9`, text `#2E7D32`, border none. Hover shifts to `#C8E6C9`.
- **Outline / Neutral Button:** Background `#FFFFFF`, text `#1F2937`, border `1px solid #E5E7EB`. Hover changes background to `#F9FAFB`.

### Chips & Badges
- **Pill Filter Chips:** Full circular radius (`9999px`), padding `6px 14px`, text `label-md`. 
  - Resting: Background `#FAFDF7`, border `1px solid #E5E7EB`, text `#1F2937`.
  - Selected / Active: Background `#E8F5E9`, border `1px solid #4CAF50`, text `#2E7D32`.
- **Dietary Badges:** Compact pills with leading Lucide-style outline icons (e.g., leaf, wheat-off, heart), using `#E8F5E9` background with `#2E7D32` text.

### Cards
- **Recipe & Meal Plan Cards:** Pure white surface (`#FFFFFF`), border radius 16px, border `1px solid #E5E7EB`, overflow hidden.
  - Image ratio 16:10 with corner badges layered over the media block.
  - Card body features 16px internal padding, `headline-sm` title, and secondary metadata row (prep time, calorie estimate, difficulty).
  - Hover state applies Level 2 ambient elevation with a smooth 150ms transition.

### Input Fields & Controls
- **Text Inputs & Selects:** Height 44px, radius 10px, background `#FFFFFF`, border `1px solid #E5E7EB`, padding `10px 14px`, text `#1F2937`. Focus shifts border to `#4CAF50` with an ambient glow (`box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15)`).
- **Checkboxes & Radios:** 20px size, radius 6px (checkbox) or circular (radio). Unchecked: `#FFFFFF` with `#E5E7EB` border. Checked: `#4CAF50` background with white check icon.

### Nutrition Metric Bars
- Progress tracks set in `#E8F5E9` with active progress indicators rendered in `#4CAF50` for daily targets and `#F59E0B` when limits are reached.