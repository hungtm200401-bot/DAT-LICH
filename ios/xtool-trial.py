"""Run a real, credential-free Xtool trial; never promote it to a Push release."""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

VERSION = '2.0.0-beta.1'
DIGEST = 'b8789e599abb43b42fe93529cbc90c9e3dd19f48bd600c7dad07f7f6a3a4aa6b'
DOWNLOAD = f'https://github.com/xtool-org/xtool/releases/download/{VERSION}/xtool.app.zip'
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'outputs' / 'xtool-trial'


def run(command, log, cwd=ROOT, timeout=600):
    # No Apple or repository secrets are passed to this diagnostic process.
    allowed = ('PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'DEVELOPER_DIR', 'SDKROOT',
               'SystemRoot', 'USER', 'LOGNAME', 'SHELL', 'CI')
    child_env = {key: os.environ[key] for key in allowed if key in os.environ}
    with log.open('w', encoding='utf-8') as stream:
        try:
            result = subprocess.run(command, cwd=cwd, env=child_env, stdout=stream,
                                    stderr=subprocess.STDOUT, timeout=timeout)
            code = result.returncode
        except subprocess.TimeoutExpired:
            stream.write('\nTrial command exceeded its time limit.\n')
            code = 124
    tail = log.read_text(encoding='utf-8', errors='replace')[-3500:]
    print(tail, flush=True)
    return code


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect_ipa(ipa, commit):
    with zipfile.ZipFile(ipa) as archive:
        info = plistlib.loads(archive.read('Payload/HoanAdmin.app/Info.plist'))
        expected = {
            'CFBundleIdentifier': 'vn.hoanmakeup.admin',
            'HoanAdminOrigin': 'https://hoan-makeup-artist.hoan-makeup.workers.dev',
            'HoanPushEnvironment': 'production',
            'HoanBuildCommit': commit,
        }
        for key, value in expected.items():
            if info.get(key) != value:
                raise RuntimeError('Xtool output changed expected app metadata: ' + key)
        profile_present = 'Payload/HoanAdmin.app/embedded.mobileprovision' in archive.namelist()
    return {
        'file': str(ipa.relative_to(OUTPUT)), 'bytes': ipa.stat().st_size,
        'sha256': fingerprint(ipa), 'bundleId': info['CFBundleIdentifier'],
        'origin': info['HoanAdminOrigin'], 'version': info['CFBundleShortVersionString'],
        'build': info['CFBundleVersion'], 'embeddedProfilePresent': profile_present,
        'apnsEntitlementVerified': False, 'deviceReceiptVerified': False,
        'classification': 'diagnostic-ad-hoc-not-an-Apple-Push-release',
    }


def trial(report):
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    report['sourceCommit'] = commit
    latest = ROOT / 'IPA' / 'LATEST.json'
    report['latestManifestBefore'] = fingerprint(latest) if latest.exists() else None
    run(['xcodebuild', '-version'], OUTPUT / 'xcode.log', timeout=30)
    run(['xcrun', '--sdk', 'iphoneos', '--show-sdk-path'], OUTPUT / 'sdk.log', timeout=30)
    run(['swift', '--version'], OUTPUT / 'swift.log', timeout=30)
    with tempfile.TemporaryDirectory(prefix='hoan-xtool-') as temporary:
        temp = Path(temporary)
        download = temp / 'xtool.zip'
        request = urllib.request.Request(DOWNLOAD, headers={'User-Agent': 'HOAN-Xtool-trial'})
        with urllib.request.urlopen(request, timeout=90) as response, download.open('wb') as target:
            shutil.copyfileobj(response, target)
        if fingerprint(download) != DIGEST:
            raise RuntimeError('Xtool download SHA-256 mismatch; refusing to execute')
        if run(['ditto', '-xk', str(download), str(temp)], OUTPUT / 'extract.log', timeout=60):
            raise RuntimeError('Could not extract verified Xtool release')
        binary = temp / 'xtool.app' / 'Contents' / 'Resources' / 'bin' / 'xtool'
        if not binary.is_file():
            raise RuntimeError('Published Xtool launcher is missing')
        report['install'] = 'verified'
        help_code = run([str(binary), 'dev', 'build', '--help'], OUTPUT / 'help.log', timeout=30)
        if help_code:
            raise RuntimeError('Xtool CLI could not start; see help.log')
        project = OUTPUT / 'project'
        if project.exists():
            raise RuntimeError('Trial project already exists; use a clean checkout for each attempt')
        shutil.copytree(ROOT / 'ios', project, ignore=shutil.ignore_patterns('__pycache__'))
        config = project / 'HoanAdmin.xcconfig'
        content = config.read_text(encoding='utf-8')
        if re.search(r'^HOAN_BUILD_COMMIT\s*=', content, re.M):
            content = re.sub(r'^HOAN_BUILD_COMMIT\s*=.*$', 'HOAN_BUILD_COMMIT = ' + commit, content, flags=re.M)
        else:
            content += '\nHOAN_BUILD_COMMIT = ' + commit + '\n'
        config.write_text(content, encoding='utf-8')
        command = [str(binary), 'dev', 'build', '--configuration', 'release', '--scheme', 'HoanAdmin', '--ipa']
        # Execute the real sign command. It should fail before building on a clean,
        # unauthenticated runner. Never treat that expected rejection as signed success.
        sign_code = run([*command, '--sign'], OUTPUT / 'sign.log', project, timeout=45)
        sign_log = (OUTPUT / 'sign.log').read_text(encoding='utf-8', errors='replace')
        missing_auth = sign_code != 0 and 'requires logging in' in sign_log
        report['signing'] = {'exitCode': sign_code, 'status': 'blocked-missing-auth' if missing_auth else 'unexpected-result'}
        if not missing_auth:
            raise RuntimeError('Unexpected signing result on a credential-free trial runner')
        build_code = run(command, OUTPUT / 'build.log', project, timeout=900)
        report['build'] = {'exitCode': build_code, 'status': 'success' if build_code == 0 else 'failed'}
        if build_code:
            raise RuntimeError('Xtool build failed; see build.log')
        ipas = list((project / 'xtool').rglob('HoanAdmin.ipa'))
        if len(ipas) != 1:
            raise RuntimeError('Expected exactly one Xtool HoanAdmin.ipa')
        # Only public diagnostic files are uploaded; no project caches/auth data.
        candidate = OUTPUT / 'HOAN-Xtool-DIAGNOSTIC-NO-PUSH.ipa'
        shutil.copy2(ipas[0], candidate)
        report['artifact'] = inspect_ipa(candidate, commit)
        if latest.exists() and fingerprint(latest) != report['latestManifestBefore']:
            raise RuntimeError('Existing IPA latest manifest changed')
        report['latestManifestUnchanged'] = True


def main():
    if sys.platform != 'darwin':
        print('Xtool trial requires macOS with Xcode; no system changes were made.', file=sys.stderr)
        return 1
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = {'schemaVersion': 1, 'tool': 'xtool', 'version': VERSION,
              'downloadSha256': DIGEST, 'install': 'pending', 'build': {'status': 'pending'},
              'signing': {'status': 'pending'}, 'pushReady': False, 'deviceReceiptVerified': False}
    try:
        trial(report)
    except Exception as error:
        report['error'] = str(error)
        print('Xtool trial:', str(error), file=sys.stderr)
    finally:
        (OUTPUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Push acceptance is NOT complete: authorized Apple signing and real iPhone receipt are still required.')
    return 2  # A diagnostic build is never a successful Push-ready release.


if __name__ == '__main__':
    sys.exit(main())
