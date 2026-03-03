import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Walkr",
  description:
    "Scriptable walkthrough engine — record, replay, and export interactive product demos.",
  base: "/walkr/",

  head: [
    [
      "link",
      {
        rel: "alternate",
        type: "text/plain",
        href: "/walkr/llms.txt",
        title: "LLM-friendly summary",
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Core API", link: "/api/core" },
      { text: "Engine API", link: "/api/engine" },
      { text: "CLI", link: "/api/cli" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Claude Code", link: "/guide/claude-code-plugin" },
          { text: "Cursor", link: "/guide/cursor" },
          { text: "VS Code", link: "/guide/vscode" },
          { text: "Antigravity", link: "/guide/antigravity" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Core API", link: "/api/core" },
          { text: "Engine API", link: "/api/engine" },
          { text: "CLI Reference", link: "/api/cli" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/janhoon/walkr" },
    ],
  },
});
