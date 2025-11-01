const fs = require("fs");
const { spawn, execSync } = require("child_process");
const path = require("path");
const os = require("os");
const unzipper = require("extract-zip");
const { log } = require("./log");

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
        log("INFO", "No latest Tosu found. Cleaning old files...");
        if (fs.existsSync(dir)) {
            for (const file of fs.readdirSync(dir)) {
                fs.rmSync(path.join(dir, file), { recursive: true, force: true });
            }
        } else {
            fs.mkdirSync(dir, { recursive: true });
        }

        log("INFO", "Installing latest Tosu...");

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
            log("ERROR", "Unsupported OS for automatic download.");
            process.exit(1);
        }

        if (!asset) {
            log("ERROR", "No suitable ZIP asset found for download.");
            process.exit(1);
        }

        // Download the zip
        const assetRes = await fetch(asset.browser_download_url);
        const zipPath = path.join(dir, asset.name);
        const buffer = Buffer.from(await assetRes.arrayBuffer());
        fs.writeFileSync(zipPath, buffer);
        log("INFO", `Downloaded: ${zipPath}`);

        // Extract zip
        log("INFO", "Extracting...");
        await unzipper(zipPath, { dir: path.resolve(dir) });

        // Delete zip
        fs.rmSync(zipPath);

        // Rename extracted binary
        const downloadedPath =
            system === "Windows_NT"
                ? path.join(dir, "tosu.exe")
                : path.join(dir, "tosu");
        fs.renameSync(downloadedPath, expectedExePath);

        // make .env for tosu
        const envContent = {
            DEBUG_LOG: false,
            ENABLE_AUTOUPDATE: false,
            OPEN_DASHBOARD_ON_STARTUP: false,

            SHOW_MP_COMMANDS: false,
            CALCULATE_PP: true,

            ENABLE_KEY_OVERLAY: false,
            ENABLE_INGAME_OVERLAY: false,

            POLL_RATE: 100,
            PRECISE_DATA_POLL_RATE: 10,

            INGAME_OVERLAY_KEYBIND: "Control + Shift + Space",
            INGAME_OVERLAY_MAX_FPS: 60,

            SERVER_IP: "127.0.0.1",
            SERVER_PORT: 24050,
            ALLOWED_IPS: "127.0.0.1,localhost,absolute",

            STATIC_FOLDER_PATH: "./static",
        }

        for (const [key, value] of Object.entries(envContent)) {
            fs.appendFileSync(path.join(dir, "tosu.env"), `${key}=${value}\n`);
        }

        log("INFO", "Installation complete.");
    } else {
        log("INFO", "Latest Tosu already installed.");
    }

    // Return object
    return name;
}

async function start() {
    const version = await getLatest().catch((e) => {
        log("ERROR", `Error happened:\n${e}`);
    });

    const dir = path.join(__dirname, "./Tosu/");
    const tosuFullPath = 
        system === "Windows_NT"
            ? path.join(dir, `tosu-${version}.exe`)
            : path.join(dir, `tosu-${version}`);
    const cwd = path.resolve(dir);

    if (!tosuFullPath || !fs.existsSync(tosuFullPath)) {
        log("ERROR", "Executable path not found. Aborting.");
        return;
    }

    log("INFO", `Executable exists. Version: ${version}. Ready to run.`);

    return new Promise((resolveStart, reject) => {
        const child = spawn(tosuFullPath, [], {
            cwd,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"]
        });

        const cleanup = () => {
            try {
                child.kill();
            } catch (e) {
                log("ERROR", "Error during cleanup:", e);
            }
        }

        process.on("exit", cleanup);
        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);

        child.stdout.on("data", (data) => {
            const line = data.toString();
            if (line.includes("osu! is ready")) {
                resolveStart();
            }
        });

        child.stderr.on("data", (data) => {
            log("[tosu stderr]", data.toString());
        });

        child.on("error", (err) => reject(err));
        child.on("exit", (code) => reject(new Error(`Tosu exited early with code ${code}`)));
    });
}

module.exports = { start };