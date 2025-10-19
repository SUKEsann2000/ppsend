import fs from "fs";
import { spawn, execSync } from "child_process";
import { resolve } from "path";
import { statSync } from "fs";
import os from "os";
import fetch from "node-fetch"; // npm install node-fetch

// Only Windows(sry) Get Version Of A File
function getFileVersion(exePath) {
    const cmd = `powershell -Command "(Get-Item '${exePath}').VersionInfo.FileVersion"`;
    const ver = execSync(cmd, { encoding: "utf8" }).trim();
    return ver.split(".").slice(0, 3).join("."); // major.minor.patch まで
}

export default async function start(tosu_path) {
    const exePath = resolve(process.cwd(), tosu_path);

    // check if there is a tosu.exe
    let exists = true;
    try {
        statSync(exePath);
    } catch (e) {
        exists = false;
    }

    const version = getFileVersion(exePath);

    if (!exists) {
        const system = os.type();
        console.log(`Executable not found. Detected OS: ${system}`);

        // Get Latest Release From GitHub.com
        const res = await fetch("https://api.github.com/repos/tosuapp/tosu/releases/latest", {
            headers: { "User-Agent": "node.js" }
        });
        const release = await res.json();

        let asset;
        if (system === "Windows_NT") {
            asset = release.assets.find(a => a.name.toLowerCase().includes("windows"));
        } else if (system === "Linux") {
            asset = release.assets.find(a => a.name.toLowerCase().includes("linux"));
        } else {
            console.error("Unsupported OS for automatic download.");
            process.exit(1);
        }

        if (!asset) {
            console.error("No suitable asset found for download.");
            process.exit(1);
        }

        console.log(`Download URL: ${asset.browser_download_url}`);
        console.log("You can download and place it manually at", exePath);
        process.exit(0);
    }

    console.log(`Executable exists. Version: ${version}. Ready to run.`);

    return new Promise((resolve, reject) => {
        const child = spawn(exePath, [], {
            cwd: resolve(process.cwd(), "./Tosu"),
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"]
        });

        child.stdout.on("data", (data) => {
            const line = data.toString();
            // 起動完了の目安をログから判定（例: "osu! is ready" が出たら）
            if (line.includes("osu! is ready")) {
                resolve();
            }
        });

        child.stderr.on("data", (data) => {
            console.error("[tosu stderr]", data.toString());
        });

        child.on("error", (err) => reject(err));
        child.on("exit", (code) => reject(new Error(`Tosu exited early with code ${code}`)));
    });
}