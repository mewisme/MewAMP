---
name: mewamp-setup-modules
description: Registers a new optional install module in the MewAMP Setup Wizard modules flow (registry, config card, validation, Rust command, complete badges). Use when adding setup modules, extending SETUP_MODULE_IDS, or wiring Modules setup after creating a new installer.
---

# MewAMP: add a setup module

Modules setup lives under `src/features/setup/modules/`. Install order follows `SETUP_MODULE_IDS` in `registry.ts` (not user selection order).

## 1. Registry

**File:** `src/features/setup/modules/registry.ts`

- Append the id to `SETUP_MODULE_IDS` (const tuple — this updates `SetupModuleId`).
- Add a `SETUP_MODULE_REGISTRY[id]` entry: `title`, `shortDescription`, `selectionDetail`, `icon`, `platforms` (`windows` | `macos` | `linux`).

Selection and landing visibility use `getSetupModulesForPlatform()`. Empty list disables the Modules card on the setup landing.

## 2. Module config state (if needed)

**File:** `src/stores/setup.ts`

- Add a type + Jotai `atom` for options the UI edits (pattern: `sqlLocaldbModuleConfigAtom`).
- Import `SetupModuleId` from the registry only; keep `InstallConfig` / core atoms unchanged.

## 3. Config card

**New file:** `src/features/setup/modules/<ModuleName>ConfigCard.tsx`

- Prefer one `Card` with header (icon from registry) + `CardContent` fields, same style as `SqlLocalDbConfigCard.tsx`.
- Export props for config + any async data (manifest lists, etc.).

**File:** `src/features/setup/modules/ModulesConfigStep.tsx`

- Import the card.
- Inside the inner `space-y-4` div: `{selectedIds.includes("<id>") && <YourConfigCard ... />}`.
- Extend the component props when the wizard must pass new data.

## 4. Wizard: preload, validate, install

**File:** `src/features/setup/modules/ModulesSetupWizard.tsx`

- **Preload (optional):** Add state/effects gated by `step === 2` and `selectedIds.includes("<id>")` (see SqlLocalDB manifest load). Avoid work when the module is not selected.
- **`validateConfig`:** For each `orderedSelectedModules(selectedIds)`, add a branch for `<id>`; return `false` after `toast.error` on invalid input.
- **`onInstall`:** In the `for (const id of order)` loop, add `if (id === "<id>") { ... await invokeOrHelper(...) }`. Use early checks (OS, capability flags) and match Rust/backend errors to user-facing toasts.

## 5. Complete step badges

**File:** `src/features/setup/modules/ModulesCompleteStep.tsx`

- Default: `{meta.title}` badge from `SETUP_MODULE_REGISTRY`.
- Add a special branch (like `sqllocaldb`) when the badge should show version/instance from module config; extend props if you need another atom snapshot.

## 6. Backend (when the module runs installers/commands)

- Add Rust pipeline or command (e.g. under `src-tauri/src/installer/`).
- Register via `src-tauri/src/lib.rs` `invoke_handler`.
- Add `invoke` wrapper + types in `src/lib/tauri-commands.ts`.

Follow `AGENTS.md` and `.cursor/skills/rust-windows-no-console/SKILL.md` for Windows subprocess behavior.

## 7. Core shortcut (optional)

**File:** `src/features/setup/core/CoreSetupWizard.tsx`

- `openModules` sets `setSelectedModules([...])`. Include `"<id>"` if the link should pre-select your module (today includes `sqllocaldb`).

## Checklist

- [ ] `SETUP_MODULE_IDS` + `SETUP_MODULE_REGISTRY`
- [ ] Config atom(s) in `stores/setup.ts` if not zero-config
- [ ] Config card + `ModulesConfigStep` conditional
- [ ] `validateConfig` + `onInstall` branches in `ModulesSetupWizard`
- [ ] `ModulesCompleteStep` badge text if non-default
- [ ] Tauri command + `tauri-commands.ts` when hardware/software install exists

Reference implementation: `sqllocaldb` end-to-end in the same folders plus `install_sql_localdb_only` in the backend.
