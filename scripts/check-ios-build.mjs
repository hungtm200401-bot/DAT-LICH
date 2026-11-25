import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export function checkIOSBuild({ allowMissingPython = false } = {}) {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const available = spawnSync(python, ['--version'], { encoding: 'utf8' });
  if (available.error || available.status !== 0) {
    if (!allowMissingPython) throw new Error('Cần Python 3.9 trở lên để kiểm tra bundle trên máy.');
    console.log('Chưa có Python trên máy; GitHub sẽ chạy kiểm tra bundle trước khi build.');
    return;
  }
  const options = { cwd: root, stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } };
  execFileSync(python, ['-X', 'utf8', 'ios/ipa_bundle.py', 'sources', 'ios'], options);
  execFileSync(python, ['-X', 'utf8', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_ipa_bundle.py'], options);
  let bash = 'bash';
  if (process.platform === 'win32') {
    const gitPath = execFileSync('git', ['--exec-path'], { cwd: root, encoding: 'utf8' }).trim();
    bash = resolve(gitPath, '../../../bin/bash.exe');
  }
  if (process.platform !== 'win32' || existsSync(bash)) {
    for (const script of ['ios/build-ipa.sh', 'ios/export-signed-ipa.sh', 'ios/sign-adhoc-bundle.sh', 'ios/check-simulator.sh']) execFileSync(bash, ['-n', script], options);
    console.log('Bash syntax: PASS');
  } else console.log('Bash không có trên máy; cú pháp script sẽ được kiểm tra trên GitHub.');
  console.log('iPhone build preflight: PASS');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { checkIOSBuild(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
