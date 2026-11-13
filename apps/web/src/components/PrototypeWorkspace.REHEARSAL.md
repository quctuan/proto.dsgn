# Workspace UI review

Production workspace, adapted from the user's three-pane design-tool reference. Stageshow craft guidance informed neutral surfaces, compact controls, and information hierarchy; no faux UI or animation kit was embedded in the application.

The existing chat runtime and HTML editing/comment/sharing tools remain the operational boundaries. The workspace defaults to a non-interactive static-screen board. Canvas supports panning, zooming, screen positioning, and screen resizing. Board geometry is stored in this browser per project. Preview selects interactive HTML files under prototypes/. Create prototype sends the active agent a revision request, preserving design files and previous revision folders.

Validation: full workspace typecheck, repository guard, and focused workspace/split tests. Browser inspection used an isolated local project with a static HTML screen and a separate prototype fixture. Canvas/Preview selection and zoom were inspected. The screenshot is a local development artifact, not a bundled demo.

Limits: no paid agent generation or remote publishing was run. The application uses its existing HTML manual-edit tools; this is not a full Figma vector/layer editor. Dev mode currently exposes frame dimensions and source format. Shared read-only/materializing and design-system projects retain the established workspace. Board geometry does not synchronize across browsers.
