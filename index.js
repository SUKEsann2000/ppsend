// Import required modules
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const unzipper = require("extract-zip");
const readline = require("readline");

const { start } = require("./tosuStart.js");
const { checkEnv } = require("./checkEnv.js");
const { log } = require("./log.js");
const { createLockFile } = require("./lock.js");

// check debug mode
const debugMode = process.argv.includes("--ppSendDebug");

(async () => {
  log("INFO", "------- ppSend Started ------");
  log("INFO", "WHEN YOU SEE ANY ERRORS, PLEASE CHECK ppSend.log");
  log("INFO", "YOU CAN ALSO OPEN GitHub ISSUES");
  log("INFO", "-----------------------------");
  createLockFile();

  // setEnvs
  const envs = await checkEnv(debugMode);

  let wscount = 0;
  const tosuPath = "./Tosu/tosu.exe";
  start(tosuPath);
  log("INFO", "Tosu was started!");

  const webhook = envs.DISCORD_WEBHOOK;

  let newDate = Date.now();
  let firstLaunch = true;
  let lastStatus = 0;
  let tosuWS;
  let webhookLock = false;

  let connectFlag = false;

  const connectWS = () =>
    new Promise((resolve) => {
      const tryConnect = () => {
        const ws = new WebSocket(envs.WS_URL);
        wscount++;

        ws.on("open", () => {
          log("INFO", "WebSocket connected!");
          resolve(ws);
        });

        ws.on("error", (err) => {
          if (connectFlag) log("ERROR", "WebSocket error:", err.message);
          ws.removeAllListeners();
          wscount--;
          setTimeout(tryConnect, 1000);
        });

        ws.on("close", () => {
          ws.removeAllListeners();
          wscount--;
          log("WARN", "WebSocket closed. Reconnecting...");
          setTimeout(tryConnect, 1000);
        });
      };
      tryConnect();
    });

  connectWS().then((ws) => {
    tosuWS = ws;
    tosuWS.on("message", async (msg) => {
      const data = JSON.parse(msg);
      const status = data.state.number;
      const pp = data.play.pp.current;

      if (firstLaunch) {
        if (!data.error) {
          firstLaunch = false;
          log("INFO", "osu! is ready!");
        }
        return;
      }

      newDate = Date.now();

      if (lastStatus === 2 && status === 7) {
        if (webhookLock) return;
        webhookLock = true;

        if (pp < envs.PPLIMIT) {
          log("INFO", `Play pp ${pp.toFixed(2)} is below the limit ${envs.PPLIMIT}. Skipping webhook.`);
          if (lastStatus !== status) webhookLock = false;
          lastStatus = status;
          return;
        }

        const beatmap = data.beatmap;
        const { artistUnicode, titleUnicode, version, mapper, set, id, time } = beatmap;
        const { stars, bpm, ar, cs } = beatmap.stats;
        const { accuracy, playerName } = data.play;
        const { rank, maxCombo } = data.resultsScreen;

        const url = `https://osu.ppy.sh/beatmapsets/${set}#osu/${id}`;
        const length = time.lastObject - time.firstObject;
        const minutes = Math.floor(length / 60000);
        const seconds = Math.floor((length % 60000) / 1000);

        const color = getColor(pp);

        const embed = {
          embeds: [
            {
              title: `${artistUnicode} - ${titleUnicode} [${version}]`,
              url,
              color,
              fields: [
                {
                  name: `🔍 ${playerName}'s rank and accuracy`,
                  value: `${rank} - ${accuracy.toFixed(2)}%`,
                  inline: false,
                },
                {
                  name: `🔥 ${playerName}'s PP`,
                  value: `${pp.toFixed(2)}pp`,
                  inline: true,
                },
                {
                  name: `🌀 ${playerName}'s combo`,
                  value: `${maxCombo}`,
                  inline: true,
                },
                { name: "⭐ Difficulty", value: `${stars.total}★`, inline: true },
                { name: "🎧 BPM", value: `${bpm.common}`, inline: true },
                {
                  name: "🕒 Length",
                  value: `${minutes}:${seconds.toString().padStart(2, "0")}`,
                  inline: true,
                },
                {
                  name: "🎯 AR / CS",
                  value: `AR ${ar.original} / CS ${cs.original}`,
                  inline: true,
                },
                { name: "👤 Mapper", value: mapper, inline: true },
                { name: "🔗 Beatmap Link", value: `[Open in osu!](${url})` },
              ],
            },
          ],
        };

        try {
          fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed),
          });
          log("INFO", `Sent webhook for ${playerName}'s play on ${titleUnicode} [${version}]`);
        } catch (err) {
          log("ERROR", "Webhook error:", err.message);
        }
      }

      if (lastStatus !== status) webhookLock = false;
      lastStatus = status;
    });
    log("INFO", "tosuWS is ready");
  });

  setInterval(() => {
    if (Date.now() - newDate >= 5000 && !firstLaunch) {
      log("ERROR", "Cannot HeartBeat to osu!");
      process.exit(1);
    }
  }, 1000);

})();

function getColor(pp) {
  if (pp < 5) return 0x0000ff;
  if (pp > 50) pp = 50;

  const ratio = (pp - 5) / (50 - 5);
  const colors = [0x0000ff, 0x00ff00, 0xffff00, 0xff8000, 0xff0000];
  const index = ratio * (colors.length - 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  const t = index - low;

  const r = ((colors[high] >> 16 & 0xff) * t + (colors[low] >> 16 & 0xff) * (1 - t)) | 0;
  const g = ((colors[high] >> 8 & 0xff) * t + (colors[low] >> 8 & 0xff) * (1 - t)) | 0;
  const b = ((colors[high] & 0xff) * t + (colors[low] & 0xff) * (1 - t)) | 0;

  return (r << 16) | (g << 8) | b;
}
