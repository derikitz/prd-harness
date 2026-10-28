# Design

Created by `/design`. Engineers follow this for UI work; the reviewer checks against it.

## Principles
- (e.g. "Calm and minimal", "Dense data, few colors")

## Design Tokens
| Token | Value | Use |
|---|---|---|
| color.primary | | Main actions |
| color.text | | Body text |
| color.background | | Page background |
| color.danger | | Errors, destructive actions |
| font.body | | |
| font.heading | | |
| space.unit | 4px | Spacing scale: 4, 8, 12, 16, 24, 32 |
| radius | | |

Light/dark mode: (both / light only / dark only)

## Components
| Component | Variants | Notes | Lives in |
|---|---|---|---|
| Button | primary, secondary, danger | | |

## Screens
### <Screen name>
- **Purpose:**
- **Serves:** FR-001
- **Layout:**
- **Components:**
- **States:** empty · loading · error · success
- **Responsive:** (what changes on mobile)

## Accessibility
- Text contrast meets WCAG AA (4.5:1 body, 3:1 large text).
- Everything usable by keyboard; visible focus states.
- Form fields have labels; images have alt text.
