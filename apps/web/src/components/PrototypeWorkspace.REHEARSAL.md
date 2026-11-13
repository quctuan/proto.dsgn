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
