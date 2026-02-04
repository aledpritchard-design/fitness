# Activity Snacks Design Guidelines

## Brand Identity

**Purpose**: Help users combat sedentary behavior with quick, achievable movement breaks throughout the day.

**Aesthetic Direction**: **Athletic Minimalism** - Inspired by Nike's design philosophy: bold confidence through restraint. Maximum clarity through minimal design. Every element earns its place.

**Memorable Element**: The satisfying tap-to-complete interaction on activity cards, paired with instant visual feedback that makes checking off exercises feel rewarding.

## Navigation Architecture

**Root Navigation**: Bottom Tab Bar (3 tabs)
- Today (default, home icon)
- Progress (chart/graph icon)
- Settings (gear icon)

**Screen List**:
1. **Today** - Daily activity checklist and completion tracking
2. **Progress** - Weekly performance visualization
3. **Settings** - App configuration and debug tools
4. **Activity Detail Modal** - Instructions and safety info (native modal)
5. **Debug Panel** - Hidden developer tools (overlay, activated by long-press on "Today" header)

## Screen-by-Screen Specifications

### Today Screen
**Purpose**: Check off daily activities and track completion

**Layout**:
- Header: Transparent, displays "Today" title, right button for debug (long-press to activate debug panel)
- Main content: Scrollable view
- Safe area insets: top (headerHeight + Spacing.xl), bottom (tabBarHeight + Spacing.xl)

**Components**:
- **Progress Card**: Displays "Daily Completion" with percentage (large, bold number) and horizontal progress bar below
- **Activity Checklist**: List of activity cards, each showing:
  - Activity name (bold)
  - Reps/time (secondary text)
  - Circular checkbox (empty/filled state)
  - Optional info icon (right side) opens activity detail modal
  - Tap entire card to toggle completion
  - Completed items show subtle strikethrough and reduced opacity
- **Generate Plan Button**: Full-width, primary action, only visible when no plan exists for today
- **Reset Button**: Full-width, destructive style, only visible when debug mode enabled
- **Empty State**: When no plan generated, show empty-today.png illustration with message "Tap to generate your snacks for today"

### Progress Screen
**Purpose**: Visualize weekly consistency

**Layout**:
- Header: Transparent, displays "Progress" title
- Main content: Scrollable view
- Safe area insets: top (headerHeight + Spacing.xl), bottom (tabBarHeight + Spacing.xl)

**Components**:
- **Weekly Summary Card**: Shows "X / 7 days at 100%"
- **Weekly Grid**: 7-day grid (Mon–Sun), each day shows:
  - Day abbreviation (M, T, W, etc.)
  - Completion percentage as large number
  - Visual indicator (full/partial/empty circle based on percentage)
- **Empty State**: If no history, show empty-progress.png illustration with encouraging message

### Settings Screen
**Purpose**: Configure notifications and app behavior

**Layout**:
- Header: Transparent, displays "Settings" title
- Main content: Scrollable form
- Safe area insets: top (headerHeight + Spacing.xl), bottom (tabBarHeight + Spacing.xl)

**Components**:
- **Notification Section**:
  - Toggle: Enable notifications
  - Time range selectors: Start hour, End hour (picker style)
  - Frequency display: "Hourly" (read-only for MVP)
- **Difficulty Section**:
  - Segmented control or pills: Easy (selected), Medium (disabled), Hard (disabled)
- **Data Section**:
  - "Refresh Catalogue" button (standard)
  - "Send Debug Report" button (standard)
- **Legal Footer**: Small text with disclaimer about consulting professionals

### Activity Detail Modal
**Purpose**: Show exercise instructions and safety info

**Layout**: Native modal presentation (card style on iOS)
- Header: "Activity Name" with close button (X)
- Content: Scrollable
  - Instructions (body text)
  - Safety note (warning style with icon)

## Color Palette

**Primary Action**: #FF6B35 (energetic orange - Nike-inspired athletic energy)
**Background**: #FFFFFF (pure white)
**Surface**: #F8F8F8 (subtle off-white for cards)
**Text Primary**: #1A1A1A (near-black)
**Text Secondary**: #757575 (medium gray)
**Success**: #00C853 (completion green)
**Border**: #E0E0E0 (subtle dividers)
**Destructive**: #E53935 (reset actions)

## Typography

**Font**: SF Pro (iOS system font) - clean, legible, athletic
**Type Scale**:
- Display: 48pt, Bold (completion percentage)
- H1: 28pt, Bold (screen titles)
- H2: 20pt, Bold (card headers, activity names)
- Body: 16pt, Regular (instructions, descriptions)
- Caption: 13pt, Regular (reps/time, metadata)
- Button: 16pt, Semibold (all buttons)

## Visual Design

**Spacing Scale**:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

**Interaction Design**:
- Activity cards: Scale down to 0.97 on press with 150ms spring animation
- Checkboxes: Bounce animation on completion (scale 1.0 → 1.2 → 1.0 in 300ms)
- Progress bar: Animate width changes with 500ms ease-out
- All buttons: Reduce opacity to 0.7 on press

**Card Style**:
- Background: Surface color
- Border radius: 12px
- No shadows (flat, clean aesthetic)
- 1px border in Border color
- Internal padding: Spacing.md

**Icons**: Use SF Symbols (iOS system icons) for all navigation and actions - no emojis

## Assets to Generate

1. **icon.png** - App icon featuring a minimalist lightning bolt or movement symbol in Primary Action color on white background. WHERE USED: Device home screen.

2. **splash-icon.png** - Simplified version of app icon for launch screen. WHERE USED: App launch.

3. **empty-today.png** - Illustration of a clean checklist with one item being ticked. Simple line art in Primary Action color. WHERE USED: Today screen when no plan generated.

4. **empty-progress.png** - Illustration of an upward trending graph or calendar with checkmarks. Simple line art in Success color. WHERE USED: Progress screen when no history exists.

All illustrations should be minimal, single-color line art matching the athletic minimalism aesthetic. Avoid busy or complex graphics.