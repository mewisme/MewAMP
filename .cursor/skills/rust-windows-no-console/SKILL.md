---
name: rust-windows-no-console
description: Ensures Rust subprocesses (cmd.exe, PowerShell, git, installers, etc.) spawn without a visible console on Windows via CREATE_NO_WINDOW. Use when adding or editing std::process::Command, tokio::process::Command, shell invocation, or any backend code that runs external commands in this Tauri app.
---

# Rust backend: spawn commands with no window (Windows)

## Rule

Whenever the Rust backend runs an external executable or shell (`cmd`, `powershell`, `git`, `msiexec`, helpers, etc.), the process **must** be configured so **no console window flashes** on Windows.

Non-Windows targets do not need this.

## Standard pattern

1. Import the Windows extension trait when building the command:

```rust
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
```

2. Define the flag once per module (or share a small `const` in a common module):

```rust
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;
```

3. After configuring `Command` (program, args, cwd, stdio, env), apply the flag **before** `spawn()`, `output()`, or `status()`:

```rust
let mut cmd = Command::new("program");
// ... .args(...), .current_dir(...), etc.
#[cfg(target_os = "windows")]
cmd.creation_flags(CREATE_NO_WINDOW);
```

Use the same pattern for **`std::process::Command`** and **`tokio::process::Command`**.

## Reference implementations in this repo

- `src-tauri/src/process_manager/mod.rs` — `tokio::process::Command` + `creation_flags`
- `src-tauri/src/commands/git.rs` — `std::process::Command` + `creation_flags`

## Exceptions

- Only skip `CREATE_NO_WINDOW` when the feature **intentionally** must show a console or desktop UI to the user (e.g. opening `explorer.exe` for a folder). Document why in a short comment next to that call.
- Do not use this skill to change long-running **managed** child processes unless product requirements say otherwise; still prefer no flash for brief CLI helpers.

## Checklist (new or changed command)

- [ ] `CommandExt` imported under `#[cfg(target_os = "windows")]`
- [ ] `creation_flags(CREATE_NO_WINDOW)` applied on Windows before execution
- [ ] If no flag: justified exception with comment
