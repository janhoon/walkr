import {
  walkr,
  moveTo,
  moveToCoords,
  click,
  clickCoords,
  type,
  wait,
  highlight,
  zoom,
  scroll,
  sequence,
  parallel,
} from "@walkr/core";

/**
 * Ace Observability demo walkthrough.
 *
 * Flow: Login -> switch to Victoria org -> open AI Copilot -> ask for a
 * sample VictoriaMetrics query.
 *
 * Target viewport: 1920x1080
 */
export default walkr({
  url: "http://localhost:5173/login",
  title: "Ace Observability — AI Copilot Demo",
  description:
    "Log in, switch to the Victoria organization, and use the AI Copilot to generate a VictoriaMetrics query.",

  viewport: { width: 1920, height: 1080 },

  cursor: {
    shape: "circle",
    color: "#10b981",
    size: 20,
    shadow: true,
    clickColor: "#059669",
  },

  steps: [
    // ── Scene 1: Login ──────────────────────────────────────────────
    // Wait for the page to settle
    wait(800),

    // Move to email field and type credentials
    moveTo("#email", { duration: 600 }),
    click("#email"),
    type("admin@admin.com", { selector: "#email", delay: 40 }),

    wait(300),

    // Move to password field and type password
    moveTo("#password", { duration: 400 }),
    click("#password"),
    type("Admin1234", { selector: "#password", delay: 50 }),

    wait(300),

    // Highlight and click Sign in
    highlight("button[type='submit']", {
      spotlight: true,
      color: "#10b981",
      duration: 1000,
      backdropOpacity: 0.3,
      padding: 8,
    }),
    moveTo("button[type='submit']", { duration: 400 }),
    click("button[type='submit']"),

    // Wait for dashboard to load
    wait(1500),

    // ── Scene 2: Switch to Victoria org ─────────────────────────────
    // Move to the org dropdown in the sidebar (no stable selector — uses coords)
    moveToCoords(110, 73, { duration: 500 }),
    clickCoords(110, 73),

    wait(600),

    // Scroll the org list to make Victoria visible, then click it
    moveToCoords(345, 200, { duration: 300 }),
    moveToCoords(345, 315, { duration: 400 }),
    clickCoords(345, 315),

    // Wait for org switch + page reload
    wait(1500),

    // ── Scene 3: Open AI Copilot ────────────────────────────────────
    // Move to the AI toggle button (bottom-right corner)
    moveTo("button[title='Toggle AI assistant']", { duration: 700 }),

    // Spotlight the AI button before clicking
    highlight("button[title='Toggle AI assistant']", {
      spotlight: true,
      color: "#10b981",
      duration: 800,
      backdropOpacity: 0.25,
      padding: 6,
    }),
    click("button[title='Toggle AI assistant']"),

    // Wait for the Copilot panel to slide open
    wait(800),

    // ── Scene 4: Ask the AI a question ──────────────────────────────
    // Move to the chat input (inside AI panel — no stable selector)
    moveToCoords(1738, 1017, { duration: 500 }),
    clickCoords(1738, 1017),

    // Type the prompt
    type("give me a sample victoria metrics query and run it", {
      selector: "textarea",
      delay: 35,
    }),

    wait(400),

    // Click Send (inside AI panel — no stable selector)
    moveToCoords(1889, 1017, { duration: 300 }),
    clickCoords(1889, 1017),

    // Let the response stream in
    wait(3000),
  ],
});
