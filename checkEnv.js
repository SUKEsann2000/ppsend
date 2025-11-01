const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { log } = require("./log.js");

async function checkEnv(debugMode = false) {
    if (debugMode) {
        log("INFO", "------- Debug Mode Enabled ------");
        log("INFO", "Debug mode is ON. Skipping .env creation.")
        log("INFO", "---------------------------------");
    };
    const envs = {};
    const envPath = path.join(__dirname, ".env");

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split(/\r?\n/);
        lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith("#")) return;
        const match = line.match(/^([\w]+)=(.*)$/);
        if (match) {
            let [, key, value] = match;
            key = key.replace(/^\uFEFF/, ""); // Remove BOM
            envs[key] = value.replace(/^["']|["']$/g, "").trim();
        }
        });
    } else {
        if (!debugMode) {
            fs.writeFileSync(envPath, "WS_URL=ws://127.0.0.1:24050\nDISCORD_WEBHOOK=<Your WebHook URL Here>\n", "utf-8");
            log("INFO", ".env file created. Please configure it and restart the application.");
            log("INFO", "Please close this and edit .env");
            process.stdin.resume();
            await new Promise(() => {});
        } else {
            envs.WS_URL = "ws://127.0.0.1:24050/websocket/v2";
        }
    }

    return envs;
}

module.exports = { checkEnv };