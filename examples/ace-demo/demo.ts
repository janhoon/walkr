import { clearCache, click, highlight, moveTo, type, wait, walkr } from "@walkr/core";

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
    shape: "svg",
    color: "#10b981",
    size: 24,
    shadow: true,
    clickColor: "#059669",
    svgContent:
      '<svg viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },

  steps: [
    // ── Clear browser state so login and cookie popup appear reliably ──
    clearCache(),

    // ── Scene 0: Dismiss analytics preferences ────────────────────
    // Wait for the page and the analytics popup to appear
    wait(800),

    // Click "Allow analytics" to dismiss the popup
    moveTo('[data-testid="cookie-accept-btn"]', { duration: 500 }),
    click('[data-testid="cookie-accept-btn"]'),

    wait(600),

    // ── Scene 1: Login ──────────────────────────────────────────────
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
