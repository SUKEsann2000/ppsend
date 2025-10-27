# ppsend

**ppsend** is a lightweight Node.js tool that automatically sends your **osu! performance points (PP)** to a **Discord webhook**, using real-time data from the `tosu!` WebSocket server.

---

## Features

* **Automatic Tosu management** — downloads and keeps the `tosu` binary up to date
* **Real-time osu! data** — reads your current PP and beatmap info live from the game
* **Custom Discord embeds** — color-coded messages based on your performance
* **Simple setup** — works out of the box with minimal configuration

---

## Installation

1. Download latest one from releases:

   release page is [here](https://github.com/SUKEsann2000/ppsend/releases/latest)

2. Edit a `.env` file in the project root(`.env` file will create after running):

   ```bash
   DISCORD_WEBHOOK=https://discord.com/api/webhooks/xxxxx/yyyyy
   WS_URL=ws://127.0.0.1:24050/websocket/v2
   ```

---

## Usage

Run the app(e.g. ppsend.exe)

Once running, `ppsend` will automatically:

* Ensure you have the latest `tosu!` build
* Connect to your local Tosu WebSocket
* Send PP updates to your configured Discord webhook

---

## Tip: Launch with osu!

To make it seamless, you can **add `npm run start` to your osu! shortcut** so both osu! and `ppsend` start together.

Example (Windows shortcut target):

```
cmd /c "cd C:\path\to\ppsend && npm run start" && <osu!.exe's path>
```

You can then set this shortcut to run before or alongside osu! to keep your PP updates automatic.

---

## Dependencies

| Package                                                  | Description                           |
| -------------------------------------------------------- | ------------------------------------- |
| [dotenv](https://www.npmjs.com/package/dotenv)           | Loads `.env` config                   |
| [extract-zip](https://www.npmjs.com/package/extract-zip) | Unzips Tosu releases                  |
| [fs](https://www.npmjs.com/package/fs)                   | File system utilities (Node built-in) |
| [node-fetch](https://www.npmjs.com/package/node-fetch)   | Fetch API for Node.js                 |
| [path](https://www.npmjs.com/package/path)               | Path handling (Node built-in)         |
| [ws](https://www.npmjs.com/package/ws)                   | WebSocket client for Tosu             |
| [ESBuild](https://www.npmjs.com/package/esbuild)         | Bundle JS files for making SEA        |

---

## License

This project is licensed under the **MIT License**.
[`tosu`](https://github.com/tosuapp/tosu) is © 2023–2025 Mikhail Babynichev (LGPL-3.0 licensed).
