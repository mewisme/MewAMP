# Tauri Desktop App Template

Template for building cross-platform desktop applications with Tauri, React, and TypeScript.

## Overview

This template is prepared for real-world development and includes:

- Tauri for native desktop runtime on macOS, Windows, and Linux
- React + TypeScript for frontend development
- shadcn/ui + Tailwind CSS for UI
- Jotai for global state management
- React Router for client-side routing
- Built-in Tauri commands for file system and Git operations

## Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- Tauri system dependencies (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

## Quick Start

```bash
git clone https://github.com/mewisme/tauri-template
cd tauri-template
pnpm install
pnpm app-dev
```

## Available Scripts

- `pnpm dev`: Run Vite dev server (web only)
- `pnpm build`: Type-check and build frontend (`tsc && vite build`)
- `pnpm preview`: Preview built frontend
- `pnpm app-dev`: Run the full Tauri desktop app in development
- `pnpm app-build`: Build production desktop binaries
- `pnpm tauri`: Run Tauri CLI commands
- `pnpm icon`: Generate app icons from `app-icon.png`
- `pnpm app-upver`: Generate changelog and bump app version
- `pnpm app-sign`: Generate signing key pair
- `pnpm rename "<App Name>"`: Rename app in key config files

## Rename App

Use:

```bash
pnpm rename "My Awesome App"
```

The script updates:

- `package.json` (`name`, kebab-case)
- `src-tauri/Cargo.toml` (`name`, `description`)
- `src-tauri/tauri.conf.json` (`productName`, `identifier`, window `title`)

Example result:

- package name: `my-awesome-app`
- product name: `My Awesome App`
- identifier: `com.my-awesome-app.app`

## Project Structure

```text
template-tauri/
├── src/                          # React frontend
│   ├── components/               # Shared UI components
│   ├── features/                 # Feature modules
│   ├── pages/                    # Route pages
│   ├── stores/                   # Jotai stores
│   ├── hooks/                    # Custom hooks
│   └── lib/                      # Utilities
├── src-tauri/                    # Rust + Tauri backend
│   ├── src/commands/             # Tauri commands
│   │   ├── files.rs              # File system commands
│   │   └── git.rs                # Git commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # Static assets
├── components.json               # shadcn/ui config
└── vite.config.ts
```

## Built-in Tauri Commands

### File System (`src-tauri/src/commands/files.rs`)

- `list_dir(path: string)`
- `read_file_content(path: string)`
- `write_file_content(path: string, content: string)`
- `create_directory(path: string)`
- `create_file(path: string)`
- `delete_node(path: string)`
- `rename_node(old_path: string, new_path: string)`

### Git (`src-tauri/src/commands/git.rs`)

- `get_current_branch(working_dir: string)`
- `get_all_branches(working_dir: string)`
- `switch_branch(working_dir: string, branch: string)`
- `get_git_status(working_dir: string)`
- `git_pull(working_dir: string)`

## Build for Production

```bash
pnpm build
pnpm app-build
```

Output binaries are generated in `src-tauri/target/release`.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- State: Jotai
- Routing: React Router
- Desktop runtime: Tauri
- Backend language: Rust

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
