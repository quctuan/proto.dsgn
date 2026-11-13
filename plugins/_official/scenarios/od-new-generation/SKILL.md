---
name: od-new-generation
description: Default reference pipeline for the new-generation taskKind — discovery → plan → generate → critique with a critique-theater devloop.
od:
  scenario: new-generation
  mode: scenario
---

# od-new-generation (scenario)

Spec §10.1 / §23.3.3: when a plugin omits `od.pipeline`, the daemon
falls back to this scenario plugin's pipeline. Replacing the
default for an enterprise / vertical edition is now a content edit
rather than a code change.

## Default pipeline

```jsonc
{
  "stages": [
    { "id": "discovery", "atoms": ["discovery-question-form"] },
    { "id": "plan",      "atoms": ["direction-picker", "todo-write"] },
    { "id": "generate",  "atoms": ["file-write", "live-artifact"] },
    {
      "id": "critique", "atoms": ["critique-theater"],
      "repeat": true,
      "until": "critique.score>=4 || iterations>=3"
    }
  ]
}
```

The discovery stage gives the agent a clean surface for clarifying
questions; the plan stage commits to a TodoWrite-backed plan; the
generate stage produces the artifact; the critique stage devloops
until the score converges or the iteration ceiling is hit.

## Plugins that customise this scenario

A plugin can override or extend by declaring its own `od.pipeline`.
The default applies only when the plugin's pipeline is absent.


## Default UI quality skills (proto.dsgn)
Resolve these bundled skills through the available skills catalogue (`od skills show <id>`); do not assume the project working directory contains the app resources. For UI/prototype work, read the bundled `skills/stageshow/SKILL.md` and relevant references before building, and use its framing, spacing, hierarchy and rehearsal guidance. Apply this to real application components; do not replace working controls with a faux demo.
For tasks that create or edit Figma UI, also read `skills/figma-design-system-ui/SKILL.md`; reuse the destination design system and check library access. For Figma prototype motion, additionally read `skills/figma-prototype-motion/SKILL.md`. These Figma workflows require connected Figma tools and are not mandatory for local HTML/React work. Do not block local UI generation on Figma access. Preserve the supplied product references, and verify the rendered result before handoff.
