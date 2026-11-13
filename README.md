# proto.dsgn

A Designer’s IDE for drafting UI flows, building and reusing design systems, testing interactions early, and handing off working prototypes.

This fork focuses on interactive prototypes. Home and project creation only offer prototypes; Skills replaces the plugin marketplace; Design systems starts without bundled presets. Community, invitation/referral, billing shortcuts, and upstream promotional links are removed from the app shell.

Use Node 24 and Corepack with the pinned pnpm version:

```sh
corepack pnpm install
corepack pnpm tools-dev
```

Validation:

```sh
corepack pnpm guard
corepack pnpm typecheck
```

Desktop updates require an explicitly configured `OD_UPDATE_METADATA_URL`; this fork does not use the upstream release feed. Telemetry is opt-in by default.

Internal workspace package names and compatibility protocols retain their original identifiers. Existing projects remain readable. See [AGENTS.md](AGENTS.md) for runtime and data-directory contracts.

## License and attribution

Forked from [OpenDesign](https://github.com/nexu-io/open-design), licensed under Apache-2.0. Original copyright and third-party notices are retained in [LICENSE](LICENSE) and the relevant source files.
