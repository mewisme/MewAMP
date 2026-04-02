import { invoke } from "@tauri-apps/api/core";

export async function getCurrentBranch(workingDir: string): Promise<string> {
    try {
        const branch = await invoke<string>("get_current_branch", { workingDir });
        return branch;
    } catch (error) {
        console.error("Failed to get current branch:", error);
        return "";
    }
}

export async function getAllBranches(workingDir: string): Promise<string[]> {
    try {
        const branches = await invoke<string[]>("get_all_branches", { workingDir });
        return branches;
    } catch (error) {
        console.error("Failed to get all branches:", error);
        return [];
    }
}

export async function switchBranch(workingDir: string, branchName: string): Promise<boolean> {
    try {
        await invoke<string>("switch_branch", { workingDir, branch: branchName });
        return true;
    } catch (error) {
        console.error("Failed to switch branch:", error);
        return false;
    }
}

export async function getGitStatus(workingDir: string): Promise<Record<string, string>> {
    try {
        const statusMap = await invoke<Record<string, string>>("get_git_status", { workingDir });
        return statusMap;
    } catch (error) {
        console.error("Failed to get git status:", error);
        return {};
    }
}

export function getGitStatusColor(status: string | undefined): string {
    if (!status) return "";

    switch (status) {
        case "modified":
            return "text-orange-500";
        case "added":
        case "untracked":
            return "text-green-500";
        case "deleted":
            return "text-red-500";
        case "renamed":
            return "text-blue-500";
        case "copied":
            return "text-purple-500";
        default:
            return "";
    }
}

export function getFolderGitStatus(
    folderPath: string,
    gitStatus: Record<string, string>
): string | undefined {
    if (gitStatus[folderPath]) {
        return gitStatus[folderPath];
    }

    const folderPathWithSlash = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    for (const [path, status] of Object.entries(gitStatus)) {
        if (path.startsWith(folderPathWithSlash)) {
            if (status === "added" || status === "untracked") {
                return "untracked";
            }
        }
    }

    return undefined;
}

export function getEffectiveGitStatus(
    itemPath: string,
    isDir: boolean,
    gitStatus: Record<string, string>
): string | undefined {
    if (isDir) {
        return getFolderGitStatus(itemPath, gitStatus);
    }

    if (gitStatus[itemPath]) {
        return gitStatus[itemPath];
    }

    let currentPath = itemPath;
    while (currentPath.includes('/')) {
        const lastSlash = currentPath.lastIndexOf('/');
        const parentPath = currentPath.substring(0, lastSlash);

        if (gitStatus[parentPath] === "untracked" || gitStatus[parentPath] === "added") {
            return gitStatus[parentPath];
        }

        currentPath = parentPath;
    }

    return undefined;
}

export async function gitPull(workingDir: string): Promise<{ success: boolean; output: string }> {
    try {
        const output = await invoke<string>("git_pull", { workingDir });
        return { success: true, output };
    } catch (error) {
        console.error("Failed to git pull:", error);
        return { success: false, output: String(error) };
    }
}
