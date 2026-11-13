// Stage B of plugin-driven-flow-plan — Home intent rail.
//
// The Home input card sits naked above an unstructured prompt. New
// users frequently type a request without knowing which scenario
// plugin to apply, which lands them in the generic agent path and
// stretches the convergence loop. This chip rail exposes high-signal
// NewProjectModal categories plus a small set of lower-row shortcuts
// (plugin authoring / Figma / template), so the same Enter
// keystroke can hit a scenario-bound run. The generic "other" path stays
// in the free-form prompt instead of becoming a redundant chip.
//
// The catalog stays a pure data table:
//   - `id` — stable React key + test selector.
//   - `label` — English copy. Localisation can layer on later by
//     swapping this for a Dict lookup; keeping it inline lets the
//     rail ship without burning through 17 locale files for two
//     new strings (see plan §B / open questions).
//   - `icon` — name from the shared Icon registry.
//   - `action` — discriminated union the HomeView dispatcher matches
//     on. The rail component itself stays presentational.

import type { ProjectKind, ProjectMetadata } from '@open-design/contracts';
import type { DefaultScenarioPluginId } from '@open-design/contracts';
import type { IconName } from '../Icon';
import { CREATION_TYPE_ORDER as CREATE_RAIL_ORDER } from '../creation-type-order';

// Plugin ids the chip rail can dispatch to. Most chips route to a
// `DefaultScenarioPluginId` so the same fallback table the daemon
// uses for naked Home queries stays the source of truth. Specialised
// chips (HyperFrames lives under `plugins/_official/examples/hyperframes/`
// and surfaces as the `example-hyperframes` bundled plugin id) bypass
// the default table by carrying their own plugin id directly. The
// curated union keeps typo safety while letting the rail evolve
// independently of the default-binding mapping.
export type ChipScenarioPluginId =
  | DefaultScenarioPluginId
  | 'example-hyperframes'
  // Powered-preview scenarios: real-time GPU / off-main-thread artifacts that
  // render in the cross-origin-isolated "powered preview" iframe. Kept as
  // explicit members — like example-hyperframes — so the rail can name a
  // scenario the default table has not mapped yet; both are mapped today.
  | 'example-webgl-experience';

export type ChipAction =
  | {
      kind: 'apply-scenario';
      pluginId: ChipScenarioPluginId;
      projectKind: ProjectKind;
      /**
       * Product-owned default route; the daemon resolves and stamps it.
       *
       * Set it on every first-level output type in `CREATE_RAIL_ORDER`: the
       * user picked a task type, not a plugin, so the create must travel as
       * `pluginSelectionProvenance: 'automatic-default'` and let the daemon
       * re-derive `pluginId` from the metadata. Forwarding the id instead
       * reads as a user pin — which is real authority elsewhere (it opts a
       * project out of OD Next), so the project is left with no
       * `automatic_default` scenario binding and the header offers to restore
       * an automatic scenario it never left.
       *
       * Only truthful when `pluginId` is exactly what
       * `defaultScenarioPluginIdForProjectMetadata` resolves for the metadata
       * this same chip stamps — otherwise dropping the id binds a different
       * plugin. `chips.automatic-default.test.ts` pins both halves.
       */
      automaticDefault?: boolean;
      inputs?: Record<string, unknown>;
      projectMetadata?: ProjectMetadata;
    }
  | {
      kind: 'apply-figma-migration';
      pluginId: 'od-figma-migration';
      projectKind: ProjectKind;
      inputs?: Record<string, unknown>;
      projectMetadata?: ProjectMetadata;
    }
  | { kind: 'create-plugin' }
  | { kind: 'open-template-picker' }
  // Routes the user into the Brand Kit tab and opens its New Brand Kit modal,
  // reusing the same extraction flow as the tab's own "New Brand Kit" button.
  | { kind: 'create-brand-kit' };

// Two intent groups: "create" = produce a design artifact, "migrate" =
// lower-row starter shortcuts such as plugin authoring, imports, and
// templates. The grouping is structural only — HomeHero renders the two
// groups in separate flex containers so they wrap onto separate rows on
// narrow viewports without horizontal scrolling.
export type ChipGroup = 'create' | 'migrate';

export interface HomeHeroChip {
  id: string;
  label: string;
  icon: IconName;
  group: ChipGroup;
  hint?: string;
  // Scenario subtitle shown under the title on the illustrated card rail
  // (e.g. "Interactive app mockups"). English inline fallback only — the
  // rendered copy is localized through the `homeHero.chip.<id>Desc` Dict key
  // (see `homeHeroChipDescription` in HomeHero.tsx). Kept on the data table so
  // the catalog reads as a self-contained scenario taxonomy.
  description?: string;
  action: ChipAction;
}

export const HOME_HERO_CHIPS: ReadonlyArray<HomeHeroChip> = [{
  id: 'prototype', label: 'Prototype', icon: 'artboard', group: 'create',
  description: 'Interactive app prototypes',
  action: { kind: 'apply-scenario', pluginId: 'example-web-prototype', projectKind: 'prototype', automaticDefault: true },
}];

export function chipsForGroup(group: ChipGroup): HomeHeroChip[] {
  return HOME_HERO_CHIPS.filter((c) => c.group === group);
}

// Preserve the existing Home API while sharing its priority with Community.
// Action-only entries (for example Create Design System) remain excluded.
export { CREATION_TYPE_ORDER as CREATE_RAIL_ORDER } from '../creation-type-order';

// The Home type row is an explicit product decision, not a width computation
// (OPEND-3146, 2026-09-16): three entry types stay inline, and 更多 holds EVERY
// other create type in this exact order, so no artifact kind loses its
// discoverable entry to the fold. The two lists together cover
// `CREATE_RAIL_ORDER`; `TypePillRow.more-order.test.tsx` pins both.
export const HOME_TYPE_ROW_IDS: readonly string[] = ['prototype'];
export const HOME_TYPE_ROW_MORE_IDS: readonly string[] = [];

// Chip ids the onboarding "build a design system" teaser intentionally omits.
// Video and Audio are pure-media outputs and the least central to the
// design-system story. Motion design is a separate film-creation entry, so
// it also stays off this curated teaser to preserve its single tidy row.
// Website clone starts
// from someone else's site rather than the user's design system, so it stays
// off the design-system teaser too.
const ONBOARDING_ARTIFACT_OMIT = new Set<string>(['web-clone', 'motion-design', 'video', 'audio']);

// The artifact chips shown on the onboarding "build a design system" step — a
// curated single-row subset of the create rail. Derived from CREATE_RAIL_ORDER
// (not a separately maintained list) so it stays in the same priority order as
// the Home rail and never drifts from the real template catalog.
export const ONBOARDING_ARTIFACT_CHIP_IDS = CREATE_RAIL_ORDER.filter(
  (id) => !ONBOARDING_ARTIFACT_OMIT.has(id),
);

// The top-level Home chips in their exact product order. Action-only catalog
// entries must not leak into the rail or template picker.
export function orderedCreateChips(): HomeHeroChip[] {
  const create = chipsForGroup('create');
  return CREATE_RAIL_ORDER
    .map((id) => create.find((c) => c.id === id))
    .filter((c): c is HomeHeroChip => Boolean(c));
}

// Cross-surface handoff: the workspace tabs-bar "+" fan picks a template
// outside the hero; HomeHero listens for this window event and applies the
// chip exactly as if its own template picker had been clicked.
export const HOME_APPLY_TEMPLATE_EVENT = 'open-design:home-apply-template';

// Helper used by tests + the rail component to pull the chip metadata
// off a click target without round-tripping through React state.
export function findChip(id: string): HomeHeroChip | undefined {
  return HOME_HERO_CHIPS.find((c) => c.id === id);
}
