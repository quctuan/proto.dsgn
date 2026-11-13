# Design Refine

Use this plugin when the user wants to improve an existing OpenDesign artifact rather than create a new one.

## Workflow

1. Inspect the current artifact and identify the highest-leverage refinement target.
2. Pick one direction before editing: clarity, hierarchy, polish, accessibility, responsiveness, or fidelity.
3. Make the smallest useful patch that advances that direction.
4. Critique the result against the active design system and the user's stated goal.
5. Stop when the patch is coherent, then summarize what changed and what should be checked next.

## Quality Bar

- Preserve the existing product intent.
- Prefer small reviewable patches over broad redesigns.
- Keep accessibility and responsive behavior intact.
- Do not introduce a new design language unless the user explicitly asks for one.


## Default UI quality skills (proto.dsgn)
Resolve these bundled skills through the available skills catalogue (`od skills show <id>`); do not assume the project working directory contains the app resources. For UI/prototype work, read the bundled `skills/stageshow/SKILL.md` and relevant references before building, and use its framing, spacing, hierarchy and rehearsal guidance. Apply this to real application components; do not replace working controls with a faux demo.
For tasks that create or edit Figma UI, also read `skills/figma-design-system-ui/SKILL.md`; reuse the destination design system and check library access. For Figma prototype motion, additionally read `skills/figma-prototype-motion/SKILL.md`. These Figma workflows require connected Figma tools and are not mandatory for local HTML/React work. Do not block local UI generation on Figma access. Preserve the supplied product references, and verify the rendered result before handoff.
