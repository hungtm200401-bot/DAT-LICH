import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('..', import.meta.url));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async path => { try { return await readFile(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } };

async function main() {
  if (git(['status', '--porcelain'])) throw new Error('Commit các thay đổi trước khi build IPA để xác định đúng mã nguồn.');
  const commit = git(['rev-parse', 'HEAD']);
  const branch = git(['branch', '--show-current']);
  if (!branch) throw new Error('Cần đứng trên một nhánh Git để build.');
  const remote = git(['remote', 'get-url', 'origin']);
  const match = /^(?:https:\/\/(?:[^/@]+@)?github\.com\/|git@github\.com:)([\w-]+)\/([\w.-]+?)(?:\.git)?$/.exec(remote);
  if (!match) throw new Error('Origin cần là repo GitHub của dự án.');
  const [, owner, repository] = match;
  let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    const credential = spawnSync('git', ['-c', 'credential.username=' + owner, 'credential', 'fill'], {
      cwd: root, encoding: 'utf8', input: `protocol=https\nhost=github.com\npath=${owner}/${repository}.git\nusername=${owner}\n\n`,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
    });
    if (credential.status === 0) token = credential.stdout.split(/\r?\n/).find(line => line.startsWith('password='))?.slice(9);
  }
  if (!token) throw new Error('Chưa có đăng nhập GitHub để chạy build và tải artifact. Đăng nhập Git Credential Manager hoặc đặt GH_TOKEN trong môi trường.');
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'HOAN-IPA-Builder', 'X-GitHub-Api-Version': '2022-11-28' };
  const apiRoot = `https://api.github.com/repos/${owner}/${repository}`;
  async function api(path, options = {}) {
    const response = await fetch(apiRoot + path, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(30_000) });
    if (response.status === 204) return null;
    const json = await response.json();
    if (!response.ok) throw new Error(`GitHub ${response.status}: ${json.message || 'Yêu cầu thất bại'}`);
    return json;
  }
  const remoteCommit = await api('/commits/' + commit);
  if (remoteCommit.sha !== commit) throw new Error('Đẩy đúng commit lên GitHub trước khi build.');
  const query = new URLSearchParams({ head_sha: commit, branch, per_page: '10' });
  const listRuns = async () => (await api('/actions/workflows/ios.yml/runs?' + query)).workflow_runs;
  let runs = await listRuns();
  let run = runs.find(item => item.status !== 'completed' || item.conclusion === 'success');
  if (!run) {
    await api('/actions/workflows/ios.yml/dispatches', { method: 'POST', body: JSON.stringify({ ref: branch }), headers: { 'Content-Type': 'application/json' } });
    for (let attempt = 0; attempt < 24 && !run; attempt++) {
      await delay(5000);
      runs = await listRuns();
      run = runs[0];
    }
  }
  if (!run || run.head_sha !== commit) throw new Error('Chưa tìm thấy workflow chạy đúng commit.');
  const reportPath = resolve(root, 'outputs/ci/ios-build-run.json');
  await mkdir(resolve(root, 'outputs/ci'), { recursive: true });
  console.log(`Build ${commit.slice(0, 8)}: ${run.html_url}`);
  let lastStatus = '';
  const deadline = Date.now() + 30 * 60_000;
  while (true) {
    const jobs = (await api(`/actions/runs/${run.id}/jobs?per_page=100`)).jobs;
    const status = jobs.map(job => `${job.name}: ${job.conclusion || job.status}`).join(' | ');
    if (status !== lastStatus) { console.log(status || run.status); lastStatus = status; }
    await writeFile(reportPath, JSON.stringify({ id: run.id, url: run.html_url, commit, status: run.status, conclusion: run.conclusion, jobs: jobs.map(job => ({ id: job.id, name: job.name, status: job.status, conclusion: job.conclusion, url: job.html_url })) }, null, 2) + '\n');
    if (run.status === 'completed') break;
    if (Date.now() > deadline) throw new Error('Build chưa hoàn tất sau 30 phút. Xem workflow được ghi trong outputs/ci/ios-build-run.json.');
    await delay(10_000);
    run = await api('/actions/runs/' + run.id);
  }
  if (run.conclusion !== 'success') throw new Error(`Build/Simulator chưa đạt (${run.conclusion}). ${run.html_url}`);
  const artifacts = (await api(`/actions/runs/${run.id}/artifacts?per_page=100`)).artifacts;
  const artifact = artifacts.find(item => item.name === 'HOAN-Admin-iPhone' && !item.expired);
  if (!artifact) throw new Error('Workflow chưa có artifact IPA hợp lệ.');
  const redirect = await fetch(apiRoot + `/actions/artifacts/${artifact.id}/zip`, { headers, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  const location = redirect.headers.get('location');
  if (redirect.status !== 302 || !location || new URL(location).protocol !== 'https:') throw new Error('GitHub chưa cung cấp liên kết tải artifact HTTPS.');
  // The signed storage URL is fetched without forwarding the GitHub credential.
  const download = await fetch(location, { signal: AbortSignal.timeout(60_000) });
  if (!download.ok) throw new Error('Không tải được artifact IPA: ' + download.status);
  const archive = new Uint8Array(await download.arrayBuffer());
  if (artifact.digest && artifact.digest !== 'sha256:' + hash(archive)) throw new Error('Checksum artifact GitHub không khớp.');
  const files = unzipSync(archive);
  const names = Object.keys(files).filter(name => /\.ipa$/i.test(name));
  if (names.length !== 1) throw new Error('Artifact phải có đúng một IPA mới.');
  const name = names[0];
  if (basename(name) !== name || name.includes('\\')) throw new Error('Đường dẫn IPA trong artifact không hợp lệ.');
  const metadataName = name.replace(/\.ipa$/i, '.json');
  if (!files[metadataName]) throw new Error('Thiếu manifest phiên bản từ Xcode.');
  const metadata = JSON.parse(Buffer.from(files[metadataName]).toString('utf8'));
  const configuration = await readFile(resolve(root, 'ios/HoanAdmin.xcconfig'), 'utf8');
  const version = configuration.match(/^MARKETING_VERSION\s*=\s*(\S+)/m)?.[1];
  const build = configuration.match(/^CURRENT_PROJECT_VERSION\s*=\s*(\S+)/m)?.[1];
  if (metadata.sourceCommit !== commit || metadata.version !== version || metadata.build !== build || metadata.file !== name || metadata.sha256 !== hash(files[name])) throw new Error('IPA không khớp commit, phiên bản, build hoặc SHA-256 yêu cầu.');
  const payload = unzipSync(files[name], { filter: file => /^Payload\/HoanAdmin\.app\/(?:Info\.plist|HoanAdmin)$/.test(file.name) });
  const executable = payload['Payload/HoanAdmin.app/HoanAdmin'];
  if (!payload['Payload/HoanAdmin.app/Info.plist'] || !executable || !['cffaedfe','feedfacf','cafebabe','bebafeca'].includes(Buffer.from(executable.subarray(0, 4)).toString('hex'))) throw new Error('IPA thiếu app iPhone hoặc executable Mach-O.');
  const outputDirectory = resolve(root, 'IPA');
  await mkdir(outputDirectory, { recursive: true });
  const destination = resolve(outputDirectory, name);
  const previous = await exists(destination);
  if (previous && hash(previous) !== metadata.sha256) {
    const archiveDirectory = resolve(outputDirectory, 'archive');
    await mkdir(archiveDirectory, { recursive: true });
    const oldName = name.replace(/\.ipa$/i, `-${hash(previous).slice(0, 8)}-${Date.now()}.ipa`);
    await rename(destination, resolve(archiveDirectory, oldName));
    const oldMetadata = resolve(outputDirectory, metadataName);
    if (await exists(oldMetadata)) await rename(oldMetadata, resolve(archiveDirectory, oldName.replace(/\.ipa$/i, '.json')));
  }
  await writeFile(destination + '.tmp', files[name]);
  await rename(destination + '.tmp', destination);
  const result = { ...metadata, workflowRun: run.html_url, workflowRunId: run.id, artifactId: artifact.id };
  await writeFile(resolve(outputDirectory, metadataName), JSON.stringify(result, null, 2) + '\n');
  await writeFile(resolve(outputDirectory, 'LATEST.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`IPA verified: ${destination}`);
  console.log(`Version ${version} build ${build}; SHA-256 ${metadata.sha256}; signing ${metadata.signing}.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
