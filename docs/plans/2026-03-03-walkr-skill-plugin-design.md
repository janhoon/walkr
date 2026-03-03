# Walkr Skill Plugin Design

## Goal

Create a Claude Code plugin that helps external Walkr users create product walkthroughs. The skill guides agents through the full workflow: project setup, script authoring, preview, and export.

## Distribution

Shipped as a Claude Code plugin. The plugin source lives in the Walkr repo at `.claude/plugins/walkr/` to stay in sync with API changes.

## Plugin Structure

```
.claude/plugins/walkr/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── create-walkthrough/
│       ├── SKILL.md
│       └── api-reference.md
└── README.md
```

- `plugin.json` — Plugin metadata (name, version, description, author)
- `SKILL.md` — Main skill defining the end-to-end walkthrough creation workflow
- `api-reference.md` — Full Walkr step builder API docs (derived from llms-full.txt)
- `README.md` — Plugin installation and usage instructions

## Skill Workflow

### Phase 1: Understand the walkthrough

Ask the user:
1. Target app URL
2. Natural language description of the flow to demo
3. Visual preferences (cursor style, viewport, highlights) — optional, use sensible defaults
4. Desired export format (mp4/gif/webm/embed)

### Phase 2: Setup

- Check if `@walkrstudio/core` and `@walkrstudio/cli` are installed
- If not, install them (plus `@walkrstudio/recorder` for video export)
- Verify target app is accessible

### Phase 3: Write the script

- Read `api-reference.md` for the full step builder API
- Author a TypeScript walkthrough file using step builders
- Follow conventions: scene-based comments, data-testid selectors preferred
- Apply sensible defaults: 600ms moveTo durations, 35-50ms type delays, waits between scenes

### Phase 4: Preview & iterate

- Run `npx walkr dev <script>`
- Direct user to check Studio in browser
- Help refine selectors, timing, and step order based on feedback

### Phase 5: Export

- Run `npx walkr export <script> --format <format> --output <path>`
- Report success with output file path

## Key Design Decisions

- **Single skill, single workflow**: One `create-walkthrough` skill covers the entire linear flow. No need for separate skills per phase.
- **Supporting reference file**: API docs in `api-reference.md` keeps the main skill focused on workflow while providing comprehensive reference when needed.
- **Natural language input**: User describes the flow in plain English; agent translates to step sequences.
- **Selector strategy**: Skill instructs agent to prefer `data-testid` attributes, then meaningful IDs/classes, and to flag that selectors may need adjustment after preview.
- **Sensible defaults**: Agent uses reasonable timing values (600ms moves, 35-50ms typing, 300-800ms waits) rather than asking for every parameter.
