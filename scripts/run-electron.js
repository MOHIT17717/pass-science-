const cp = require('child_process');
const electron = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
// Prevent inheriting test environment variables from parent shell
delete env.TEST_AUTOCLOSE;
delete env.TEST_WORKBENCH_VERIFY;

const rawArgs = process.argv.slice(2);
const electronArgs = [];

for (const arg of rawArgs) {
  if (arg.startsWith('--test-autoclose=')) {
    env.TEST_AUTOCLOSE = arg.split('=')[1];
  } else if (arg === '--test-autoclose') {
    env.TEST_AUTOCLOSE = '3000';
  } else if (arg === '--test-verify') {
    env.TEST_WORKBENCH_VERIFY = '1';
  } else {
    electronArgs.push(arg);
  }
}

if (electronArgs.length === 0) {
  electronArgs.push('.');
}

const child = cp.spawn(electron, electronArgs, {
  env,
  stdio: 'inherit'
});

// Coordinate signals: do not exit prematurely on SIGINT/SIGTERM
// Let Electron run its shutdown lifecycle and exit when child exits.
process.on('SIGINT', () => {
  // Console broadcast delivers signal to child; await child exit
});

process.on('SIGTERM', () => {
  // Graceful shutdown coordinated by launcher control file; await child exit
});

child.on('close', (code, signal) => {
  if (code !== null) process.exit(code);
  process.exit(signal ? 1 : 0);
});
