const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,             // 依存を全部まとめる
  platform: 'node',         // Node.js 用
  target: ['node22'],       // Node v22 向け
  outfile: 'dist/bundled.js', 
  sourcemap: false,
  minify: false,
  format: 'cjs',
  define: {
    'process.env.WS_URL': JSON.stringify(process.env.WS_URL || ''),
    'process.env.DISCORD_WEBHOOK': JSON.stringify(process.env.DISCORD_WEBHOOK || ''),
  },
}).catch(() => process.exit(1));
