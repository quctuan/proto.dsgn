# Workspace UI review

Production workspace, adapted from the user's three-pane design-tool reference. Stageshow craft guidance informed neutral surfaces, compact controls, and information hierarchy; no faux UI or animation kit was embedded in the application.

The existing chat runtime and HTML editing/comment/sharing tools remain the operational boundaries. The workspace defaults to a non-interactive static-screen board. Canvas supports panning, zooming, screen positioning, and screen resizing. Board geometry is stored in this browser per project. Preview selects interactive HTML files under prototypes/. Create prototype sends the active agent a revision request, preserving design files and previous revision folders.

Validation: full workspace typecheck, repository guard, and focused workspace/split tests. Browser inspection used an isolated local project with a static HTML screen and a separate prototype fixture. Canvas/Preview selection and zoom were inspected. The screenshot is a local development artifact, not a bundled demo.

Limits: no paid agent generation or remote publishing was run. The application uses its existing HTML manual-edit tools; this is not a full Figma vector/layer editor. Dev mode currently exposes frame dimensions and source format. Shared read-only/materializing and design-system projects retain the established workspace. Board geometry does not synchronize across browsers.

## Single toolbar revision

Reference: user-supplied workspace header. One left-aligned Canvas/Prototype pill, device selector, presence, existing History/Export/Share actions; Create prototype appears only on Canvas. Removed the second tab group, project label, duplicate history button and empty outer chrome band. Real application controls are retained; no Stageshow demo kit was embedded. Applied Stageshow craft guidance: say it once, simplify before polishing, consistent insets.

Validation: web TypeScript and four focused workspace tests passed, including tab destinations and conditional creation action. No motion was introduced. Browser screenshot comparison and narrow-screen visual review were not completed: the previous local tab was unavailable to the browser connector. Pixel parity is not claimed.

## Framer visual language

User references: three supplied Framer editor screenshots. Plan: one continuous toolbar; Screens/Prototype on the left, project title centered, creation and publishing controls on the right. Pages remain on the left, flat light-gray canvas in the middle, operational Agent chat on the right. Shared application tokens use blue #0099ff, white panels, gray fields, fine separators and restrained rounded controls. Prototype iframe content keeps its own styles. Narrow layouts stack Agent below the canvas and wrap the toolbar.

Validation: repository guard and full workspace typecheck passed; four workspace lifecycle tests passed. Browser inspection confirmed the Screens label, real pages, existing comment/export/share controls and the stacked narrow layout. CSS load order was corrected after inspection found legacy accent inheritance. No agent generation, paid service or publication flow was triggered. No exact pixel parity or full interaction parity with Framer is claimed.

## Cards, history and conversation recovery

Separated toolbar, Flows, canvas and Agent into rounded cards with ten-pixel gutters. Export/Share now use secondary surfaces. Fixed screen pointer capture so portaled header controls do not start canvas drags. Added a toolbar conversation toggle and explicit collapsed grid tracks; legacy workspace chrome is hidden in both states to prevent it intercepting the expand button.

Validation: six focused tests passed, web typecheck passed. Chrome inspection opened Version history and read one stored version, collapsed Agent, uncovered the legacy chrome hit-test blocker, then reopened Agent after the fix. Final screenshot: /tmp/proto-workspace-cards.png. No restore operation or agent generation was run.

Bundled the three requested upstream skills and connected quality instructions to the prototype template and generation/refinement scenarios. The running daemon lists all three as built-in utilities. Figma-specific workflows require connected Figma tools; Stageshow is the local UI default. Generated design quality has not been measured by a new agent run.

## Full-surface infinite canvas

The board now covers the whole project surface. Toolbar, Flows and Agent are positioned over it, with independent sidebar controls. Collapsing Flows separates the toolbar into floating corner groups. The default frame has a gray header; explicit selection switches its header and outline to blue. Headers show responsive device and actual frame width; a custom frame name may replace the device label.

Screen context menu manages board instances: Copy, Paste, Rename, Delete. Copies reference the same artifact file, while placement, custom names and deleted board instances persist in browser storage for this project. These actions do not duplicate, rename or remove the source artifact on disk. Native non-passive wheel handling maps two-finger scroll to pan and Ctrl/Command-wheel (including macOS pinch) to cursor-anchored exponential zoom; menu commands and Command shortcuts provide in/out, 100%, fit and selection. Fast zoom changes gesture sensitivity. Physical trackpad hardware was not separately exercised.

Validation: web typecheck and nine focused tests passed, covering persisted board operations, default/selected state, sidebar toggle and invariant cursor coordinates during pinch. Chrome inspection verified context menu, default/selected headers, floating collapsed controls, zoom menu, restored panels and canvas width equal to viewport width (1458px). Next dev indicator is disabled through Next config and absent after restart. Final images: /tmp/proto-infinite-canvas-final.png and /tmp/proto-infinite-canvas-zoom.png.

## Developer Properties

Dev mode keeps the preview rendered, enables the existing iframe inspect bridge, and replaces Agent (including its portaled composer) with a read-only Properties card. Page properties report real board dimensions; an element click reports selector, iframe-viewport bounds, computed layout, spacing, typography, appearance and generated CSS. Explicit data-component/data-od-component metadata is shown as a component name when supplied; unannotated DOM nodes remain elements. It does not claim native Figma component/variable metadata for HTML pages. View mode restores the previous Agent state. Inspector can collapse and reopen independently.

Validation: web typecheck and eleven focused tests passed. Browser inspection selected a real div.body and received 598×524 bounds, 17px/18px padding, 15px text and rgb(32,39,45) text color. Returning to View hid Properties and restored Agent. Computed style on selected Select and Dev toolbar buttons was rgb(34,34,34) with rgb(255,255,255) icons. Screenshot: /tmp/proto-dev-properties.png. No element edit/save or agent generation was performed.

## Responsive dropdown

Replaced the native select with a controlled custom popover matched to the supplied Agent history dropdown: white rounded surface, fine border/shadow, search field and gray option rows. Each device has its own monitor/tablet/phone icon, width annotation and selected checkmark. Trigger open/hover, option hover/pressed/selected/focus, empty results, keyboard arrows, Escape, outside dismissal and focus return are implemented. Selecting a device resizes the active board frame and its preview.

Validation: thirteen focused workspace/picker tests passed. Browser inspection selected Tablet (810px), Mobile (390px) and Desktop (1200px), with matching frame labels. Final screenshot /tmp/proto-responsive-dropdown.png. The menu was closed after review; Desktop is selected.

## Properties inspector styling — 2026-11-13
- Reference: supplied compact Properties sidebar screenshot; applied to the live inspector rather than an illustrative stage.
- Changed: inset light gray rows, right-aligned values, compact typography, neutral page action, collapsible property groups with keyboard focus and chevrons.
- Preserved: real CSS values, element selection, Copy CSS and sidebar collapse.
- Validation: web typecheck passed. No animation or fabricated merge/duplicate controls added.
