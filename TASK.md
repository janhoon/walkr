# Task: Step annotations — add optional name to all steps
**Fizzy:** https://fizzy.janhoon.com/0000001/cards/492

## Goal

Add an optional `name` field to every Walkr step. Names show in the studio timeline, appear in engine events, and make error messages and AI debugging more useful.

## Acceptance Criteria

- `name?: string` added to the base step options interface in `@walkr/core` — all step types inherit it automatically
- All step builder functions accept `name` as part of their options (no changes needed per-step if the base type handles it)
- Engine includes `name` in step lifecycle events (`step_start`, `step_end`, `step_error`)
- Studio timeline displays step name when provided, falls back to step type as label when unnamed
- Error messages include step name — e.g. `Step 'Open settings menu' failed at selector #settings`
- Unnamed steps continue to work exactly as before — fully optional, no breaking changes
- Unit tests: named step serialisation, name in events, fallback to step type when unnamed
- All existing tests continue to pass

## Documentation (do not skip)

- Update root `README.md` and all package READMEs to show `name` as an available option
- Update VitePress docs (`apps/docs/`) with a "Step names" section — what it does, when to use it, example timeline output
- Include a note that step names help AI agents debug: when a user reports an issue with "the Save changes step", an AI can target that step directly by name

## Example

```ts
moveTo('#settings', { name: 'Open settings menu' })
click('#save-btn', { name: 'Save changes' })
wait(1000, { name: 'Wait for animation' })
```

## When Done

1. Commit: `feat: add optional name annotation to all steps (#492)`
2. Push branch `feat/step-names`
3. Run: `openclaw system event --text "Done: step names #492 — branch pushed, ready for PR" --mode now`
