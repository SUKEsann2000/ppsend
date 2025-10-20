// Import required modules
import WebSocket from "ws";
import fetch from "node-fetch";
import "dotenv/config";
import start from "./tosuStart.js";

// Counter for WebSocket connection attempts
let wscount = 0;

const tosuPath = "./Tosu/tosu.exe";
start(tosuPath);
console.log("Tosu was started!");

const webhook = process.env.DISCORD_WEBHOOK;
// Keep track of the last heartbeat time
let newDate = Date.now();
// Flag to check if it's the first launch
let firstLaunch = true;
// Keep track of the last osu! status
let lastStatus = 0;

// Variable to hold the tosu! WebSocket client
let tosuWS;

let webhookLock = false;

// Connect to the tosu! WebSocket server with auto-reconnect
const connectWS = () =>
  new Promise((resolve) => {
    const tryConnect = () => {
      const ws = new WebSocket(process.env.WS_URL);
      wscount++;
      console.log("wscount: ", wscount);

      ws.on("open", () => {
        console.log("WebSocket connected!");
        resolve(ws);
      });

      ws.on("error", (err) => {
        console.error("WebSocket error:", err.message);
        ws.removeAllListeners();
        wscount--;
        // Retry connection after 1 second
        setTimeout(tryConnect, 1000);
      });

      ws.on("close", () => {
        ws.removeAllListeners();
        wscount--;
        console.log("WebSocket closed. Reconnecting...");
        // Retry connection after 1 second
        setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });

tosuWS = await connectWS();

// This event listener is registered only once to handle messages from tosu!
tosuWS.on("message", async (msg) => {
  const data = JSON.parse(msg);
  const status = data.state.number;
  const pp = data.play.pp.current;

  // On first launch, wait for osu! to be ready
  if (firstLaunch) {
    if (!data.error) {
      firstLaunch = false;
      console.log("osu! is ready!");
    }
    return;
  }

  // Update the last heartbeat time
  newDate = Date.now();

  console.log("last: ", lastStatus, " now: ", status)

  // When transitioning from playing (2) to results screen (7)
  if (lastStatus === 2 && status === 7) {
    if (webhookLock) {
        return;
    }
    webhookLock = true;
    const beatmap = data.beatmap;
    const { artistUnicode, titleUnicode, version, mapper, set, id } = beatmap;
    const { stars, bpm, ar, cs } = beatmap.stats;
    const { accuracy, playerName } = data.play;
    const { rank, maxCombo } = data.resultsScreen;

    const url = `https://osu.ppy.sh/beatmapsets/${set}#osu/${id}`;
    const minutes = Math.floor(beatmap.time.mp3Length / 60);
    const seconds = beatmap.time.mp3Length % 60;

    // Change embed color based on PP
    const color = pp < 15 ? 0x1abc9c : pp < 25 ? 0xd11a10 : 0x000000;

    // Create the embed to send to Discord
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
              inline: true
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

    console.log(embed)

    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embed),
      });
    } catch (err) {
      console.error("Webhook error:", err.message);
    }
  }

  if (lastStatus !== status) {
    webhookLock = false;
  }
  // Update the last status
  lastStatus = status;
});

// Monitor the heartbeat with osu!
setInterval(() => {
  // If no heartbeat for 5 seconds and not the first launch, exit.
  if (Date.now() - newDate >= 5000 && !firstLaunch) {
    console.log("Cannot HeartBeat to osu!");
    process.exit(1);
  }
}, 1000); // Check every second