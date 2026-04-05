# Design System Document: The Sacred Stream

## 1. Overview & Creative North Star
**Creative North Star: "The Resonant Void"**

This design system moves beyond a standard "dark mode" to create a sanctuary for the user. While inspired by the efficiency of Spotify, our goal is to elevate the experience into a "High-End Editorial" space. We reject the "busy" nature of traditional apps in favor of **The Resonant Void**—a philosophy where deep blacks represent silence, and vibrant emerald accents represent the living Word.

To break the "template" look, we utilize **Intentional Asymmetry**. Hero sections should feature oversized, off-center typography and overlapping card elements that break the grid. This creates a sense of movement and spiritual flow, ensuring the UI feels like a curated digital manuscript rather than a generic database.

---

## 2. Colors: Tonal Depth & The Emerald Pulse
We utilize a sophisticated palette of deep obsidian and lush emeralds. This is not a flat interface; it is a layered ecosystem.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** We do not use 1px solid lines to separate content. Boundaries must be defined solely through background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. This creates a seamless, "liquid" interface that feels expensive and custom.

### Surface Hierarchy & Nesting
Use the hierarchy below to stack "sheets" of depth:
*   **Base Layer:** `surface` (#131313) – The foundation of the app.
*   **Sectioning:** `surface-container-low` (#1C1B1B) – Use for large, grouping backgrounds.
*   **Interactive Cards:** `surface-container-high` (#2A2A2A) – Use for playable cards and primary content.
*   **Floating Elements:** `surface-container-highest` (#353534) – For context menus and active states.

### The "Glass & Gradient" Rule
To add "soul" to the emerald accents, do not use flat `#1DB954` for large areas. Apply a subtle linear gradient from `primary` (#53E076) to `primary-container` (#1DB954) at a 135-degree angle. For floating navigation or the persistent player bar, use **Glassmorphism**: `surface` at 70% opacity with a `24px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We use **Plus Jakarta Sans** for its geometric clarity and modern "Circular-esque" feel.

*   **Display (Display-LG/MD):** Used for Surah titles in hero headers. Use negative letter-spacing (-0.02em) to create an authoritative, "tighter" editorial look.
*   **Headlines (Headline-LG/SM):** For section titles (e.g., "Recently Recited"). Always bold.
*   **Body (Body-LG/MD):** For translations and descriptions. Increase line-height to 1.6 to ensure a focused, spiritual reading experience.
*   **Labels (Label-MD/SM):** For metadata like "Reciter Name" or "Duration." Use `on-surface-variant` (#BCCBB9) to keep these secondary.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "web 2.0." We define elevation through light, not darkness.

*   **The Layering Principle:** Achieve "lift" by nesting. Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft "recessed" or "elevated" effect without a single pixel of shadow.
*   **Ambient Shadows:** If a card must float (e.g., the bottom player bar), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);`. Never use pure black shadows on top of deep grays; let the ambient background color do the work.
*   **The "Ghost Border" Fallback:** In rare cases where a container needs a edge (like a search input), use a "Ghost Border": `outline-variant` (#3D4A3D) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### The Persistent Player Bar
The core of the PWA. Use a `surface-container-highest` background with a `16px` backdrop-blur. The progress bar should be a `2px` thin line using `primary` (#53E076) with a subtle outer glow (bloom effect) to signify it is "active" and alive.

### Media Cards
*   **Shape:** `md` (12px) rounded corners. 
*   **Interaction:** On hover, the card should scale slightly (1.02x) and the background should shift from `surface-container-high` to `surface-bright`. 
*   **No Dividers:** Lists of Ayahs or tracks must never use lines. Use `16px` of vertical whitespace to separate items.

### Buttons
*   **Primary (CTA):** Full-pill shape (`full`). Gradient background (`primary` to `primary-container`). Bold `on-primary` text.
*   **Secondary:** Ghost style. No background, `outline-variant` Ghost Border.
*   **Tertiary:** Text-only. Use `primary` color for the label to indicate interactivity.

### Contextual Chips
For filtering (e.g., "Makkah," "Madinah," "Juz"). Use `surface-container-highest` with a `sm` (4px) corner radius. Active chips take the `primary` background.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. For example, give the page title a `32px` left margin but only a `16px` top margin to create an editorial feel.
*   **Do** use "High-Contrast Silence." Let large areas of the screen remain empty (`surface-container-lowest`) to focus the user's attention on the audio.
*   **Do** use the `primary-fixed-dim` for play icons to ensure they "pop" against the dark background.

### Don’t:
*   **Don't** use 1px dividers. If you feel the need for a line, use a `8px` gap of empty space instead.
*   **Don't** use standard "Material" shadows. They are too muddy for a premium dark theme.
*   **Don't** use pure white (#FFFFFF) for body text. Use `on-surface` (#E5E2E1) to reduce eye strain during long listening/reading sessions.
*   **Don't** crowd the player bar. It should feel like a floating piece of glass, not a docked utility tray.