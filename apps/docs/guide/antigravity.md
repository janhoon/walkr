# Antigravity

Walkr ships with a skill that teaches Antigravity's agent how to create walkthroughs. Describe what you want to demo and the agent handles setup, scripting, preview, and export.

## Prerequisites

- [Google Antigravity](https://antigravity.google) installed
- A running web application you want to demo
- Node.js >= 18 and a package manager (pnpm, npm, or yarn)

## Installation

Copy the Walkr skill into your project. Antigravity reads skills from `.agent/skills/`.

```bash
mkdir -p .agent/skills
git clone --depth 1 https://github.com/janhoon/walkr.git /tmp/walkr
cp -r /tmp/walkr/.agent/skills/create-walkthrough .agent/skills/
rm -rf /tmp/walkr
```

Once the skill directory is in your project, Antigravity discovers it automatically.

## Usage

In the Antigravity chat, ask for a walkthrough in natural language:

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
