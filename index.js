// 必要なモジュールをインポート
import WebSocket from "ws"; // WebSocket通信を行うためのモジュール
import fetch from "node-fetch"; // HTTPリクエストを行うためのモジュール
import "dotenv/config"; // .envファイルから環境変数を読み込むためのモジュール
import start from "./tosuStart.js"; // tosu.exeを起動するための自作モジュール

// WebSocketの接続試行回数をカウントする変数
let wscount = 0;

// tosu.exeのパス
const tosuPath = "./Tosu/tosu.exe";
// tosu.exeを起動
start(tosuPath);
console.log("Tosu was started!");

// DiscordのWebhook URLを環境変数から取得
const webhook = process.env.DISCORD_WEBHOOK;
// 最終的なハートビートの時刻を保持する変数
let newDate = Date.now();
// 初回起動かどうかを判定するフラグ
let firstLaunch = true;
// 最後のosu!のステータスを保持する変数
let lastStatus = 0;

// tosu!のWebSocketクライアントを格納する変数
let tosuWS;

let webhookLock = false;

// tosu!のWebSocketサーバーに接続し、再接続も行う関数
const connectWS = () =>
  new Promise((resolve) => {
    const tryConnect = () => {
      // WebSocketサーバーに接続
      const ws = new WebSocket(process.env.WS_URL);
      wscount++;
      console.log("wscount: ", wscount);

      // 接続が確立したときの処理
      ws.on("open", () => {
        console.log("WebSocket connected!");
        resolve(ws); // Promiseを解決してWebSocketインスタンスを返す
      });

      // エラーが発生したときの処理
      ws.on("error", (err) => {
        console.error("WebSocket error:", err.message);
        ws.removeAllListeners(); // イベントリスナーをすべて削除
        wscount--;
        // 1秒後に再接続を試みる
        setTimeout(tryConnect, 1000);
      });

      // 接続が閉じたときの処理
      ws.on("close", () => {
        ws.removeAllListeners(); // イベントリスナーをすべて削除
        wscount--;
        console.log("WebSocket closed. Reconnecting...");
        // 1秒後に再接続を試みる
        setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });

// WebSocketに接続
tosuWS = await connectWS();

// tosu!からのメッセージを受信したときの処理 (このイベントリスナーは一度だけ登録される)
tosuWS.on("message", async (msg) => {
  // 受信したJSON文字列をパース
  const data = JSON.parse(msg);
  // 現在のosu!のステータスを取得
  const status = data.state.number;
  // 現在のPPを取得
  const pp = data.play.pp.current;

  // 初回起動時の処理
  if (firstLaunch) {
    // エラーがない場合
    if (!data.error) {
      firstLaunch = false;
      console.log("osu! is ready!");
    }
    return; // 初回起動時は以降の処理を行わない
  }

  // 最終ハートビート時刻を更新
  newDate = Date.now();

  console.log("last: ", lastStatus, " now: ", status)
  //console.log(wscount);

  // プレイ中(2)から結果画面(7)に遷移した場合
  if (lastStatus === 2 && status === 7) {
    if (webhookLock) {
        return;
    }
    webhookLock = true;
    // ビートマップ情報を取得
    const beatmap = data.beatmap;
    const { artistUnicode, titleUnicode, version, mapper, set, id } = beatmap;
    const { stars, bpm, ar, cs } = beatmap.stats;
    // プレイ情報を取得
    const { accuracy, playerName } = data.play;
    const { rank, maxCombo } = data.resultsScreen;

    // ビートマップのURLを生成
    const url = `https://osu.ppy.sh/beatmapsets/${set}#osu/${id}`;
    // 曲の長さを分と秒に変換
    const minutes = Math.floor(beatmap.time.mp3Length / 60);
    const seconds = beatmap.time.mp3Length % 60;

    // PPに応じてEmbedの色を変更
    const color = pp < 15 ? 0x1abc9c : pp < 25 ? 0xd11a10 : 0x000000;

    // Discordに送信するEmbedを作成
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
      // WebhookにEmbedを送信
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
  // 最後のステータスを更新
  lastStatus = status;
});

// osu!とのハートビートを監視
setInterval(() => {
  // 5秒以上ハートビートが確認できず、かつ初回起動でない場合
  if (Date.now() - newDate >= 5000 && !firstLaunch) {
    console.log("Cannot HeartBeat to osu!");
    // プロセスを終了
    process.exit(1);
  }
}, 1000); // 1秒ごとにチェック
