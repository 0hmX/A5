# Gemini Development Guidelines for Project A5

This document contains rules and conventions to follow when generating or modifying code for this project.

## Theming and Styling

The project's styling is managed by **NativeWind**, which uses **Tailwind CSS** utility classes. It is configured with a specific design system that supports both light and dark modes automatically. Strict adherence to this system is mandatory.

### Primary Method: Semantic Utility Classes

This is the **only** approved method for applying colors, spacing, and typography. All styling should be done via `className` props. Never use inline `style` for colors or dimensions.

#### Color Classes

These classes are defined in `tailwind.config.js` and are the single source of truth for all colors. They are named semantically based on their function.

-   **`bg-background`**: Use for the main screen background color.
-   **`text-foreground`**: Use for the primary, default text color on a `bg-background`.

-   **`bg-card`**: Use for the background of container elements that sit on top of the main background, such as list items or message bubbles.
-   **`text-card-foreground`**: Use for the primary text color on a `bg-card`.

-   **`bg-primary`**: Use for the main interactive elements, such as primary buttons or the currently active item.
-   **`text-primary-foreground`**: Use for text that sits on top of a `bg-primary`.

-   **`bg-secondary`**: Use for secondary interactive elements that need to be distinct from primary ones.
-   **`text-secondary-foreground`**: Use for text on top of `bg-secondary`.

-   **`bg-destructive`**: Use for elements associated with a destructive action, like a delete button.
-   **`text-destructive-foreground`**: Use for text on top of `bg-destructive`.

-   **`text-muted-foreground`**: Use for supplementary, de-emphasized text, such as timestamps or secondary labels.

-   **`bg-accent`**: Use for highlighting an element without the strong emphasis of `primary`.
-   **`text-accent-foreground`**: Use for text on top of `bg-accent`.

-   **`border-border`**: Use for the default border color on elements like cards and inputs.
-   **`border-input`**: Specifically for the border of `TextInput` components.
-   **`border-ring`**: Use for focus indicators or rings around elements.

-   **`bg-popover`**: Use for the background of popovers or floating menus.
-   **`text-popover-foreground`**: Use for text within popovers.

#### Typography, Spacing, and Sizing

-   **Typography**: Always use the predefined text size classes from the theme: `text-display`, `text-heading`, `text-subheading`, `text-body-lg`, `text-body`, `text-caption`, `text-label`.

-   **Spacing**: Always use the predefined spacing scale for `margin`, `padding`, and `gap`. The scale is based on a 4px grid.
    -   `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), etc.
    -   Includes aliases: `p-container` (16px) and `p-gutter` (24px).

-   **Border Radius**: Always use the predefined border radius classes to maintain a consistent, rounded aesthetic.
    -   `rounded-sm` (4px)
    -   `rounded-md` (8px)
    -   `rounded-lg` (12px)
    -   `rounded-xl` (16px)
    -   `rounded-2xl` (24px)
    -   `rounded-full` (9999px)
    -   **Default for most elements (like buttons and cards) should be `rounded-lg`**.

### Use ':dark'

use this taillwidcss feature to handel darkmode

**Do not use this hook to apply colors to standard `style` properties like `backgroundColor` or `color` on a `<View>` or `<Text>`. Use the utility classes for that.**

## Code Style

- **No Comments:** Do not add comments to the code. The code should be self-documenting. Focus on clear variable names, function names, and overall structure.

## Error Handling

- **Return Errors as Values:** Functions that can fail should adopt a value-based error handling pattern. Instead of throwing exceptions, they should return a two-element array:
    1.  The first element is the successful result (`[data, null]` on success).
    2.  The second element is the error object (`[null, error]` on failure).

- **Example:**
  ```typescript
  async function fetchData(): Promise<[MyData | null, Error | null]> {
    try {
      const data = await someOperation();
      return [data, null];
    } catch (e) {
      return [null, e as Error];
    }
  }
  ```
