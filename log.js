const fs = require('fs');
const path = require('path');

function getCallerLocation(depth = 2) {
  const stack = new Error().stack.split("\n");
  const line = stack[depth]?.trim();
  return line?.match(/\((.*)\)/)?.[1] || line || "unknown";
}

function log(level, ...msg) {
  const time = new Date().toISOString().replace("T", " ").replace("Z", "");
  const caller = getCallerLocation(3); // 呼び出し元のスタック位置
  const logLine = `[${time}] [${level}] [${caller}] ${msg.join(" ")}`;
  console.log(logLine);
  const logPath = path.join(__dirname, "ppSend.log");
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "", "utf-8");
  }
  fs.appendFileSync(logPath, logLine + "\n", 'utf-8');
}

module.exports = { log };