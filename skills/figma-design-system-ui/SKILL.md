---
name: figma-design-system-ui
description: Build production UI in Figma through Figma MCP from the destination file's published design system. Carries the library access checks, publish rules, variable-mode traps, token-binding rules, contrast procedure, numeric alignment checks, and build hygiene. Load before the first use_figma of an approved visual design. Not for grayscale wireframes, options still being compared, or edits to the shared library itself.
metadata:
  author: quctuan
  version: 2.0.0
  mcp-server: figma
od:
  mode: utility
triggers:
  - "figma-design-system-ui"
---

Read [Codex runtime guidance](../../CODEX_RUNTIME.md) before this workflow.


# Figma design-system UI

Production UI is reviewed as a **design**, not a flow. Everything built here should use the destination's published components and bound variables, so it survives mode changes, library updates, and handoff. This skill contains no component keys, mode IDs, or token values. Query them live and record the stable ones in the project's own docs.

---

## 0. This is the UI track

| | Wireframe track | **UI track (this skill)** |
|---|---|---|
| Source | Wireframe kit or primitives | The product's design system |
| Fidelity | Grayscale, structural | Production visual |
| Tokens | None; direct values | Bind variables |
| Reviewed as | A flow | A design |

Sequence: `ux-designer` → project context → **this skill** → `ui-designer` → `ux-copywriter` → five-question build plan and designer review → build. `ui-designer` is the step that separates this track from the wireframe track; do not skip it. Load `figma-mcp-api` before writing Plugin API code.

### Read the full references

For a full build, read every file in `references/` of `ux-designer`, `ux-copywriter`, and `ui-designer`, roughly 67 KB in total. The `SKILL.md` files are summaries, and references do not load on their own. An isolated fix needs only the relevant file.

### Look at real screens

Search Mobbin MCP before settling an open visual or interaction pattern. References give principles; Mobbin gives visual evidence from shipping apps, including the state a screen is in (keyboard open, empty, loading). Look at the images, cite `mobbin_url`, and borrow the mechanism rather than the screen. If Mobbin is not connected, say that this evidence step could not run. The `figma-wireframe-kit` skill §0 has the full procedure, including the ad-inventory check for ad-supported products.

### Build plan: where to look for components

The `design-tracks` rule defines the five-question plan. For question 1 (which components already exist), look in this order:

1. the published design-system library;
2. the product's own local components, listed in the project's node map if it keeps one;
3. other remote libraries already used in the file (ad containers, platform chrome).

For question 2 (new components), create them **locally in the product file**, never in the shared library (§1).

A build that skips the plan tends to ship components without the states the product needs, such as a pill with no pressed or loading variant.

---

## 1. The shared library is read-only

Never create, modify, delete, or push an override into the design-system library file unless the designer explicitly asked for library work in this turn. A published library propagates every edit to **all** consuming files. There is no such thing as a small local fix there.

The failure is silent, so enforce it mechanically:

- Pass the destination `fileKey` and selected `link_id` explicitly on every tool call. Read `figma.root.name` through `use_figma` when checking the target name.
- Query `get_libraries` and `search_design_system` before concluding a required component is missing. Report real gaps to the library owner.

---

## 2. Access: keys are library-wide, enablement is per file

A component key belongs to the library, so the same key works in every consuming file. What varies is whether the library is **enabled** in that file. Before the first build in a new file, run this from the **consuming** file:

```js
const set = await figma.importComponentSetByKeyAsync(SET_KEY);
const comp = await figma.importComponentByKeyAsync(set.children[0].key);
const inst = comp.createInstance();
const out = { file: figma.root.name, ok: true, w: inst.width, h: inst.height };
inst.remove();
return out;
```

If the import throws, inspect access, key validity, publishing state and library availability. Ask the designer to enable it in Assets → Libraries; do not draw around it. You do not need to open the library file for imports to work, and you should not: every extra file in the bridge is another chance for the active file to switch.

A product file may already use a different, internal system for its existing screens. "New UI uses the design system" applies to new builds; it does not convert existing screens, and it does not prove the library is enabled there.

### Enumerating components

- The Plugin API has no call that lists a library's components from a consuming file.
- Use `get_libraries`, then `search_design_system` with the destination file and returned library keys. The response can be hundreds of kilobytes; save it and search it rather than reading it into the conversation.
- Record the sets you use (name, key, variant axes, main properties) in a project reference file. Keys are stable across sessions; store the returned IDs with their file scope.

---

## 3. Publish rules

**A leading `.` or `_` keeps a component from being published.** When the REST count is lower than the number of sets you can see in the library, count the prefixed names; they usually explain the whole difference. Never reach for an unpublished primitive; use the public wrapper that composes it.

Two consequences found in practice:

- **The rule applies per node.** A prefixed, unpublished set can have unprefixed standalone siblings that are published and import fine. A team once concluded a library had no bottom navigation because the navigation sets were prefixed; three standalone navigation components were published alongside them.
- **Libraries are not always consistent.** An internal part may be published by accident because its name lacks the prefix. It will import, but prefer its public wrapper.

Query REST before concluding that something is missing.

---

## 4. Variable modes

### Measure before trusting the team standard

Read the modes that reviewed screens in this file actually use. A product can carry a deliberate exception to the team's standard mode, and "correcting" it changes colors on screens that have already been approved.

```js
const node = await figma.getNodeByIdAsync(NODE_ID);
const chain = [];
for (let n = node; n; n = n.parent) {
  if ('explicitVariableModes' in n)
    chain.push({ id: n.id, name: n.name, type: n.type, modes: n.explicitVariableModes });
}
return chain; // collection ID → mode ID; the nearest ancestor with an entry wins
```

### A page-level mode can be silently wrong

Modes inherit, and the page is an ancestor. A screen frame with **no** explicit modes inherits whatever the page carries, and for collections where nothing is set it falls back to the collection's default mode. A screen can therefore look right while resolving one collection from a wrong page-level mode and the others from defaults that only coincide with the standard. Query the chain above before trusting resolved colors.

### Set modes once, on the outermost container

Set every required collection's mode on the outermost frame or section of the new work and let children inherit. An explicit mode on a child overrides its parent. Stamping modes on every screen looks identical on canvas, but a later change at container level then fails to reach every frame carrying its own value, and the fix is a per-frame reset.

A light-only product still binds variables. Binding costs the same as hardcoding, and a later dark-mode decision then costs nothing instead of a repaint.

---

## 5. Tokens: bind them, do not write them down

Design-system tokens are usually multi-mode aliases:

```text
Color/Background/Accent/Solid/Default
  Light → alias → primitive A
  Dark  → alias → primitive B
```

Recording "one token = one hex" picks one mode, flattens the alias chain, goes stale invisibly, and encourages hardcoded fills. Record the **naming grammar** in project docs; look values up live.

### Read the grammar

Most systems follow a pattern such as `Color / <Role> / <Family> / <Emphasis> / <State>`:

- **Roles** such as Background, Border, Content, Shadow, and Focus.
- **Emphasis** steps such as Solid, Flat, Subtle, and Ghost.
- **States** such as Default, Hover, and Pressed. Content roles often use a different axis (Strongest, Base, Light). An on-accent content family usually follows the interactive states of the surface beneath it.
- **Support or category palettes** (red, teal, bronze…) are for data and categories, not UI emphasis.

A primary CTA is the accent solid background with on-accent content on its label, not a hardcoded brand hex.

**Bind through the semantic layer, never primitives.** A primitive collection may publish zero variables precisely so consumers cannot bind to it.

### Bind every bindable value

Colors are not the whole job. When creating components and when building screens, bind:

| Property | Typical collection |
|---|---|
| `fills`, `strokes` | Color |
| `paddingLeft/Right/Top/Bottom` | Spacing / Padding |
| `itemSpacing` | Spacing / Gap |
| corner radii | Corner radius |
| font size, line height, letter spacing | Typography (or a text style that binds them) |

```js
const v = await figma.variables.importVariableByKeyAsync(VARIABLE_KEY);
node.setBoundVariable('paddingLeft', v);
node.setBoundVariable('topLeftRadius', radiusVar);
node.fills = [figma.variables.setBoundVariableForPaint(node.fills[0], 'color', colorVar)];
```

If a gap token and a padding token alias the same primitive, choose by meaning: space **between** children is a gap; space **inside** a container's edge is padding.

**Bind only exact matches; never force a value onto the nearest step.** Put unmatched values in a report and decide each one:

- Round when geometry does not depend on the value, for example a 14 → 16 horizontal gap that leaves row height unchanged.
- **Do not round a constraint.** Vertical padding that keeps a chip exactly 44 px tall protects the touch-target floor. Padding that reproduces a measured platform bar height is a contract other screens rely on. Bending a platform measurement to fit a token scale is the wrong trade.
- Do not bind artwork or one-off brand colors the system does not define.

Re-measure key dimensions **after** binding. If something moved, the binding changed the design, not just its description.

### Finding library variables

Subscribed library variables do **not** appear in `getLocalVariablesAsync`. Two routes:

Use the direct Figma MCP connection and explicit file scope; follow `figma-mcp-api` for the actual tool contract.
- Otherwise start from a node that already has a bound variable: `getVariableByIdAsync(id)` → `.variableCollectionId` → `getVariableCollectionByIdAsync()` → iterate `variableIds`.

Import many variables in one call and it may time out. Import in a separate call, keep the IDs, then bind with `getVariableByIdAsync` in the next call.

### Auditing unbound values

Skip the component-set container itself. Figma gives it its own padding, radius, and dashed stroke, which are not design values and create false positives. Also skip nodes inside instances; their bindings come from the library.

```js
const root = await figma.getNodeByIdAsync(SECTION_ID);
const inInstance = n => { for (let p = n.parent; p && p !== root; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const keys = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing'];
const out = [];
for (const n of root.findAllWithCriteria({ types: ['FRAME', 'COMPONENT', 'RECTANGLE', 'TEXT'] })) {
  try {
    if (inInstance(n) || n.parent?.type === 'COMPONENT_SET' && n.type !== 'COMPONENT') continue;
    const bv = n.boundVariables || {};
    if (Array.isArray(n.fills) && n.fills.some(p => p.type === 'SOLID' && p.visible !== false && !p.boundVariables?.color))
      out.push(`${n.id} ${n.name}: fill`);
    for (const k of keys) if (n[k] > 0 && !bv[k]) out.push(`${n.id} ${n.name}: ${k}=${n[k]}`);
    if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0 && !bv.topLeftRadius)
      out.push(`${n.id} ${n.name}: radius=${n.cornerRadius}`);
  } catch (e) { out.push(`${n.id}: unreadable (${e.message})`); }
}
return out;
```

Stroke weight often has no variable scope. Report it rather than counting it as a binding failure.

---

## 6. Contrast on custom surfaces

A component's default tokens assume a mode-aware surface such as canvas or card. A screen with its own gradient, illustration, or photo is **mode-blind**: it does not change with the mode. A mode-reactive token on it can read fine today and break when the mode, the token value, or a dark launch changes. Neutral "strongest" content tokens flip between modes; on a surface that stays white in every mode, that becomes white on white.

When a component's default fails on a custom surface:

1. **Do not override the fill.** An override kills the binding (§8) and hides the problem.
2. **Re-bind to the same role in the overlay family**, if the system has one: on-dark-overlay content for text on dark or gradient surfaces, on-white-overlay content on white glass, overlay backgrounds and borders for the surface itself. Never pick a raw hex that is "close enough".
3. **Verify contrast by code against the surface's real color.** The system's own mode preview cannot catch this case.
4. **Log the swap**: instance, old token → new token, and why. An unlogged swap looks like a mistake once the file changes hands.

```js
// Resolve a bound color for this node's modes, composite alpha over the surface, compute WCAG contrast.
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) });
const ratio = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };

const text = await figma.getNodeByIdAsync(TEXT_ID);
const variable = await figma.variables.getVariableByIdAsync(text.fills[0].boundVariables.color.id);
const fg = variable.resolveForConsumer(text).value;   // { r, g, b, a } in 0–1
const surface = SURFACE_RGB;                          // the real, measured background
return ratio(over(fg, surface), surface).toFixed(2);  // body text needs ≥ 4.5
```

Overlay scales are often tuned for near-black backgrounds and skip steps on mid-tone surfaces; a common gap sits between roughly 36% and 80% white. If no token passes, keep a deliberate local value, label it as intentional, and send the gap to the library owner. A wrong token forced into the gap is worse than a documented exception.

Put the contrast numbers in the **first** question to the designer, with the look-versus-AA trade-off. Asking "keep the look or follow the token family?" without numbers costs extra rounds.

---

## 7. Layout by numbers

### Spacing hierarchy: structure first, values second

Visual hierarchy comes from the **difference** between spacing levels, not from every gap being "on token". Use decreasing gaps as you go inward:

```text
Screen content      larger gap   between clusters
└─ Group            smaller gap  header → list
   ├─ Header
   └─ List          smallest gap between rows
```

Use **one left margin** for the whole screen. Several different margins read as a bug, not as hierarchy.

Choose the cluster gap by measurement. Compute the bottom edge of the last important element against the fold (and against any fixed ad or bar) before settling the value. One step on the spacing scale can push the third row of a list below the fold.

### Alignment: measure, then say it is aligned

These errors all look fine in a small screenshot:

| Symptom | Rule |
|---|---|
| Secondary text misaligned with title | Items in one column share the text's left edge: same media size, same gap. Measure the **text's** x, not the card's. |
| Icon off-center or clipped | A vector in a clipping icon frame needs CENTER constraints. Check its y inside the parent; 4 px off in a 16 px box is 25%. |
| Caret or overlay misplaced | An absolute element over an instance takes its coordinates from the real text node: x at the text's left edge, y centered on its line height. |
| List padding "has no effect" | Check the **direct** parent first. A card wrapped in a row frame gets its padding from the row. |
| Header title off-center | Pair a 44 × 44 back button with a symmetric 44 px spacer, and let the title FILL and center. |
| Rows grow after applying text styles | Snapping 15 → 16 or 13 → 14 changes row height. Re-measure rows, lists, and the fold. |

```js
const frame = await figma.getNodeByIdAsync(FRAME_ID);
const fx = frame.absoluteTransform[0][2];
return frame.findAllWithCriteria({ types: ['TEXT'] })
  .filter(t => ['Title', 'Name'].includes(t.name))
  .map(t => `${t.characters.slice(0, 16)} x=${Math.round(t.absoluteTransform[0][2] - fx)}`);
// every row should report the same x; 1 px is still a mismatch
```

When chrome changes (a taller keyboard, a new banner), recompute the visible area and tell the designer how many items still fit. Do not let them discover it.

---

## 8. Build hygiene

- Use the system's screen-shell component if it has one; it usually carries the status and navigation bars.
- Emphasis is a **variant property** (level, type), not a fill override.
- Never use an unpublished (`.` or `_`) set.
- **Never detach an instance.** It loses variant properties and every future library update.
- **A manual override on a bound property kills the binding.** The layer stops following modes, looks correct, and breaks later. Reset the override to re-bind.
- Touch targets are at least 44 px, verified by code.
- Every screen has a visible escape route.
- Check existing node bounds before placing a new section; sections overlap silently.
- Before fixing a reviewed section, capture the supported checkpoint or scoped backup described in `figma-mcp-api` and fix in place. Never duplicate a reviewed section; comments are pinned to node IDs.
- **Do not move a node between two override branches of the same instance** (for example from its content slot into its footer with `insertChild`). The move can look successful and render correctly, but the moved node's children lose their override registration; later reads or edits throw `does not exist`. Delete the node and create a fresh one at the destination instead. Reordering within one parent, or moving into a plain frame you just created, does not trigger this.
- Screenshots stay in the conversation and cost tokens every turn. Capture at checkpoints and inspect the pixels you capture.
- A timeout may occur after the write completed. Read the state before retrying.

### Present sections compactly

UI sections are a design under review: an even grid, one short label per element, and no multi-line annotations explaining decisions. Rationale belongs in the project's session log and node map, not on the canvas, where it competes with the design and goes stale.

---

## 9. Adopting an existing file

Screens pasted in from other files carry references to libraries that may not be enabled here. Their component keys fail to import, so they **cannot be rebased onto the design system by find-and-replace**. Measure the import rate on a sample before promising a conversion. When only a minority imports, plan a rebuild.

## 10. Deliver

Report the restore-point name, section and frame IDs, binding coverage (bound, deliberately local, not bindable), token substitutions as `old value → token → visual difference → decision`, contrast results for custom surfaces, screenshots, and what still needs the designer's judgment. If the project keeps a node map and session log, return the IDs and decisions in a form the main session can paste into them.
