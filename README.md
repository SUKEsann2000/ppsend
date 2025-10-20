# 🎯 ppsend

**ppsend** is a lightweight Node.js tool that automatically sends your **osu! performance points (PP)** to a **Discord webhook**, using real-time data from the `tosu!` WebSocket server.

---

## ✨ Features

* 🚀 **Automatic Tosu management** — downloads and keeps the `tosu!` binary up to date
* 🎮 **Real-time osu! data** — reads your current PP and beatmap info live from the game
* 🎨 **Custom Discord embeds** — color-coded messages based on your performance
* 🔧 **Simple setup** — works out of the box with minimal configuration

---

## 📦 Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourname/ppsend.git
   cd ppsend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```bash
   DISCORD_WEBHOOK=https://discord.com/api/webhooks/your_webhook_url
   WS_URL=ws://127.0.0.1:27000/json
   ```

---

## ▶️ Usage

Run the app:

```bash
npm run start
```

Once running, `ppsend` will automatically:

* Ensure you have the latest `tosu!` build
* Connect to your local Tosu WebSocket
* Send PP updates to your configured Discord webhook

---

## 💡 Tip: Launch with osu!

To make it seamless, you can **add `npm run start` to your osu! shortcut** so both osu! and `ppsend` start together.

Example (Windows shortcut target):

```
cmd /c "cd C:\path\to\ppsend && npm run start" && <osu!.exe's path>
```

You can then set this shortcut to run before or alongside osu! to keep your PP updates automatic.

---

## ⚙️ Dependencies

| Package                                                  | Description                           |
| -------------------------------------------------------- | ------------------------------------- |
| [dotenv](https://www.npmjs.com/package/dotenv)           | Loads `.env` config                   |
| [extract-zip](https://www.npmjs.com/package/extract-zip) | Unzips Tosu releases                  |
| [fs](https://www.npmjs.com/package/fs)                   | File system utilities (Node built-in) |
| [node-fetch](https://www.npmjs.com/package/node-fetch)   | Fetch API for Node.js                 |
| [path](https://www.npmjs.com/package/path)               | Path handling (Node built-in)         |
| [ws](https://www.npmjs.com/package/ws)                   | WebSocket client for Tosu             |

---

## 🧾 License

This project is licensed under the **MIT License**.
`tOSU!` is © 2023–2025 Mikhail Babynichev (LGPL-3.0 licensed).
