const path = require("path");
const fs = require("fs");
const readline = require("readline");

async function checkEnv(debugMode = false) {
    console.log("checkEnv.js");
    if (debugMode) {
        console.log("------- Debug Mode Enabled ------");
        console.log("Debug mode is ON. Skipping .env creation.")
        console.log("---------------------------------");
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
            console.log(".env file created. Please configure it and restart the application.");
            console.log("Please press enter to quit...");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        
            new Promise(resolve => {
            rl.question("Please press Enter to quit...", () => {
                rl.close();
                resolve();
            });
            }).then(() => {
                process.exit(0);
            });
        } else {
            envs.WS_URL = "ws://127.0.0.1:24050/websocket/v2";
        }
    }

    return envs;
}

module.exports = { checkEnv };