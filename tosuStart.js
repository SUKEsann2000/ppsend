const fs = require("fs");
const { spawn, execSync } = require("child_process");
const path = require("path");
const os = require("os");
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const AdmZip = require("adm-zip");

const system = os.type();

async function getLatest() {
    const res = await fetch("https://api.github.com/repos/tosuapp/tosu/releases/latest", {
        headers: { "User-Agent": "node.js" }
    });
    const releases = await res.json();
    const { name } = releases; // Tag name
    const dir = "./Tosu/";
    const expectedExePath =
        system === "Windows_NT"
            ? path.join(dir, `tosu-${name}.exe`)
            : path.join(dir, `tosu-${name}`);

    // If there are no latest
    if (!fs.existsSync(expectedExePath)) {
        console.log("No latest Tosu found. Cleaning old files...");
        if (fs.existsSync(dir)) {
            for (const file of fs.readdirSync(dir)) {
                fs.rmSync(path.join(dir, file), { recursive: true, force: true });
            }
        } else {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log("Installing latest Tosu...");

        // Select .zip
        let asset;
        if (system === "Windows_NT") {
            asset = releases.assets.find(a =>
                a.name.toLowerCase().includes("windows") && a.name.endsWith(".zip")
            );
        } else if (system === "Linux") {
            asset = releases.assets.find(a =>
                a.name.toLowerCase().includes("linux") && a.name.endsWith(".zip")
            );
        } else {
            console.error("Unsupported OS for automatic download.");
            process.exit(1);
        }

        if (!asset) {
            console.error("No suitable ZIP asset found for download.");
            process.exit(1);
        }

        // Download the zip
        const assetRes = await fetch(asset.browser_download_url);
        const zipPath = path.join(dir, asset.name);
        const buffer = Buffer.from(await assetRes.arrayBuffer());
        fs.writeFileSync(zipPath, buffer);
        console.log(`Downloaded: ${zipPath}`);

        // Extract zip
        console.log("Extracting...");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(dir, true);

        // Delete zip
        fs.rmSync(zipPath);

        // Rename extracted binary
        const downloadedPath =
            system === "Windows_NT"
                ? path.join(dir, "tosu.exe")
                : path.join(dir, "tosu");
        fs.renameSync(downloadedPath, expectedExePath);

        console.log("Installation complete.");
    } else {
        console.log("Latest Tosu already installed.");
    }

    // Return object
    return name;
}

async function start() {
    const version = await getLatest().catch((e) => {
        console.error(`Error happened:\n${e}`);
    });

    const dir = "./Tosu/";
    const exeFullPath = path.resolve(dir, `tosu-${version}.exe`)
    const cwd = path.resolve(dir);

    if (!exeFullPath) {
        console.error("Executable path not found. Aborting.");
        return;
    }

    console.log(`Executable exists. Version: ${version}. Ready to run.`);

    return new Promise((resolveStart, reject) => {
        const child = spawn(exeFullPath, [], {
            cwd,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"]
        });

        child.stdout.on("data", (data) => {
            const line = data.toString();
            if (line.includes("osu! is ready")) {
                resolveStart();
            }
        });

        child.stderr.on("data", (data) => {
            console.error("[tosu stderr]", data.toString());
        });

        child.on("error", (err) => reject(err));
        child.on("exit", (code) => reject(new Error(`Tosu exited early with code ${code}`)));
    });
}

module.exports = { start };