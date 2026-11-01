const cp = require('child_process');
const electron = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

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

const child = cp.spawn(electron, electronArgs, { env, stdio: 'inherit' });
child.on('close', (code, signal) => {
  if (code !== null) process.exit(code);
  process.exit(signal ? 1 : 0);
});
