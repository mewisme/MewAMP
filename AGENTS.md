AGENTS.md — Repo agent guidance

## Project overview

MewAMP is a **local web stack desktop app** (Apache, PHP, MariaDB, optional phpMyAdmin). A guided **installer** downloads manifests, extracts runtimes, and writes config. The **dashboard** starts and stops managed services; **logs**, **settings**, **diagnostics**, and **SqlLocalDB** (Windows) are first-class flows.

It is **not** a generic Tauri starter: it includes installer pipelines, process management, and stack-specific UI.

## Tech stack

- **Frontend**: React 19, TypeScript, Vite 6
- **UI**: shadcn/ui, Tailwind CSS v4, Lucide
- **State**: Jotai (`src/stores/`)
- **Routing**: React Router v7 (`src/pages/`, routes in `src/app.tsx`)
- **Desktop**: Tauri v2, Rust 2021 (`src-tauri/`)

## Frontend layout

```
src/
├── app.tsx, main.tsx
├── components/          # Shared layout, shadcn-generated UI
├── features/
│   ├── dashboard/       # Apache, MariaDB, SqlLocalDB cards, quick actions
│   ├── setup/           # Core + modules wizards; registry in modules/registry.ts
│   ├── logs/            # Tabbed log viewer (app, installer, stack, SqlLocalDB)
│   ├── settings/        # Manifest, paths, appearance, ports, SqlLocalDB
│   ├── diagnostics/     # load / export / copy diagnostics JSON
│   ├── sql-localdb/     # Runtime hooks, global sync
│   ├── titlebar/        # Custom chrome (decorations: false)
│   └── updater/         # Version + Tauri updater UI
├── pages/               # Lazily loaded route shells
├── stores/              # Jotai atoms (services, setup, app, sql-localdb, …)
├── hooks/
└── lib/                 # tauri-commands.ts (typed invoke wrappers), utils, git-utils
```

**Invoke surface**: Prefer adding or extending wrappers in `src/lib/tauri-commands.ts` when introducing new backend commands so the UI stays typed and centralized.

## Backend layout (`src-tauri/src/`)

| Area | Role |
|------|------|
| `commands/` | Tauri `#[tauri::command]` handlers registered in `lib.rs` |
| `installer/` | Core + SqlLocalDB install orchestration |
| `process_manager/` | Managed Apache / MariaDB lifecycle |
| `manifest/`, `downloader/`, `archive/`, `checksum/` | Manifest resolve, download, verify, extract |
| `port_checker/`, `healthcheck/` | Ports and health signals |
| `diagnostics/`, `logs/` | Support bundle + log file paths |
| `state/` | Shared app/install state |
| `error/` | Error types |

**Windows subprocesses**: When spawning `Command` / shell tools from Rust, follow `.cursor/skills/rust-windows-no-console/SKILL.md` so consoles do not flash on Windows.

**Optional setup modules**: Adding a module to the Modules wizard (registry, cards, validation, Rust command) follows `.cursor/skills/mewamp-setup-modules/SKILL.md`.

## Tauri commands (registered in `lib.rs`)

Commands are grouped by module; exact Rust names live next to each `#[tauri::command]`.

**Utility**: `greet`, `get_opened_file_path`, `toggle_devtools`, `open_devtools`, `close_devtools`, `splash_close`

**Files** (`commands/files.rs`): `list_dir`, `read_file_content`, `write_file_content`, `create_directory`, `create_file`, `delete_node`, `rename_node`

**Git** (`commands/git.rs`): `get_current_branch`, `get_all_branches`, `switch_branch`, `get_git_status`, `git_pull`

**Installer** (`commands/installer.rs`): `start_install`, `install_sql_localdb_only`, `get_install_state`, `reset_install_state`

**SqlLocalDB** (`commands/sql_localdb.rs`): `get_sql_localdb_manifest_entries`, `sql_localdb_installer_supported`, `uninstall_app_managed_sql_localdb`, `sql_localdb_cli`, `list_sql_localdb_instances`, `sql_localdb_init_runtime`, `get_sql_localdb_instance_status`

**Services** (`commands/services.rs`): `start_service`, `start_managed_service`, `stop_service`, `get_service_status`

**Ports** (`commands/port_checker.rs`): `check_ports`

**Diagnostics** (`commands/diagnostics.rs`): `get_diagnostics`, `export_diagnostics`

**Logs** (`commands/logs.rs`): `get_logs_dir`, `get_log`, `clear_log_file`

**Settings** (`commands/settings.rs`): `get_app_settings`, `get_htdocs_path`, `open_folder`, `update_ports`, `update_paths`

When you add a command, register it in `generate_handler![...]` in `src-tauri/src/lib.rs` and expose a frontend wrapper in `tauri-commands.ts` unless the change is Rust-only tests or internal use.

## Build and scripts

- Web dev: `pnpm dev`
- Web build: `pnpm build` (`tsc && vite build`)
- Preview: `pnpm preview`
- Desktop dev: `pnpm app-dev` (uses `dotenv-cli` for env)
- Desktop build: `pnpm app-build`
- Icons: `pnpm icon` (source: `app-icon.png`)
- Version + changelog: `pnpm app-upver`
- Updater keys: `pnpm app-sign`
- Rename app metadata: `pnpm rename "NewName"`

## Tests and lint

No test runner or ESLint is committed by default. When adding tests or lint:

- **Vitest** (example): `pnpm add -D vitest @testing-library/react`, then `pnpm vitest -t "Your test name"` for a single test.
- **ESLint** (example): `pnpm add -D eslint`, then `pnpm eslint "src/**/*.{ts,tsx}" --fix`.

Add dependencies only when the task calls for it.

## Code style (agents must follow)

- **Imports**: external packages → `@/components` / `@/lib` → `@/features` / `@/stores` → relative; sorted within groups.
- **Formatting**: Prettier / TS defaults; 2-space indent.
- **Types**: explicit return types on exported functions and components; avoid `any` — use `unknown` and narrow.
- **React**: `PascalCase` files and components for UI.
- **Naming**: `camelCase` for functions and variables, `UPPER_SNAKE` for constants.
- **Exports**: prefer **named** exports for shared modules; app entry may use default export where the toolchain expects it.
- **Errors**: do not swallow errors; log with `console.error` on the frontend; propagate or map errors with context on the backend.
- **Purity**: keep components light; side effects in hooks or stores.

## Comments

Workspace rule: **minimal comments** — only when the *why* is non-obvious, platform-specific, or safety-critical. Prefer naming and structure. See `.cursor/rules/comment-policy.mdc`.

## UI and state

- shadcn/ui + Tailwind v4; new primitives: `pnpm dlx shadcn@latest add <component>`
- Global state: Jotai in `src/stores/`; keep atoms small and composable.

## Custom titlebar

The app uses `decorations: false` and a custom titlebar. Reference `.cursor/rules/tauri-titlebar.md` when changing window chrome, drag regions, or platform button behavior.

## Scope

This file applies to the whole repository. Match existing patterns in the nearest feature folder; keep changes scoped to the task.
