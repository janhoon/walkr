# Cursor

Walkr ships with a skill that teaches Cursor's AI agent how to create walkthroughs. Describe what you want to demo and the agent handles setup, scripting, preview, and export.

## Prerequisites

- [Cursor](https://cursor.com) installed
- A running web application you want to demo
- Node.js >= 18 and a package manager (pnpm, npm, or yarn)

## Installation

### From GitHub (recommended)

1. Open Cursor Settings (`Cmd+Shift+J` / `Ctrl+Shift+J`)
2. Navigate to **Rules**
3. Click **Add Rule** in Project Rules
4. Select **Remote Rule (GitHub)**
5. Paste the repository URL: `https://github.com/janhoon/walkr`

Cursor downloads the skill from `.agents/skills/create-walkthrough/` and makes it available in your project.

### Manual

Copy the skill into your project:

```bash
mkdir -p .agents/skills
git clone --depth 1 https://github.com/janhoon/walkr.git /tmp/walkr
cp -r /tmp/walkr/.agents/skills/create-walkthrough .agents/skills/
rm -rf /tmp/walkr
```

## Usage

In Cursor's Agent chat, ask for a walkthrough in natural language:

```
Create a walkthrough for my app at http://localhost:3000 showing the login flow
```

```
Build a product demo of the dashboard — log in, open settings, toggle dark mode
```

Or invoke the skill directly:

```
/create-walkthrough
```

The agent follows a 5-phase workflow: understand the walkthrough, set up the project, write the script, preview in Walkr Studio, and export to MP4/GIF/WebM/HTML.

## Tips

- **Keep your app running.** Walkr loads your app in an iframe, so it needs to be accessible at the URL you provide.
- **Use `data-testid` attributes.** They make selectors stable across UI changes.
- **Start simple.** Get a basic flow working first, then add highlights, zooms, and fine-tuning.
- **Video export needs Chromium and ffmpeg.** Make sure they're installed for MP4/GIF/WebM output.
