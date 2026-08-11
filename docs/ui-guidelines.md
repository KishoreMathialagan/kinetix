# UI/UX Guidelines
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**Design Philosophy:** Mobile-First • Clean • Clinical • Modern • Accessible

---

# 1. Purpose

This document defines the complete UI/UX standards for the Kinetix Home Care platform.

It ensures that every screen, component, interaction, and visual element maintains a consistent experience across the application.

This document should be followed by:

- UI/UX Designers
- Frontend Developers
- Product Team
- QA Team

---

# 2. Design Principles

The interface should always be:

- Mobile First
- Minimal
- Clean
- Professional
- Calm
- Accessible
- Fast
- Consistent
- Touch Friendly

The application should reduce cognitive load for therapists working in patients' homes.

---

# 3. Brand Colors

## Primary

```
#12393C
```

Deep Teal

Used for

- Primary Buttons
- Navigation
- Active States
- Header
- Links

---

## Secondary

```
#B49837
```

Warm Gold

Used for

- Highlights
- Charts
- Icons
- Badges
- KPI Cards

---

## Background

```
#F8F7F3
```

Warm White

---

## Surface

```
#FFFFFF
```

Cards

Dialogs

Forms

---

## Text Primary

```
#1F2A2C
```

---

## Text Secondary

```
#64748B
```

---

## Border

```
#E2E8F0
```

---

## Success

```
#22C55E
```

---

## Warning

```
#F59E0B
```

---

## Error

```
#EF4444
```

---

## Info

```
#3B82F6
```

---

# 4. Typography

## Font Family

Primary

```
Inter
```

Fallback

```
sans-serif
```

---

## Font Scale

| Element | Size | Weight |
|----------|------|--------|
| Display | 48 | 700 |
| H1 | 36 | 700 |
| H2 | 30 | 700 |
| H3 | 24 | 600 |
| H4 | 20 | 600 |
| H5 | 18 | 600 |
| Body Large | 16 | 400 |
| Body | 14 | 400 |
| Caption | 12 | 400 |

---

# 5. Spacing System

Use an 8-point spacing system.

```
4

8

12

16

24

32

40

48

64

80
```

Avoid arbitrary spacing values.

---

# 6. Border Radius

Buttons

```
12px
```

Cards

```
16px
```

Dialogs

```
20px
```

Inputs

```
12px
```

Badges

```
999px
```

---

# 7. Shadows

Small

```
0 1px 2px rgba(0,0,0,.06)
```

Medium

```
0 8px 24px rgba(0,0,0,.08)
```

Large

```
0 16px 40px rgba(0,0,0,.12)
```

Use shadows sparingly.

---

# 8. Layout

Desktop

```
Sidebar

Header

Content
```

---

Tablet

```
Collapsible Sidebar

Header

Content
```

---

Mobile

```
Header

Content

Bottom Navigation
```

---

# 9. Grid System

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

---

# 10. Breakpoints

| Device | Width |
|----------|---------|
| Mobile | 320–767 px |
| Tablet | 768–1023 px |
| Desktop | ≥1024 px |
| Large Desktop | ≥1440 px |

---

# 11. Buttons

Primary

Filled

Secondary

Outlined

Ghost

Text Only

Danger

Red Filled

Loading

Spinner

Disabled

Reduced Opacity

Minimum height

```
44px
```

---

# 12. Input Fields

Supported

- Text
- Number
- Email
- Phone
- Date
- Password
- Textarea
- Select
- Search
- File Upload

States

- Default
- Focus
- Error
- Disabled
- Success

---

# 13. Form Guidelines

Every form must include

- Label
- Placeholder
- Validation
- Error Message
- Helper Text

Validation

Real-time

Server-side

---

# 14. Cards

Used for

- Patients
- Therapists
- Reports
- Statistics
- Appointments

Card Structure

```
Header

Body

Actions
```

---

# 15. Tables

Desktop

Full Table

Tablet

Compact Table

Mobile

Card List

Tables support

- Pagination
- Sorting
- Filtering
- Search

---

# 16. Navigation

## Admin Sidebar

Dashboard

Patients

Therapists

Appointments

Reports

Billing

Settings

---

## Therapist

Dashboard

Patients

Appointments

Treatments

Assessments

Profile

---

## Patient

Dashboard

Appointments

Progress

Exercises

Reports

Profile

---

# 17. Icons

Use

```
Lucide React
```

Guidelines

- 20px
- 24px
- 32px

Use outlined icons for consistency.

---

# 18. Status Colors

Scheduled

Blue

Completed

Green

Cancelled

Red

Pending

Orange

In Progress

Purple

---

# 19. Badges

Rounded

Small

Readable

Examples

```
Completed

Pending

Assigned

Active
```

---

# 20. Charts

Use

Recharts

Charts

- Line
- Area
- Bar
- Pie
- Progress Ring

Applications

Pain Trend

ROM

Appointments

Therapist Performance

---

# 21. Dashboard Design

Cards

- White background
- Rounded corners
- Soft shadow
- Consistent padding

Widgets

Maximum

```
4–6
```

per screen

---

# 22. Loading States

Always show

Skeleton

or

Spinner

Never leave blank screens.

---

# 23. Empty States

Every module must include

Illustration

Message

Primary Action

Example

```
No Patients Yet

Register your first patient.
```

---

# 24. Error States

Display

Friendly Message

Retry Button

Support Link (Future)

Avoid technical jargon.

---

# 25. Toast Notifications

Position

Top Right

Duration

```
3–5 seconds
```

Types

Success

Warning

Info

Error

---

# 26. Modal Guidelines

Used for

Confirmation

Delete

Archive

Preview

Forms

Maximum width

```
600px
```

---

# 27. Mobile Guidelines

Minimum touch target

```
44x44px
```

Bottom Navigation

Maximum

```
5 tabs
```

Floating Action Button

Used for

Quick Actions

---

# 28. Accessibility

Follow WCAG 2.1 AA

Requirements

- Keyboard Navigation
- Screen Reader Support
- Visible Focus States
- Proper Contrast
- ARIA Labels
- Semantic HTML

Never rely on color alone.

---

# 29. Animations

Use

Framer Motion

Duration

```
150–300ms
```

Animations

- Fade
- Slide
- Scale
- Accordion

Avoid excessive animation.

---

# 30. File Upload

Support

- Drag & Drop
- Camera
- Gallery
- File Browser

Show

Preview

Progress

File Size

---

# 31. Notifications

Types

- Toast
- Banner
- In-App
- Push (Future)

---

# 32. PWA Guidelines

Must support

- Install Prompt
- Offline Mode
- Splash Screen
- App Icon
- Background Sync

---

# 33. Dark Mode

Reserved for Version 2.

Current version uses only the light theme.

---

# 34. Responsive Behavior

Desktop

Multi-column layouts

Tablet

Adaptive layouts

Mobile

Single-column layouts

No horizontal scrolling.

---

# 35. Component Library

Shared Components

```
Button

Input

Textarea

Select

Checkbox

Radio

Switch

Avatar

Badge

Card

Modal

Drawer

Dropdown

Table

Tabs

Accordion

Tooltip

Popover

Pagination

Breadcrumb

Calendar

Date Picker

File Upload

Toast

Skeleton

Loader
```

---

# 36. Design Tokens

## Colors

Stored centrally.

---

## Typography

Centralized.

---

## Radius

Centralized.

---

## Shadows

Centralized.

---

## Spacing

Centralized.

Never hardcode design values in components.

---

# 37. UX Principles

1. Mobile-first by default.
2. Minimize user input.
3. Reduce clicks.
4. Keep screens uncluttered.
5. Prioritize readability.
6. Provide immediate feedback.
7. Maintain consistent navigation.
8. Support offline workflows.
9. Make critical actions obvious.
10. Prevent user errors wherever possible.

---

# 38. Microinteractions

Include subtle feedback for:

- Button clicks
- Form validation
- Successful saves
- File uploads
- Status changes
- Notifications
- Navigation transitions

Microinteractions should be fast, purposeful, and never distract from the user's task.

---

# 39. Screen Design Standards

Every screen should include:

- Page title
- Breadcrumb (desktop)
- Primary action button (if applicable)
- Search (for list pages)
- Filters (where relevant)
- Responsive layout
- Loading state
- Empty state
- Error state
- Pagination (if applicable)

---

# 40. Clinical Workflow Design Guidelines

Therapists often work outdoors, travel frequently, and may have unreliable internet access. Therefore:

- Prioritize one-handed mobile use.
- Minimize typing with dropdowns, toggles, and templates.
- Allow session data to be saved offline and synchronized later.
- Keep treatment forms concise with expandable advanced sections.
- Ensure large touch targets for quick interaction during home visits.

---

# 41. Future UI Enhancements

Version 2

- Dark Mode
- Tablet-optimized landscape layouts
- Push notification center
- Voice input for clinical notes
- Interactive exercise animations

Version 3

- AI assistant interface
- Tele-rehabilitation video consultation screens
- Multi-clinic dashboard
- White-label branding support
- Customizable dashboard widgets

---

# 42. Definition of Done

A UI implementation is considered complete only when:

- Responsive across supported breakpoints
- Matches the design system
- Uses shared components
- Accessible (WCAG 2.1 AA)
- Loading, empty, and error states implemented
- Keyboard navigation verified
- Touch targets meet mobile guidelines
- Performance optimized
- Cross-browser tested
- Design review approved