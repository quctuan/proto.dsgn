---
name: figma-prototype-motion
description: Build or debug multi-step Smart Animate prototypes in Figma through Figma MCP. Use for motion chains, reactions, timing, and handoff; not for static screens or code prototypes.
metadata:
  author: quctuan
  version: 1.0.0
  mcp-server: figma
od:
  mode: utility
triggers:
  - "figma-prototype-motion"
---

Read [Codex runtime guidance](../../CODEX_RUNTIME.md) before this workflow.


# Figma prototype motion

Smart Animate is a keyframe tool with a narrow contract. Almost every "the
animation feels wrong" report traces to breaking that contract, **not** to
picking bad numbers. Diagnose structure first; tune durations last.

Before editing, confirm the target Figma file by explicit file key and name. Save a named version-history restore point before the first write. Read the Figma MCP Plugin API reference for the API surface used in this task.

---

## 1. The five hard constraints

**1. Smart Animate matches by layer name AND position in the layer tree.**
Move a layer to a different parent between two frames and Figma sees two
different layers — it cross-dissolves instead of interpolating, silently.
The whole motion you built is discarded and it still "plays", so this is
invisible until you look.

> Keep every animated layer at the **same path in every frame of the chain**.
> If a layer must travel outside its container, move it out in *all* frames,
> including the rest state.

**2. One duration and one curve per transition.** You cannot have element A
move fast while element B settles slowly in the same beat. To change curve,
split the frame. This is why a 1-second motion becomes 6-8 frames.

**3. `AFTER_TIMEOUT` rejects `0`** — Figma silently coerces it to **0.8s**.
Use `0.01`. Miss this on 3 hops and you have added 2.4 seconds without any
error message. Always read the value back after setting it.

**4. Clone inherits reactions.** Cloning a frame — *or a single button inside
one* — copies its ON_CLICK. You get frames that navigate to themselves.
Check the ON_CLICK count after **every** clone. Only the rest frame should
have any.

**Clone also inherits the flow starting point.** Nothing warns you: clone the
entry frame N times and the Present dropdown fills with N identically-named
entries, so the user cannot tell which frame actually starts the chain. Assert
after every rebuild that the chain owns **exactly one**:

```js
const mine = [/* every frame id in the chain */];
figma.currentPage.flowStartingPoints =
  figma.currentPage.flowStartingPoints.filter(fp => !mine.includes(fp.nodeId) || fp.nodeId === START);
```

Filter — never assign a fresh array. Other chains on the same page keep their
own entries there, and overwriting wipes them.

**5. No mesh warp.** Figma cannot distort a shape along a curve. "Liquid",
"wave", "bendy" is faked with **non-uniform scale (squash & stretch) + an
arced path + corner-radius morph**. Don't go looking for a warp feature.

---

## 2. Rig the frame before you keyframe

**Break every auto-layout in the prototype frames.** A prototype frame is a keyframe rig, not a layout: the
moment you move, scale or rotate a child, auto-layout either shoves it back
into flow or reflows its siblings. Setting `layoutPositioning = "ABSOLUTE"`
to escape is worse — the parent loses the reserved space and everything below
jumps up.

Instances hide auto-layout you cannot reach (`layoutMode` on an instance child
throws), so detaching is part of the rig, not a separate decision:

```js
let g = 0;
while (g++ < 300) { const i = f.findOne(n => n.type === "INSTANCE"); if (!i) break; i.detachInstance(); }
f.findAll(n => "layoutMode" in n && n.layoutMode !== "NONE").forEach(n => { n.layoutMode = "NONE"; });
f.findAll(n => "clipsContent" in n && n.clipsContent).forEach(n => { n.clipsContent = false; });
f.clipsContent = true;                       // only the outer screen frame keeps clipping
```

Detach in a loop — one pass only reaches the outermost instances, and nested
ones surface as you go. Assert `findAll(INSTANCE).length === 0` and
`layoutMode !== "NONE"` count `=== 0` afterwards; both operations are
idempotent, so a lost `use_figma` response is safe to re-run.

**Once auto-layout is gone, resizing stops re-centring anything.** Every pill
whose width you animate needs `constraints = { horizontal:"CENTER",
vertical:"CENTER" }` on its children, or the label sticks to the left edge
while the pill stretches right.

**Prove the rig changed nothing.** Snapshot every layer's absolute box keyed by
layer path before and after, then diff — layer count must match and drift must
be zero. This makes a large multi-frame detach auditable instead of a leap.

### The invisible ceiling

Every ancestor with `clipsContent` crops what grows mid-flight. At rest the
content fits its container exactly, so the crop **cannot be seen in the static
frame** — it only appears while playing, and comes back as *"there's a ceiling
catching the chips"*. A scaled and rotated group can overflow its container even when the rest frame looks correct.

Turn `clipsContent` off on every ancestor except the outermost screen frame,
and size any gradient mask past the content by the **largest scale + rotation
excursion in the chain**, never to the content box. A mask is alpha, not
layout: growing it costs nothing and it clips exactly like a frame would.

---

## 3. Acceleration lives in the spacing, not the easing

The single highest-leverage technique here.

To make something accelerate across N keyframes, give every segment the
**same duration** and **`LINEAR`** easing, then space the keyframes at an
increasing ratio (**1:2:3:4** is a good default; 1:3:5:7 is a harder launch).

Putting `EASE_IN` on one segment while the distances are uneven produces a
**velocity wobble** — speeds up, slows down, speeds up. It reads as a gorgeous
still frame and a janky animation.

**Always measure velocity before declaring it smooth:**

```js
// distance / duration per segment — must increase monotonically
const pts = [[180,377],[175,410],[169,477],[201,573],[247,700]]; // centres
const durs = [75,75,75,75];
pts.slice(1).map((p,i) => {
  const d = Math.hypot(p[0]-pts[i][0], p[1]-pts[i][1]);
  return `${Math.round(d)}px / ${durs[i]}ms = ${(d/durs[i]).toFixed(2)} px/ms`;
});
```

Example velocity check: `0.77 → 0.93 → 0.82 → 0.80` (wobble) became
`0.44 → 0.89 → 1.35 → 1.80` (constant acceleration, +0.45 each).

**Stretch must follow speed.** The element is most elongated on its *fastest*
segment, and squashes on impact. Stretching early looks wrong even if nobody
can say why.

---

## 4. Motion rules that survived real review

- **Nothing after the destination settles.** A beat that runs once the
  incoming element is at rest reads as "the transition is slow", even when
  that transition is identical to one the user just called fine. If a
  confirmation needs dwell time, put the dwell **before** the arrival and let
  it fade **during** the arrival.
- **Opposite meanings get opposite motion.** A confirm and a dismiss must not
  share an exit, or the animation asserts something false about the dismissed
  item. Make the cheap action visibly quicker too.
- **Anticipation runs against the exit direction.** Leaving left → wind up
  right. Falling → compress down.
- **Swap copy/content at `opacity: 0`.** Text cross-fading in place always
  reads as a render bug.
- **Invisible reset.** To teleport an element back to its entry position,
  give it `opacity: 0` in the frames on *both* sides of the jump. This is the
  only way to avoid a visible fly-back.
- **Overlap, don't queue.** Exit and entry should share time. Figma can't
  overlap within one transition — chain short frames instead.
- **Press feedback scales the icon, not the button frame.** Scaling the frame
  drags the label with it, so two buttons end up behaving differently.

---

## 5. Reusable helpers

```js
// --- set a timed hop, preserving non-timeout reactions (e.g. ON_PRESS) ---
const nav = (dest, dur, ease) => ({
  type:"NODE", destinationId:dest, navigation:"NAVIGATE",
  transition:{ type:"SMART_ANIMATE", easing:{ type:ease }, duration:dur },
  preserveScrollPosition:false
});
const hop = async (fromId, destId, dur, ease, wait = 0.01) => {
  const n = await figma.getNodeByIdAsync(fromId);
  const keep = (n.reactions||[]).filter(r => r.trigger.type !== "AFTER_TIMEOUT");
  await n.setReactionsAsync([...keep,
    { trigger:{ type:"AFTER_TIMEOUT", timeout:wait }, actions:[ nav(destId, dur, ease) ] }]);
};
```

```js
// --- set one keyframe: proportional rescale, then non-uniform squash,
//     positioned by the VISIBLE inner shape's centre ---
async function setKeyframe(frameId, baseCard, layerName, w, h, cx, cy, r, op) {
  const f = await figma.getNodeByIdAsync(frameId);
  const app = f.children.find(c => c.name === "Screen Content");
  const old = app.children.find(c => c.name === layerName);
  const idx = old ? app.children.indexOf(old) : app.children.length;
  if (old) old.remove();
  const fresh = baseCard.clone();          // clone from the rest frame = known base
  app.insertChild(idx, fresh);
  fresh.rescale(w / BASE_INNER_W);         // scales children AND font sizes
  const inner = fresh.children[0];
  inner.resize(w, h);                      // the squash/stretch
  inner.cornerRadius = r;
  inner.clipsContent = true;
  fresh.x = cx - inner.x - w/2;            // position by inner centre
  fresh.y = cy - inner.y - h/2;
  fresh.opacity = op;
}
```

`rescale()` scales font sizes too, which `resize()` does not — that is why
you rescale first and resize second.

---

## 6. Verify — never trust that it worked

Run this after every structural change. It has caught a self-referencing
frame twice.

```js
const chain = ["<ids in play order>"];
const names = {}; for (const id of chain) names[id] = (await figma.getNodeByIdAsync(id)).name;
const incoming = {}; const edges = []; let clicks = 0;
for (const id of chain) {
  const f = await figma.getNodeByIdAsync(id);
  const walk = n => {
    for (const r of (n.reactions||[])) {
      if (r.trigger.type === "ON_CLICK") clicks++;
      for (const a of (r.actions||[])) {
        if (!a.destinationId || !a.transition || r.trigger.type === "ON_PRESS") continue;
        incoming[a.destinationId] = (incoming[a.destinationId]||0)+1;
        edges.push(`${names[id]} --${r.trigger.type}+${Math.round((r.trigger.timeout||0)*1000)}ms--> `
          + `${names[a.destinationId]||a.destinationId} ${Math.round(a.transition.duration*1000)}ms `
          + a.transition.easing.type);
      }
    }
    if (n.children) n.children.forEach(walk);
  };
  walk(f);
}
return { edges, orphans: chain.filter(id => !incoming[id] && id !== chain[0]), clicks };
```

Assert three things: **`orphans` is empty**, **`clicks` equals the number of
real entry points**, and every timeout is the value you set (not `800`).

On a rebuilt chain, four more: **zero instances**, **zero auto-layout**,
**identical layer paths across every frame** (compare the joined path list —
exclude each frame's own name, which is meant to differ), and **exactly one
flow starting point**.

Then screenshot the widest keyframe and the one with the most deformation.

⚠️ **`rescale()` on a deep tree exceeds the default 5s `use_figma`
timeout, but the write still completes.** You lose the response, not the work.
**Read the state back — do not re-run**, or every transform applies twice.
Pass `timeout: 30000` on calls that rescale.

---

## 7. Package it for hand-off

**The doc is a build sheet, not a description of the prototype.** Organise it
around what the engineer types, and demote everything that is an artifact of
the rig — frame map, intermediate `→` frames, `AFTER_TIMEOUT` workarounds,
positional offsets standing in for a stagger — into an appendix that says, in
words, **do not implement these**. The failure mode is subtle: a doc that
explains the rig in §5 and corrects it in §11 is internally consistent and
still costs a build. Never let a later section quietly overrule an earlier one.

Same discipline on the numbers: one coordinate system throughout, the rotation
sign convention stated (Figma is CCW-positive, Android View is the inverse),
and totals recomputed **without** the `0.01` timeouts. Exclude the Figma-only timeout hops from implementation totals. Record the corrected totals in the handoff so engineers do not reproduce tooling workarounds.

Keep exactly one block of rationale: the constraints that stop a developer
optimising the effect away. Everything else the design file already holds.

**Section + numbered layer names are the contract with the doc.** Put the
chain in its own Section, lay the frames out left-to-right in play order, and
name them `01 · <role>` … `NN · <role>` matching the doc's frame map exactly.
When the chain changes, rename the layers *and* update the doc.

**Convert absolute values to transforms.** A spec that says `328×254 →
150×175` is not implementable — engineers animate `scaleX`/`scaleY` and
`translationX`/`translationY`, not layout size. Publish both: absolute values
as reference, transforms as the working table.

```
scaleX = w / restW      translationX = cx − restCx
scaleY = h / restH      translationY = cy − restCy
```

**State which delays are real.** The `0.01` timeouts are a Figma workaround;
in code they are `0`. Say so, or engineering will faithfully reproduce them.

**Match the target platform's animation API.** Android XML View system uses
duration + `Interpolator` (`SpringAnimation` takes *no duration* and will
break a timed chain; MotionLayout splines between keyframes by default and
will erase a LINEAR velocity ramp unless `transitionEasing="linear"` is set
per keyframe). Ask what the team ships in before writing the easing appendix.

---

## 8. What you cannot do from here

**You cannot play the prototype.** The MCP reads and writes structure; it has
no Present mode. You can verify geometry, the reaction graph, and every
number — you cannot verify how it *feels*. Say this plainly every time, hand
back the specific beat you are least sure about, and let the user play it.

Never report a motion as good because the numbers are right.
