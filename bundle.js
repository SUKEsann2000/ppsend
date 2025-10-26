const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,             // 依存を全部まとめる
  platform: 'node',         // Node.js 用
  target: ['node22'],       // Node v22 向け
  outfile: 'dist/bundle.js', 
  sourcemap: false,
  minify: false
}).catch(() => process.exit(1));
