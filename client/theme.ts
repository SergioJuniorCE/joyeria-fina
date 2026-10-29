export const THEME_CSS = `
/* Hallmark · v2.0.0 · theme: catalogue-brand (by request) · genre: editorial · job: buy · shape: Catalogue · hero: Stage · nav: edge-aligned · footer: colophon mast · surface: paper, catalog beige kept as an accent */
/* Hallmark · pre-emit critique: P4 H4 E4 S5 R4 V3 · weakest V, the catalog already had a grid; the hero and the favorites row were recomposed, not restyled */
/* Hallmark · waive 39b · the hero and favorites are product photo links · the 118 to 629px heights are joyería broquel photographs, not control heights */
/* Hallmark · dismissed 28a · the checkout thumbnails sit below the form; the first paint is text */
/* Hallmark · dropped footer headings "Tienda", "Contacto", "Pagos y envíos" · the footer became a colophon; every link and note remains */
:root {
  --paper: #fbf9f6;
  --surface: #f7f1e9;
  --card: #fffdfb;
  --neutral: #f0e6db;
  --ink: #3f3a34;
  --muted: #6f675f;
  --accent: #96684f;
  --accent-strong: #7a5440;
  --taupe: #946b57;
  --gold: #866126;
  --button-ink: #fffdf9;
  --dark: #403b35;
  --dark-ink: #fbf8f3;
  --danger: #9a3a2b;
  --backdrop: #2f2b26;
  --field-edge: #7d766d;
  --shadow: rgba(63, 58, 52, 0.35);

  --ink-10: rgb(63 58 52 / 10%);
  --ink-15: rgb(63 58 52 / 15%);
  --ink-16: rgb(63 58 52 / 16%);
  --ink-20: rgb(63 58 52 / 20%);
  --ink-30: rgb(63 58 52 / 30%);
  --ink-40: rgb(63 58 52 / 40%);
  --ink-70: rgb(63 58 52 / 70%);
  --ink-80: rgb(63 58 52 / 80%);

  --dark-ink-10: rgb(251 248 243 / 10%);
  --dark-ink-25: rgb(251 248 243 / 25%);
  --dark-ink-45: rgb(251 248 243 / 45%);
  --dark-ink-60: rgb(251 248 243 / 60%);
  --dark-ink-70: rgb(251 248 243 / 70%);
  --dark-ink-75: rgb(251 248 243 / 75%);

  --accent-5: rgb(150 104 79 / 5%);
  --accent-25: rgb(150 104 79 / 25%);
  --accent-30: rgb(150 104 79 / 30%);
  --danger-25: rgb(154 58 43 / 25%);
  --backdrop-60: rgb(47 43 38 / 60%);
  --surface-90: rgb(247 241 233 / 90%);
  --surface-95: rgb(247 241 233 / 95%);
  --paper-95: rgb(251 249 246 / 95%);
  --card-95: rgb(255 253 251 / 95%);
  --neutral-50: rgb(240 230 219 / 50%);
  --neutral-70: rgb(240 230 219 / 70%);
  --muted-80: rgb(111 103 95 / 80%);

  --font-display: "Oswald", "Arial Narrow", ui-sans-serif, sans-serif;
  --font-body: "Jost", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-script: "Great Vibes", "Segoe Script", cursive;
}

html,
body {
  overflow-x: clip;
}

body {
  background: var(--paper);
  color: var(--ink);
}

::selection {
  background: var(--accent);
  color: var(--card);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

input,
select,
textarea {
  caret-color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
