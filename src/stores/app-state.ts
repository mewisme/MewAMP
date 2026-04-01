import { atom } from "jotai";
import type { InstallState } from "@/lib/tauri-commands";

export const appStateAtom = atom<InstallState | null>(null);
export const appStateLoadingAtom = atom<boolean>(true);
