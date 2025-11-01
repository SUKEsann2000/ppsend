const fs = require("fs");
const path = require("path");
const { log } = require("./log.js");

const lockFilePath = path.join(__dirname, "ppSend.lock");

function createLockFile() {
    if (fs.existsSync(lockFilePath)) {
        let oldPid;
        try {
            oldPid = parseInt(fs.readFileSync(lockFilePath, "utf-8"));
        } catch (e) {
            log("WARN", "Failed to read lock file. Overwriting.");
        }

        if (oldPid) {
            try {
                process.kill(oldPid, 0);
                log("ERROR", `This app is already running (PID: ${oldPid}). Exiting.`);
                process.exit(1);
            } catch {
                log("WARN", `Found stale lock file (PID: ${oldPid}). Overwriting.`);
                fs.unlinkSync(lockFilePath);
            }
        }
    }

    fs.writeFileSync(lockFilePath, process.pid.toString());
    log("INFO", `Lock file created (PID: ${process.pid}).`);

    const cleanup = () => {
        if (fs.existsSync(lockFilePath)) {
            fs.unlinkSync(lockFilePath);
            log("INFO", "Lock file removed.");
        }
    };
    process.on("exit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGQUIT", cleanup);
    process.on("SIGHUP", cleanup);
    process.on("uncaughtException", (err) => {
        log("ERROR", `Uncaught exception: ${err}`);
        cleanup();
        process.exit(1);
    });
}

module.exports = { createLockFile };
