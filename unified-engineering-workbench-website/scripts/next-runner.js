const path = require('path');
const fs = require('fs');

const wasmDir = path.resolve(__dirname, '../node_modules/@next/swc-wasm-nodejs');
if (fs.existsSync(wasmDir)) {
  process.env.NEXT_TEST_WASM_DIR = wasmDir;
}

const nextBin = require.resolve('next/dist/bin/next');
require(nextBin);
