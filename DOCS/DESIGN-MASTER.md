# VEGALIFE — Frontend Design Master

> **Version:** 1.0.0-MVP  
> **Last Updated:** 2026-09-29  
> **Tech Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query  
> **Icon Library:** Lucide React  
> **Notifications:** Sonner (toasts)  
> **Forms:** Formik + Yup  

---

## 1. Design Foundation — Nền tảng thiết kế

### 1.1 Design Philosophy

#### UX Principles

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Clarity First** | Every screen answers "What am I looking at?" and "What can I do?" within 3 seconds | Clean headers, clear CTAs, no ambiguous icons without labels |
| **Progressive Disclosure** | Show only what's needed now; reveal complexity on demand | Tabs/accordions for complex forms, skeleton loading instead of spinners |
| **Feedback Always** | System must respond to every user action within 100ms (visual) / 500ms (data) | Button states, toast notifications, optimistic updates |
| **Consistency** | Same pattern = same meaning across all pages | Primary button always blue, delete always red, same form layout everywhere |
| **Accessibility by Default** | WCAG 2.1 AA is the floor, not the goal | Keyboard navigable, screen reader friendly, color contrast checked |
| **Vegan Identity** | Visual language reflects plant-based lifestyle | Green-dominant palette, organic shapes, warm photography |

#### Visual Style

```
┌─────────────────────────────────────────────────────┐
│  Style: Minimal Enterprise                          │
│  Mood: Clean, Trustworthy, Fresh                    │
│  Photography: Natural light, plant-based food       │
│  Illustrations: Line art, green tones               │
└─────────────────────────────────────────────────────┘
```

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Style** | Minimal enterprise | Professional, scalable, easy to maintain |
| **Color Personality** | Fresh green primary | Aligns with vegan/plant-based identity |
| **Spacing** | 4px grid system | Consistent rhythm, Tailwind native |
| **Corners** | Rounded-lg (8px) default | Friendly but professional |
| **Shadows** | Subtle, layered | Depth without heaviness |
| **Photography** | Natural, warm, overhead food shots | Appetizing, authentic, community feel |

#### Consistency Rules

1. **One purpose, one component**: Never duplicate a button/input/modal pattern across files
2. **Props over inline styles**: All variants controlled via props, not conditional classes
3. **Semantic HTML first**: `<button>` not `<div onClick>`, `<nav>` not `<div>`
4. **Loading before content**: Skeleton or spinner always shown before data arrives
5. **Error recovery**: Every error state has a retry/reset action — never dead ends

---

### 1.2 Application Shell

#### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│                      TOPBAR (fixed, h-16)                │
│  [Logo] [Search] [User Menu / Auth Buttons]              │
├──────────────────────────────────────────────────────────┤
│ SIDEBAR   │                                            │ │
│ (optional)│           MAIN CONTENT AREA                │ │
│ Admin     │                                            │ │
│ only      │    <Outlet /> — Route-based content        │ │
│           │                                            │ │
│           │                                            │ │
├──────────────────────────────────────────────────────────┤
│                   TOAST (Sonner, top-right)              │
└──────────────────────────────────────────────────────────┘
```

#### Shell Types by Role

| Shell | Component | Sidebar | Topbar | Content Width |
|-------|-----------|---------|--------|---------------|
| **PublicShell** | `public-shell/PublicShell.tsx` | ❌ No | Logo + Nav + Login/Register | Max 1280px centered |
| **UserShell** | `user-shell/UserShell.tsx` | ❌ No | Logo + Nav + User Menu | Max 1280px centered |
| **AdminShell** | `admin-shell/AdminShell.tsx` | ✅ Yes (collapsible) | Logo + Admin Nav + User Menu | Fluid, sidebar-toggled |

#### Responsive Breakpoints

| Breakpoint | Class | Target | Content Behavior |
|------------|-------|--------|------------------|
| **Mobile** | `< 640px` | Phones | Single column, full-width cards, bottom nav optional |
| **Tablet** | `≥ 640px` | Tablets | Two-column grids, side-by-side panels |
| **Desktop** | `≥ 1024px` | Laptops | Full layout with max-width containers |
| **Large** | `≥ 1280px` | Desktops | Maximum content width, comfortable reading |

```css
/* Tailwind breakpoints mapping */
sm: 640px   /* Mobile → Tablet */
md: 768px   /* Small tablet */
lg: 1024px  /* Tablet → Desktop */
xl: 1280px  /* Desktop max content width */
2xl: 1536px /* Large desktop */
```

---

### 1.3 Navigation

#### Navigation Patterns

| Context | Pattern | Implementation |
|---------|---------|----------------|
| **Top-level** | Horizontal tabs in topbar | `<Link>` components in `topbar/` |
| **Admin** | Vertical sidebar | Collapsible drawer with icon+text items |
| **Breadcrumbs** | Auto-generated from route | Shown on all detail/edit pages |
| **Mobile** | Hamburger menu → full-screen overlay | Touch-friendly, swipe-to-close |

#### Role-Based Navigation Items

**PublicShell (Guest):**
```
[Logo] ─ Blog ─ Videos ─ Restaurants ─ Search ─ [Login] [Register]
```

**UserShell (Authorized):**
```
[Logo] ─ Home ─ Blog ─ Videos ─ Meal Plan ─ Restaurants ─ Search ─ [Chatbot] ─ [Avatar▼]
                                         └── Profile ─ My Posts ─ Upload Video
```

**AdminShell (Administrator):**
```
[☰] Admin Dashboard
    ├── Users Management
    ├── Posts Management
    ├── Videos Management
    ├── Comments Moderation
    ├── Categories
    └── Locations
```

#### Breadcrumb Convention

```
Home > Blog > Creating a New Post
Home > Blog > Pho Chay - Traditional Vietnamese Vegan Pho
Home > Meal Plan > Week 40, 2026
```

Rule: Always show current page as last item, non-clickable. Minimum 2 levels deep.

---

### 1.4 Page Layout Standard

#### Anatomy of Every Page

```
┌─────────────────────────────────────────────────────┐
│ HEADER SECTION                                      │
│   <h1> Page Title                                   │
│   <p> Subtitle / description                        │
│   [CTA Button] (if applicable)                      │
├─────────────────────────────────────────────────────┤
│ STATS ROW (optional — dashboard pages only)         │
│   [Stat Card] [Stat Card] [Stat Card]               │
├─────────────────────────────────────────────────────┤
│ TOOLBAR (optional — list/filter pages)              │
│   [Search Input] [Filter▼] [Sort▼] [+ Create]      │
├─────────────────────────────────────────────────────┤
│ CONTENT AREA                                        │
│   Grid / List / Table / Form / Detail               │
├─────────────────────────────────────────────────────┤
│ PAGINATION (optional — paginated lists)             │
│   « 1 2 3 ... 10 »                                 │
└─────────────────────────────────────────────────────┘
```

#### Layout Templates

| Template | Use Case | Components |
|----------|----------|------------|
| **List Page** | BlogPage, VideoPage, Admin/Users | Header + Toolbar + Grid/List + Pagination |
| **Detail Page** | BlogDetailPage, VideoDetailPage | Breadcrumb + Media + Content + Actions + Related |
| **Form Page** | CreatePostPage, Profile/Edit | Header + Sectioned Form + Action Bar (Save/Cancel) |
| **Dashboard** | Admin/Dashboard | Stats Row + Charts + Recent Activity + Quick Links |
| **Empty State** | No posts, no plans | Illustration + Message + CTA |
| **Error State** | Network failure | Icon + Message + Retry Button |

---

## 2. Design System — Hệ thống token & component

### 2.1 Design Tokens

#### VEGALIFE Color Palette

> **Design Philosophy:** Natural + Healthy + Warm + Modern + Vegetarian Lifestyle  
> The interface should feel like a real consumer product called **VEGALIFE**, not a generic green healthcare dashboard.

| Color | Hex | Role | Usage |
|-------|-----|------|-------|
| **Primary Green** | `#2E9D68` | Main brand color | Primary buttons, active navigation, links, important actions |
| **Light Green** | `#E8F5EE` | Subtle state color | Soft backgrounds, selected states, badges, tags, vegetarian highlights |
| **Cream** | `#FFF8E7` | Warm accent | Food-related sections, recipe cards, secondary highlights, subtle visual accents |
| **Terracotta** | `#D9795B` | Secondary accent (sparingly) | Food categories, small visual details, highlights |
| **Dark** | `#20352B` | Text color | Headings, primary text, navigation text, important content |
| **Background** | `#FCFBF7` | Surface color | Main application background — dominates the interface |

**Color Usage Rules:**
- ✅ Primary Green is the dominant brand color
- ✅ Dark is the main text color
- ✅ Background (#FCFBF7) should dominate the overall interface
- ✅ Light Green for subtle vegetarian/nutrition states
- ✅ Cream adds warmth and natural food feeling
- ✅ Terracotta used SPARINGLY as an accent
- ❌ Do NOT use all colors equally
- ❌ Keep interface mostly neutral with green as dominant brand color
- ❌ Avoid gradients
- ❌ Avoid neon colors
- ❌ Avoid excessive shadows
- ✅ Maintain strong accessibility and readable contrast

**Visual Identity Keywords:**
```
natural · healthy · warm · modern · vegetarian lifestyle
```

#### Semantic Color Mapping

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FCFBF7` | Page/app background |
| `--foreground` | `#20352B` | Primary text |
| `--primary` | `#2E9D68` | Primary actions, links, active states |
| `--primary-foreground` | `#FFFFFF` | Text on primary bg |
| `--secondary` | `#F5F4F0` | Secondary backgrounds |
| `--secondary-foreground` | `#20352B` | Text on secondary bg |
| `--muted` | `#F5F4F0` | Muted backgrounds |
| `--muted-foreground` | `#6B6560` | Placeholder, disabled text |
| `--accent` | `#E8F5EE` | Hover/focus highlights |
| `--destructive` | `#D9795B` | Delete, error actions |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive bg |
| `--border` | `#E0DDD5` | Borders, dividers |
| `--input` | `#E0DDD5` | Input backgrounds |
| `--ring` | `#2E9D68` | Focus ring |

**Brand Variants (Tailwind):**

| Class | Value | Usage |
|-------|-------|-------|
| `bg-vegan-green` | `#2E9D68` | Primary buttons, CTA |
| `hover:bg-vegan-green-hover` | `#268A5A` | Button hover state |
| `active:bg-vegan-green-active` | `#1F7A4D` | Button active/pressed |
| `bg-vegan-green-light` | `#E8F5EE` | Selected items, badges |
| `text-vegan-green-muted` | `#A8D5BC` | Subtle green text/icons |
| `bg-lightgreen` | `#E8F5EE` | Nutrition states, soft highlights |
| `bg-cream` | `#FFF8E7` | Recipe cards, warm sections |
| `bg-terracotta` | `#D9795B` | Food category tags (sparse) |
| `hover:bg-terracotta-hover` | `#C46A4E` | Terracotta hover |
| `text-dark` | `#20352B` | Headings, body text |
| `hover:text-dark-hover` | `#1A2B23` | Text hover |
| `bg-background` | `#FCFBF7` | Page background |

#### Spacing (4px Grid)

```
4px  →  h-1, w-1, p-1, m-1, gap-1
8px  →  h-2, w-2, p-2, m-2, gap-2
12px →  h-3, w-3, p-3, m-3, gap-3
16px →  h-4, w-4, p-4, m-4, gap-4
20px →  h-5, w-5, p-5, m-5, gap-5
24px →  h-6, w-6, p-6, m-6, gap-6
32px →  h-8, w-8, p-8, m-8, gap-8
40px →  h-10, w-10, p-10, m-10, gap-10
48px →  h-12, w-12, p-12, m-12, gap-12
64px →  h-16, w-16, p-16, m-16, gap-16
```

**Layout spacing rules:**
- Section padding: `p-6` (24px) minimum
- Card padding: `p-4` (16px) minimum
- Element gaps: `gap-4` (16px) standard, `gap-2` (8px) tight groups
- Page margins: `px-4 sm:px-6 lg:px-8`

#### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| `none` | `0` | Tables, code blocks |
| `sm` | `4px` | Inputs, small badges |
| `md` | `6px` | — |
| `default` | `8px` | Cards, buttons, modals |
| `lg` | `12px` | Large cards, image containers |
| `full` | `9999px` | Avatars, pills, tags |

#### Shadows

| Level | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation (dropdowns, tooltips) |
| `shadow-md` | Standard elevation (cards, modals) |
| `shadow-lg` | High elevation (drawers, overlays) |
| `shadow-xl` | Floating elements ( FAB, floating action bar) |

#### Z-Index Layers

| Layer | Value | Element |
|-------|-------|---------|
| Base | `0` | Body, page content |
| Dropdown | `10` | Dropdown menus, popovers |
| Sidebar | `20` | Admin sidebar |
| Topbar | `30` | Fixed topbar |
| Toast | `40` | Sonner toasts |
| Modal | `50` | Dialog overlays |
| Drawer | `60` | Slide-over drawers |
| Overlay | `100` | Full-screen loaders, skeletons |

---

### 2.2 Typography

#### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display` | `text-4xl` (36px) | `font-bold` | `leading-tight` (1.2) | Page hero titles |
| `heading-1` | `text-3xl` (30px) | `font-semibold` | `leading-tight` (1.25) | Section titles |
| `heading-2` | `text-2xl` (24px) | `font-semibold` | `leading-tight` (1.3) | Subsection titles |
| `heading-3` | `text-xl` (20px) | `font-semibold` | `leading-snug` (1.375) | Card titles, dialog titles |
| `body-lg` | `text-base` (16px) | `font-normal` | `leading-relaxed` (1.625) | Long-form content |
| `body` | `text-sm` (14px) | `font-normal` | `leading-normal` (1.57) | Default body text |
| `caption` | `text-xs` (12px) | `font-normal` | `leading-none` (1) | Labels, timestamps |
| `overline` | `text-[10px]` | `font-medium uppercase` | `tracking-widest` | Badges, pill labels |

#### Font Family

```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

Rationale: Native rendering on each OS, zero load time, excellent readability.

#### Heading Rules

1. **One h1 per page** — The page title
2. **Sequential hierarchy** — Never skip levels (h1 → h2 → h3)
3. **No headings for styling** — Use `<span class="font-semibold">` instead
4. **Descriptive, not decorative** — "Phở Chay Recipe" not "Delicious Phở!"

---

### 2.3 Components Library

#### Button

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| `primary` | `bg-vegan-green hover:bg-vegan-green-hover active:bg-vegan-green-active` | `text-white` | Main CTA on page |
| `secondary` | `bg-secondary hover:bg-muted` | `text-secondary-foreground` | Secondary action |
| `outline` | transparent + `border border-border` | `text-dark hover:bg-accent` | Tertiary action, filter |
| `ghost` | transparent | `text-dark hover:bg-accent` | Icon-only, nav items |
| `destructive` | `bg-terracotta hover:bg-terracotta-hover` | `text-white` | Delete, remove |
| `cream` | `bg-cream hover:bg-lightgreen` | `text-dark` | Food-related CTAs |

| Size | Padding | Font Size | Min Width | Usage |
|------|---------|-----------|-----------|-------|
| `sm` | `h-8 px-3` | `text-sm` | — | Table actions, compact forms |
| `default` | `h-10 px-4` | `text-sm` | `min-w-[100px]` | Standard buttons |
| `lg` | `h-12 px-6` | `text-base` | `min-w-[120px]` | Hero CTAs, prominent actions |
| `icon` | `h-10 w-10` | — | `w-10` | Icon-only buttons |

```tsx
// Usage
<Button variant="primary" size="default">Create Post</Button>
<Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="cream" size="default">View Recipe</Button>
```

#### Input

```tsx
<Input placeholder="Search recipes..." className="max-w-sm" />
```

| Property | Value |
|----------|-------|
| Height | `h-10` |
| Padding | `px-3 py-2` |
| Border | `border border-border rounded-md bg-background` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:outline-none` |
| Disabled | `opacity-50 cursor-not-allowed bg-muted` |
| Error state | `border-terracotta focus-visible:ring-terracotta` |

#### Card

```tsx
<Card className="border-border bg-card hover:shadow-sm transition-shadow">
  <CardHeader><CardTitle className="text-dark">...</CardTitle><CardDescription className="text-muted-foreground">...</CardDescription></CardHeader>
  <CardContent className="text-dark">...</CardContent>
  <CardFooter className="border-t border-border pt-4">...</CardFooter>
</Card>
```
```

| Property | Value |
|----------|-------|
| Border | `border border-border rounded-lg bg-card` |
| Shadow | `shadow-sm` |
| Padding | `p-6` (content), `p-6` (header), `p-6 pt-0` (footer) |
| Gap | `gap-2` between header elements |

#### Badge

| Variant | Class | Usage |
|---------|-------|-------|
| `default` | `bg-vegan-green text-white` | General purpose, vegan labels |
| `secondary` | `bg-secondary text-secondary-foreground` | Neutral info |
| `destructive` | `bg-terracotta text-white` | Errors, warnings |
| `outline` | `border border-border text-dark` | Tags, categories |
| `lightgreen` | `bg-lightgreen text-dark` | Vegetarian status, nutrition highlights |
| `cream` | `bg-cream text-dark` | Food-related labels |

| Size | Class | Usage |
|------|-------|-------|
| `default` | `px-2.5 py-0.5 text-xs` | Standard badges |
| `sm` | `px-2 py-0.5 text-[10px]` | Compact badges |

#### Table

```tsx
<table className="w-full">
  <thead className="bg-muted/50">
    <tr className="h-12 px-4 text-sm font-medium text-muted-foreground">
      <th className="text-left align-middle">Column</th>
    </tr>
  </thead>
  <tbody className="text-sm">
    <tr className="border-b border-border hover:bg-muted/25">
      <td className="p-4 align-middle text-dark">Cell</td>
    </tr>
  </tbody>
</table>
```

| Property | Value |
|----------|-------|
| Header height | `h-12` |
| Cell padding | `p-4` |
| Header bg | `bg-muted/50` |
| Row hover | `hover:bg-muted/25` |
| Border | `border-b border-border` |
| Striped | Optional `even:bg-muted/10` |

#### Modal (Dialog)

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader><DialogTitle className="text-dark">Confirm Action</DialogTitle></DialogHeader>
    <DialogDescription>Description of the action.</DialogDescription>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  </DialogContent>
</Dialog>
```

| Property | Value |
|----------|-------|
| Overlay | `fixed inset-0 bg-black/50 z-50` |
| Container | `max-w-lg mx-auto mt-20 rounded-lg shadow-lg bg-card border-border` |
| Animation | `animate-in fade-in zoom-in-95 duration-200` |
| Close on overlay click | Yes |
| Close on Escape | Yes |
| Focus trap | Yes |

#### Drawer

```tsx
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader><DrawerTitle className="text-dark">Title</DrawerTitle></DrawerHeader>
    <DrawerContent>...</DrawerContent>
    <DrawerFooter>Actions</DrawerFooter>
  </DrawerContent>
</Drawer>
```

| Property | Value |
|----------|-------|
| Position | Right side (desktop), Bottom sheet (mobile) |
| Width | `w-full max-w-md bg-card` |
| Animation | Slide-in from right / up from bottom |
| Overlay | Click to close |

#### Tabs

```tsx
<Tabs defaultValue="posts">
  <TabsList className="bg-muted">
    <TabsTrigger value="posts">Posts</TabsTrigger>
    <TabsTrigger value="videos">Videos</TabsTrigger>
    <TabsTrigger value="recipes">Recipes</TabsTrigger>
  </TabsList>
  <TabsContent value="posts">...</TabsContent>
</Tabs>
```

| Property | Value |
|----------|-------|
| Trigger height | `h-9` |
| Active indicator | Bottom border `border-b-2 border-vegan-green` |
| Active bg | `bg-accent` |
| Spacing | `gap-1` |
| List bg | `bg-muted` |

#### Dropdown

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>View</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

| Property | Value |
|----------|-------|
| Width | `w-48` default, `w-56` for dense menus |
| Padding | `p-1` |
| Item padding | `px-2 py-1.5` |
| Animation | `animate-in fade-in slide-in-from-top-2 duration-200` |
| Shadow | `shadow-lg` |
| Background | `bg-card border-border` |

#### Toast (Sonner)

```tsx
import { toast } from 'sonner';

toast.success('Post published successfully!');
toast.error('Failed to save changes.');
toast.warning('You have unsaved changes.');
toast.info('Processing your request...');
```

| Type | Color | Duration |
|------|-------|----------|
| `success` | Green (`#2E9D68`) | 4s |
| `error` | Terracotta (`#D9795B`) | 5s |
| `warning` | Amber | 4s |
| `info` | Blue (`#3B82F6`) | 3s |
| `default` | Neutral | 3s |

#### Skeleton

```tsx
<Skeleton className="h-4 w-24 bg-muted" />
<Skeleton className="h-10 w-full bg-muted" />
<Skeleton className="h-48 w-full rounded-lg bg-muted" />
```

Usage: Replace content while data loads. Match dimensions of target content exactly.

#### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="h-16 w-16 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2 text-dark">No posts yet</h3>
  <p className="text-muted-foreground mb-6 max-w-sm">
    Get started by creating your first blog post about vegan cooking.
  </p>
  <Button variant="primary">Create Post</Button>
</div>
```

Rules: Center-aligned, icon + title + description + CTA. Always provide an action.

#### Error State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <AlertCircle className="h-16 w-16 text-terracotta mb-4" />
  <h3 className="text-lg font-semibold mb-2 text-dark">Something went wrong</h3>
  <p className="text-muted-foreground mb-6 max-w-sm">
    Unable to load content. Please check your connection and try again.
  </p>
  <Button variant="outline" onClick={retry}>Try Again</Button>
</div>
```

Rules: Icon (terracotta for errors) + title + explanation + retry action. Never show raw errors.

#### Avatar

```tsx
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.username} />
  <AvatarFallback className="bg-vegan-green text-white">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>
```

| Size | Dimensions | Usage |
|------|-----------|-------|
| `sm` | `h-6 w-6` | Comment authors, compact lists |
| `default` | `h-10 w-10` | Topbar user menu, card authors |
| `lg` | `h-16 w-16` | Profile pages, detail headers |
| `xl` | `h-24 w-24` | Profile cover area |

#### Tooltip

```tsx
<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
    <TooltipContent className="bg-card border-border"><p>BMI = weight(kg) / height(m)²</p></TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Rules: Only for supplementary info, never for critical information. 300ms delay to prevent accidental triggers.

---

### 2.4 Forms

#### Form Layouts

| Layout | Structure | Use Case |
|--------|-----------|----------|
| **Single Column** | One field per row, full width | Simple forms (login, search) |
| **Two Column** | Two fields per row on ≥1024px | Profile edit, registration |
| **Sectioned** | Grouped sections with headers | Complex forms (create post, meal plan) |

```tsx
// Single Column
<form className="space-y-4 max-w-md">
  <FormField label="Email" required />
  <FormField label="Password" type="password" required />
  <Button type="submit">Login</Button>
</form>

// Two Column
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField label="Height (cm)" />
    <FormField label="Weight (kg)" />
  </div>
  <Button type="submit">Save</Button>
</form>

// Sectioned
<form className="space-y-8">
  <fieldset>
    <legend className="text-lg font-semibold mb-4">Personal Information</legend>
    <div className="space-y-4">...</div>
  </fieldset>
  <fieldset>
    <legend className="text-lg font-semibold mb-4">Dietary Preferences</legend>
    <div className="space-y-4">...</div>
  </fieldset>
  <div className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save Changes</Button>
  </div>
</form>
```

#### Field Rules

| Rule | Implementation |
|------|----------------|
| Label above field | `<label className="text-sm font-medium mb-1.5 block">Field Name</label>` |
| Required indicator | Red asterisk: `<span className="text-destructive">*</span>` |
| Helper text | `<p className="text-xs text-muted-foreground mt-1">Optional description</p>` |
| Error display | Below field: `<p className="text-sm text-destructive mt-1">{error}</p>` |
| Input height | `h-10` standard |
| Textarea | `min-h-[120px] resize-y` |
| Select | `appearance-none bg-no-repeat pr-8` with chevron icon |

#### Validation Strategy

| Tool | Purpose |
|------|---------|
| **Yup** | Schema definition, validation logic |
| **Formik** | Form state, submission, touched tracking |
| **HTML5** | Basic constraints (`required`, `type="email"`) |

```tsx
const schema = yup.object({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Must be at least 8 characters'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});
```

#### Action Button Order

| Context | Left | Right |
|---------|------|-------|
| **Form footer** | Cancel / Back | Save / Submit (primary) |
| **Modal footer** | Cancel (outline) | Confirm (primary) |
| **Toolbar** | Filters left | Create/Add right |

Rule: Destructive actions (Delete) always separated, never next to primary actions.

---

## 3. Interaction Patterns — Mẫu tương tác

### 3.1 CRUD Page Pattern

Every module follows this consistent blueprint:

#### List Page

```
┌─────────────────────────────────────────────────────┐
│ [Breadcrumb] Home > Blog                            │
│                                                     │
│ Manage Blogs                     [+ New Post]       │ ← Header + CTA
├─────────────────────────────────────────────────────┤
│ [🔍 Search...] [Filter ▼] [Sort ▼]                  │ ← Toolbar
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Title    │ Author │ Status   │ Date     │ ⋮    │ │ ← Table Header
│ ├─────────────────────────────────────────────────┤ │
│ │ Pho Chay │ vegan_ │ Published│ Sep 29   │ ⋮    │ │ ← Table Row
│ │ Bun Cha  │ chef   │ Draft    │ Sep 28   │ ⋮    │ │
│ │ ...      │ ...    │ ...      │ ...      │ ⋮    │ │
│ └─────────────────────────────────────────────────┘ │
│                                « 1 2 3 »            │ ← Pagination
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Click row → Navigate to Detail page
- Click `⋮` → Dropdown: View, Edit, Delete
- `[+ New Post]` → Navigate to Create page
- Search → Debounced 300ms, auto-submit
- Filter/Sort → URL params update, no page reload

#### Create Page

```
┌─────────────────────────────────────────────────────┐
│ [←] Create New Blog Post                            │ ← Header with back
├─────────────────────────────────────────────────────┤
│ Title          [__________________________]         │
│ Content        [__________________________]         │ ← Sectioned form
│ Categories     [☑ Vegan] [☑ Recipe]                │
│ Featured Image [Choose File]                        │
│                                                     │
│                              [Cancel] [Save Draft]  │ ← Action bar
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Fields validate on blur (inline) and on submit (full)
- `[Save Draft]` → Saves without publishing, shows toast
- `[Publish]` → Validates all required fields, submits
- Unsaved changes → Browser warning on navigate away
- Auto-save draft every 30s if content changed (SHOULD)

#### Detail Page

```
┌─────────────────────────────────────────────────────┐
│ [←] Blog Post                                       │
│ Home > Blog > Pho Chay Recipe                       │ ← Breadcrumb
├─────────────────────────────────────────────────────┤
│ 📷 Featured Image (full width)                      │
│                                                     │
│ Pho Chay — Traditional Vietnamese Vegan Pho         │ ← Title
│ By @vegan_chef · Sep 29, 2026 · 👁 1,234 views    │ ← Meta
│ [Edit] [Delete] [Share]                             │ ← Actions (owner/admin)
├─────────────────────────────────────────────────────┤
│ Content body (rich text rendered)                   │
│                                                     │
│ Tags: #Vegan #Vietnamese #Recipe                    │
├─────────────────────────────────────────────────────┤
│ 💬 Comments (3)                                     │
│ [Write a comment...]                                │
│ ─────────────────────────────────────────────────  │
│ @vegan_lover: Great recipe!                         │ ← Comment
│   @chef: Thank you!                                 │ ← Reply
├─────────────────────────────────────────────────────┤
│ 🔗 Related Posts                                    │ ← Related content
│ [Card] [Card] [Card]                                │
└─────────────────────────────────────────────────────┘
```

#### Edit Page

Same layout as Create page, pre-filled with existing data. Header shows "Edit" instead of "Create".

---

### 3.2 Dashboard Pattern

Used in: `Admin/Dashboard`, `HomePage`

```
┌─────────────────────────────────────────────────────┐
│ Welcome back, Admin!                                │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │  1,234   │ │   567    │ │   89     │ │  42    │ │ ← KPI Cards
│ │  Users   │ │  Posts   │ │  Videos  │ │Comments│ │
│ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌────────────────────┐ │
│ │ Recent Activity         │ │ Quick Links        │ │ ← Two-column
│ │ • User registered       │ │ [+ Add Category]   │ │
│ │ • Post published        │ │ [Moderate Comments]│ │
│ │ • Video uploaded        │ │ [Manage Users]     │ │
│ └─────────────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**KPI Card Rules:**
- Icon + value + label
- Trend indicator (↑/↓ with percentage)
- Clickable → navigates to filtered list
- Refreshed on page load + every 5 minutes (TanStack Query refetchInterval)

---

### 3.3 Profile / Detail Pattern

#### Profile Page

```
┌─────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │  Cover Photo (gradient or image)                │ │ ← Cover area
│ │  [Avatar overlaps cover]                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ @vegan_chef                    [Edit Profile]       │ ← Header
│ Joined Sep 2026                                     │
│                                                     │
│ ─────────────────────────────────────────────────  │
│ About          I love cooking vegan food...         │ ← Section
│ BMI            22.5 — Normal                        │
│ Location       Ho Chi Minh City                     │
│ Member Since   September 2026                       │
│ ─────────────────────────────────────────────────  │
│ My Posts (12)    My Videos (5)    Meal Plans (3)   │ ← Tabs
│ ─────────────────────────────────────────────────  │
│ [Post Card] [Post Card] [Post Card]                │ ← Tab content
└─────────────────────────────────────────────────────┘
```

#### Information Hierarchy

1. **Identity** (top): Avatar, name, username, role badge
2. **Stats** (below identity): Post count, follower count, etc.
3. **Details** (sections): Grouped by category
4. **Activity** (bottom): Timeline of recent actions

---

### 3.4 Data States

Every data-driven component MUST handle these 7 states:

| State | When | Visual | Interaction |
|-------|------|--------|-------------|
| **Initial** | Component mounted, data not fetched yet | Nothing or placeholder | Auto-fetch on mount |
| **Loading** | Data being fetched | Skeleton screens matching content shape | No interaction |
| **Success** | Data loaded successfully | Render actual content | Full interaction |
| **Empty** | Data fetched, but result set is empty | Illustration + message + CTA | CTA triggers action (create, search, etc.) |
| **Error** | Fetch failed or API returned error | Icon + message + retry button | Retry fetches again |
| **Forbidden** | User lacks permission | Lock icon + "Access denied" message | May show "Contact admin" or redirect |
| **Partial** | Some data loaded, some failed | Loaded content + error banner for failed parts | Retry individual failed parts |

#### Transition Rules

```
Initial ──fetch──► Loading ──success──► Success
                       │                 │
                       │                 └──► (user action) ──► Loading ──► ...
                       │
                       └───error──► Error ──retry──► Loading ──► ...
                       │
                       └───empty──► Empty ──► (user action) ──► Loading ──► ...

Loading ──forbidden──► Forbidden (no retry)
Loading ──partial──► Partial ──retry-failed──► Loading ──► ...
```

**Rules:**
- Loading state lasts ≤ 2 seconds → show progress indicator
- Loading state lasts > 2 seconds → show partial content if available
- Error state: Never show raw API errors to users
- Empty state: Always provide a meaningful CTA
- Forbidden state: Never expose that resource exists (no 403 leaks)

---

### 3.5 Responsive UX

#### Desktop (≥ 1024px)

| Aspect | Rule |
|--------|------|
| Grid | Up to 4 columns for cards |
| Tables | Full horizontal scroll if columns exceed viewport |
| Forms | Two-column where appropriate |
| Navigation | Horizontal topbar, collapsible sidebar for admin |
| Touch targets | Not applicable (mouse) |

#### Tablet (640px – 1023px)

| Aspect | Rule |
|--------|------|
| Grid | 2 columns for cards |
| Tables | Horizontal scroll enabled |
| Forms | Single column |
| Navigation | Horizontal topbar, hamburger for secondary nav |
| Modals | Full-width, centered, max-width unchanged |

#### Mobile (< 640px)

| Aspect | Rule |
|--------|------|
| Grid | 1 column, full-width cards |
| Tables | Card-based layout or horizontal scroll |
| Forms | Single column, larger touch targets (min 44px) |
| Navigation | Hamburger menu → full-screen overlay |
| Topbar | Logo + hamburger + minimal actions |
| Modals | Full-screen bottom sheet |
| Touch targets | Minimum 44 × 44px |
| Swipe | Swipe to dismiss mobile modals/drawers |

#### Mobile-Specific Rules

1. **Touch targets**: All interactive elements ≥ 44px tall/wide
2. **Font sizes**: Minimum 16px on inputs to prevent iOS zoom
3. **Bottom-safe area**: Account for iPhone notch/home indicator
4. **Pull to refresh**: Optional for feed pages (SHOULD)
5. **Long press**: Context menu on long press for mobile tables (SHOULD)

---

### 3.6 Motion

#### Animation Durations

| Category | Duration | Easing | Usage |
|----------|----------|--------|-------|
| **Instant** | 0ms | — | Visibility toggles, color changes |
| **Fast** | 150ms | `ease-out` | Hover effects, tooltip show/hide |
| **Default** | 200ms | `ease-out` | Fade transitions, dropdown open/close |
| **Slow** | 300ms | `ease-in-out` | Page transitions, modal open/close |
| **Slower** | 500ms | `ease-in-out` | Skeleton shimmer, large layout shifts |

#### When to Animate

| ✅ Animate | ❌ Don't Animate |
|-----------|-----------------|
| State changes (show/hide) | Static content appearance |
| Page/route transitions | Loading spinners (use skeleton) |
| Hover/focus feedback | Form validation errors |
| Modal/drawer open/close | Toast notifications (Sonner handles) |
| Card expand/collapse | Data table row highlighting |

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Always respect user's motion preferences. No exceptions.

---

## 4. Quality Gates — Quy tắc chất lượng

### 4.1 Role-Based UI

#### Permission Enforcement

```tsx
// FRONTEND: Hide UI elements based on role
function PostActions({ post }: { post: Post }) {
  const { user } = useAuth();
  
  // Hide delete button for non-owners and non-admins
  if (!isOwner(post.userId, user.id) && user.role !== 'ADMIN') {
    return null;
  }
  
  return (
    <Button variant="destructive" onClick={() => deletePost(post.id)}>
      Delete
    </Button>
  );
}

// BACKEND: Enforce permissions on API (documented in BR-CONTENT-001, BR-ADMIN-004)
// This is the source of truth — frontend hiding is UX convenience only
```

#### Permission Matrix (UI Level)

| Feature | ADMIN | USER | GUEST |
|---------|-------|------|-------|
| Create Post | ✅ | ✅ | Hidden → Redirect to login |
| Edit Own Post | ✅ | ✅ | Hidden → Redirect to login |
| Delete Any Post | ✅ | ❌ Hidden | Hidden → Redirect to login |
| Access Meal Plan | ❌ | ✅ | Hidden → Redirect to login |
| Access Admin Panel | ✅ | ❌ → 404 | ❌ → 404 |
| Use Chatbot | ✅ | ✅ | Hidden → Redirect to login |
| Comment/Vote | ✅ | ✅ | Hidden → Redirect to login |

**Critical Rule:** Frontend visibility ≠ permission. Backend MUST enforce all permissions. A determined user can bypass frontend checks.

---

### 4.2 Accessibility

#### WCAG 2.1 AA Requirements

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| **1.4.3 Contrast** | Text 4.5:1 minimum, large text 3:1 | Test all color combinations |
| **2.1.1 Keyboard** | All functionality keyboard accessible | Tab order logical, focus visible |
| **2.4.3 Focus Order** | Logical navigation sequence | DOM order matches visual order |
| **2.4.6 Headings** | Descriptive headings | h1→h2→h3 hierarchy |
| **2.4.7 Focus Visible** | Focus indicator clearly visible | `focus-visible:ring-2 ring-ring` |
| **3.3.1 Errors** | Error identified in text | Inline error messages below fields |
| **4.1.2 Name Role Value** | All UI elements have accessible names | `aria-label`, `<label>`, semantic HTML |

#### Semantic HTML Rules

```tsx
✅ <button> for actions
✅ <a href> for navigation
✅ <nav> for navigation regions
✅ <main> for primary content
✅ <aside> for supplementary content
✅ <header>/<footer> for section headers/footers
✅ <form> + <label> for inputs
✅ <table> + <th scope> for data tables

❌ <div onClick> for buttons
❌ <span> for links
❌ <div> for form inputs
❌ <br> for layout spacing
```

#### Focus Management

| Scenario | Rule |
|----------|------|
| Open modal | Focus moves to first interactive element |
| Close modal | Focus returns to trigger element |
| Navigate after submit | Focus moves to page heading or confirmation |
| Error in form | Focus moves to first invalid field |
| Route change | Scroll to top, focus heading |

#### Screen Reader Guidelines

1. Use `aria-live` for dynamic content updates
2. Use `aria-label` for icon-only buttons
3. Use `aria-describedby` for fields with helper text
4. Use `role="status"` for toast notifications
5. Avoid `aria-hidden="true"` on interactive elements
6. Image descriptions: alt text describes content, not decoration

---

### 4.3 Icons & Content

#### Icon Library: Lucide React

```tsx
import { 
  Search, Plus, MoreHorizontal, AlertCircle, Check, 
  X, ChevronDown, Menu, User, LogOut, Settings,
  Heart, MessageSquare, Eye, Calendar, MapPin,
  Upload, Download, Filter, SortAsc, Trash2, Edit
} from 'lucide-react';
```

| Context | Icon Size | Color |
|---------|-----------|-------|
| Button icons | `h-4 w-4` | Inherit from parent |
| Standalone icons | `h-5 w-5` | `text-muted-foreground` |
| Empty/error states | `h-16 w-16` | `text-muted-foreground` |
| Badge icons | `h-3 w-3` | Inherit |

**Icon Rules:**
- Always pair icon with text label in buttons (except topbar nav)
- Use descriptive names: `Search` not `Icon1`, `Upload` not `Cloud`
- Consistent stroke width across all icons in a view
- Animated icons only for state changes (loading spinner)

#### Content Guidelines

| Element | Guideline | Example |
|---------|-----------|---------|
| **Page titles** | Descriptive, sentence case | "Create New Blog Post" not "CREATE NEW BLOG POST" |
| **Buttons** | Action-oriented, verb-first | "Save Changes" not "Submit" or "OK" |
| **Links** | Descriptive context | "Read more about vegan protein" not "Click here" |
| **Error messages** | Specific, actionable | "Email format is invalid" not "Invalid input" |
| **Success messages** | Confirmation-focused | "Post published successfully" not "Done" |
| **Placeholders** | Hint-style, lowercase | "Enter recipe name" not "RECIPE NAME" |
| **Empty states** | Helpful, encouraging | "No posts yet — share your first vegan recipe!" |

#### Vietnamese Content Guidelines

| Rule | Example |
|------|---------|
| Use proper Vietnamese diacritics | "Ăn chay" not "An chay" |
| Sentence case for UI text | "Tạo bài viết mới" not "TẠO BÀI VIẾT MỚI" |
| Keep technical terms in English | "Dashboard", "Profile", "Settings" |
| Localize dates | "29 tháng 9, 2026" not "Sep 29, 2026" |
| Number formatting | "1.234" not "1,234" for thousands |

---

### 4.4 Component Reuse Rules

#### When to Create a New Component

| Criteria | Action |
|----------|--------|
| Used 2+ times across different pages | Extract to shared component |
| Complex logic (> 50 lines in JSX) | Extract to component |
| Has its own state/sub-components | Extract to component |
| Represents a distinct UI concept (card, table row) | Extract to component |
| Used once, simple | Inline in the page |

#### Naming Convention

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `PostCard.tsx`, `DataTable.tsx` |
| Component exports | PascalCase, named | `export function PostCard(...) {}` |
| Hook files | camelCase, use prefix | `useAuth.ts`, `usePosts.ts` |
| Store files | camelCase | `authStore.ts`, `uiStore.ts` |
| Type files | PascalCase | `types/post.ts`, `types/user.ts` |
| Utility files | camelCase | `formatDate.ts`, `validateEmail.ts` |
| CSS classes | kebab-case via Tailwind | `bg-primary`, `text-sm` |

#### Folder Organization

```
src/
├── components/
│   ├── ui/              ← Shared primitive components (Button, Input, Card...)
│   ├── topbar/          ← Topbar shell components
│   ├── admin-shell/     ← Admin-specific layout
│   ├── user-shell/      ← User-specific layout
│   ├── public-shell/    ← Public layout
│   ├── blog/            ← Blog-related shared components
│   ├── chatbot/         ← Chatbot shared components
│   ├── meal-plan/       ← Meal plan shared components
│   ├── profile/         ← Profile shared components
│   ├── restaurant/      ← Restaurant shared components
│   ├── video/           ← Video shared components
│   └── theme-provider/  ← Theme provider
├── hooks/               ← Custom React hooks
├── layouts/             ← Page layout wrappers
├── lib/                 ← Utilities, helpers
├── pages/               ← Page components (route-level)
├── providers/           ← Context providers
├── routes/              ← Route definitions
├── services/            ← API service functions
├── shared/
│   ├── components/      ← Cross-module shared components
│   └── constants/       ← App-wide constants
├── stores/              ← Zustand stores
├── types/               ← TypeScript type definitions
└── utils/               ← Utility functions
```

#### Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| **God Component** | One file > 500 lines | Split into smaller components |
| **Prop Drilling** | Passing props through 4+ levels | Use context or Zustand store |
| **Inline Styles** | `style={{ color: 'red' }}` | Use Tailwind classes |
| **Duplicate Logic** | Same validation in 3 places | Extract to shared utility |
| **Any Types** | `const data: any` | Define proper TypeScript interfaces |
| **Direct DOM Manipulation** | `document.querySelector` | Use React refs |
| **Nested Ternaries** | Hard to read conditionals | Use early returns or lookup tables |
| **Magic Numbers** | `width: 387px` | Use design tokens / Tailwind classes |

---

### 4.5 Checklist & Definition of Done

#### Design Consistency Checklist

Use this checklist when reviewing any new page or component:

**Visual**
- [ ] Uses design tokens (colors, spacing, typography) — no hardcoded values
- [ ] Follows component library patterns (Button, Card, Input variants)
- [ ] Consistent with sibling pages in the same module
- [ ] Proper dark mode support (tests both light and dark themes)
- [ ] All images have alt text or are marked decorative

**States**
- [ ] Loading state uses skeleton (not spinner) for content areas
- [ ] Empty state has illustration + message + CTA
- [ ] Error state has message + retry action
- [ ] Success state shows confirmation toast
- [ ] Hover/focus/disabled states defined for all interactive elements

**Functional**
- [ ] All form fields have labels, validation, and error messages
- [ ] Actions show appropriate feedback (toast, redirect, state change)
- [ ] Permissions enforced on both frontend (hide) and backend (reject)
- [ ] URLs are meaningful and follow routing conventions
- [ ] Data fetching uses TanStack Query (caching, refetch, error handling)

**Quality**
- [ ] No console errors or warnings
- [ ] No TypeScript errors or `any` types (unless documented)
- [ ] ESLint passes with zero errors
- [ ] Code formatted with Prettier/Spotless conventions
- [ ] No unused imports or dead code

**Accessibility**
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all focusable elements
- [ ] Semantic HTML used correctly
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)
- [ ] Screen reader tested (at least basic NVDA/VoiceOver check)

#### Definition of Done (Component/Page)

A component or page is considered **DONE** when ALL criteria are met:

| Category | Criteria |
|----------|----------|
| **Functional** | Implements all specified features, handles all 7 data states |
| **Visual** | Matches design tokens, consistent with existing pages, works in light/dark mode |
| **States** | Loading, empty, error, forbidden, partial states implemented |
| **Quality** | TypeScript strict, ESLint clean, no console errors, responsive |
| **Accessibility** | WCAG 2.1 AA compliant, keyboard navigable, screen reader friendly |
| **Permissions** | Role-based visibility correct, backend enforcement documented |
| **Code Review** | Reviewed by at least one other developer |
| **Documentation** | Component usage documented (props, variants, examples) |

---

## Appendix A: Quick Reference

### Common Tailwind Patterns

```tsx
// Container
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

// Flex row with gap
<div className="flex items-center gap-4">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Card
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">

// Button group
<div className="flex gap-2">

// Form field
<div className="space-y-2">
  <label className="text-sm font-medium">Label</label>
  <Input className="w-full" />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>

// Table wrapper
<div className="rounded-md border overflow-x-auto">
  <table className="w-full">

// Badge
<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
  Label
</span>

// Avatar group
<div className="flex -space-x-2">
  <Avatar className="border-2 border-background"><AvatarImage src="..." /><AvatarFallback>A</AvatarFallback></Avatar>
  <Avatar className="border-2 border-background"><AvatarImage src="..." /><AvatarFallback>B</AvatarFallback></Avatar>
</div>
```

### Sonner Toast Patterns

```tsx
toast.success('Operation completed');
toast.error('Something went wrong');
toast.warning('Please review your changes');
toast.loading('Processing...');
toast('Custom message', { description: 'Additional context' });
```

### TanStack Query Patterns

```tsx
// Fetch with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['posts'],
  queryFn: () => api.getPosts(),
});

// Mutation with invalidate
const mutation = useMutation({
  mutationFn: (data) => api.createPost(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
});

// Infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => api.getPosts({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### Zustand Store Pattern

```tsx
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

---

## Appendix B: File Structure Reference

```
VEGALIFE-Frontend/
├── public/                    ← Static assets
├── src/
│   ├── components/
│   │   ├── ui/               ← Primitive components (shadcn-style)
│   │   ├── topbar/           ← Topbar navigation
│   │   ├── admin-shell/      ← Admin layout shell
│   │   ├── user-shell/       ← User layout shell
│   │   ├── public-shell/     ← Public layout shell
│   │   ├── blog/             ← Blog components
│   │   ├── chatbot/          ← Chatbot components
│   │   ├── meal-plan/        ← Meal plan components
│   │   ├── profile/          ← Profile components
│   │   ├── restaurant/       ← Restaurant components
│   │   ├── video/            ← Video components
│   │   └── theme-provider/   ← Dark/light mode provider
│   ├── hooks/                ← Custom hooks (useAuth, usePosts, etc.)
│   ├── layouts/              ← Page layout wrappers
│   ├── lib/                  ← Utilities, API client config
│   ├── pages/                ← Route-level page components
│   │   ├── Admin/            ← Admin pages
│   │   ├── auth/             ← Login, Register
│   │   ├── BlogPage/         ← Blog listing
│   │   ├── BlogDetailPage/   ← Blog detail view
│   │   ├── ChatbotPage/      ← AI Chatbot
│   │   ├── CreatePostPage/   ← Create blog/video
│   │   ├── EditPostPage/     ← Edit existing post
│   │   ├── HomePage/         ← Landing page
│   │   ├── MealPlanPage/     ← Weekly meal plan
│   │   ├── NotFoundPage/     ← 404
│   │   ├── ProfilePage/      ← User profile
│   │   ├── RestaurantPage/   ← Vegan shops map/list
│   │   ├── SearchPage/       ← Global search
│   │   ├── UploadVideoPage/  ← Video upload
│   │   ├── VideoPage/        ← Video listing
│   │   └── VideoDetailPage/  ← Video detail view
│   ├── providers/            ← Context providers
│   ├── routes/               ← Route configuration
│   ├── services/             ← API service layer
│   ├── shared/
│   │   ├── components/       ← Cross-module shared components
│   │   └── constants/        ← App-wide constants
│   ├── stores/               ← Zustand stores
│   ├── types/                ← TypeScript interfaces/types
│   ├── utils/                ← Utility functions
│   ├── App.tsx               ← Root component
│   ├── main.tsx              ← Entry point
│   └── index.css             ← Global styles, design tokens
├── package.json
├── vite.config.ts
├── tsconfig.app.json
└── eslint.config.js
```

---

> **This document is the single source of truth for frontend design decisions.**  
> All new components, pages, and features MUST follow these conventions.  
> Questions or proposed changes should be discussed and documented here.
