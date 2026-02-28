import { click, highlight, moveTo, type, wait, walkr } from "@walkr/core";

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
    wait(1200),

    // Move to email field and type credentials
    moveTo('[data-testid="email-input"]', { duration: 600 }),
    click('[data-testid="email-input"]'),
    type("admin@admin.com", { selector: '[data-testid="email-input"]', delay: 40 }),

    wait(300),

    // Move to password field and type password
    moveTo('[data-testid="password-input"]', { duration: 400 }),
    click('[data-testid="password-input"]'),
    type("Admin1234", { selector: '[data-testid="password-input"]', delay: 50 }),

    wait(300),

    // Highlight and click Sign in
    highlight('[data-testid="login-submit-btn"]', {
      spotlight: true,
      color: "#10b981",
      duration: 1000,
      backdropOpacity: 0.3,
      padding: 8,
    }),
    moveTo('[data-testid="login-submit-btn"]', { duration: 400 }),
    click('[data-testid="login-submit-btn"]'),

    // Wait for dashboard to load
    wait(1500),

    // ── Scene 2: Switch to Victoria org ─────────────────────────────
    // Open the org dropdown in the sidebar
    moveTo('[data-testid="org-dropdown-btn"]', { duration: 500 }),
    click('[data-testid="org-dropdown-btn"]'),

    wait(600),

    // Select the Victoria org from the dropdown
    moveTo('[data-testid="org-dropdown-item-265c1068-660e-4c3c-affd-aa78a4362562"]', {
      duration: 400,
    }),
    click('[data-testid="org-dropdown-item-265c1068-660e-4c3c-affd-aa78a4362562"]'),

    // Wait for org switch + page reload
    wait(1500),

    // ── Scene 3: Open AI Copilot ────────────────────────────────────
    // Move to the AI toggle button
    moveTo('[data-testid="copilot-toggle-btn"]', { duration: 700 }),

    // Spotlight the AI button before clicking
    highlight('[data-testid="copilot-toggle-btn"]', {
      spotlight: true,
      color: "#10b981",
      duration: 800,
      backdropOpacity: 0.25,
      padding: 6,
    }),
    click('[data-testid="copilot-toggle-btn"]'),

    // Wait for the Copilot panel to slide open
    wait(800),

    // ── Scene 4: Ask the AI a question ──────────────────────────────
    // Move to the chat input
    moveTo('[data-testid="copilot-chat-input"]', { duration: 500 }),
    click('[data-testid="copilot-chat-input"]'),

    // Type the prompt
    type("give me a sample victoria metrics query and run it", {
      selector: '[data-testid="copilot-chat-input"]',
      delay: 35,
    }),

    wait(400),

    // Click Send
    moveTo('[data-testid="copilot-send-btn"]', { duration: 300 }),
    click('[data-testid="copilot-send-btn"]'),

    // Let the response stream in
    wait(3000),
  ],
});
