"""Import an authorized Apple signing identity for one ephemeral macOS CI job."""
import argparse
import base64
import binascii
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import signal
import subprocess
import sys

from ios_signing import SigningError, profile_config, read_profile, require

SECRET_NAMES = ('IOS_CERTIFICATE_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROVISIONING_PROFILE_BASE64')


def signing_inputs():
    missing = [name for name in SECRET_NAMES if not os.environ.get(name)]
    require(not missing, 'Missing GitHub Secrets: ' + ', '.join(missing))
    decoded = []
    for name in (SECRET_NAMES[0], SECRET_NAMES[2]):
        try:
            value = base64.b64decode(''.join(os.environ[name].split()), validate=True)
        except (ValueError, binascii.Error):
            raise SigningError('Invalid Base64 in ' + name) from None
        require(0 < len(value) <= 1_000_000, 'Invalid file size in ' + name)
        decoded.append(value)
    return decoded[0], os.environ[SECRET_NAMES[1]], decoded[1]


def run(command, label, *, inherit=False, env=None):
    # Never let CalledProcessError print a command that contains a password.
    clean_env = {key: value for key, value in (env or os.environ).items() if key not in SECRET_NAMES}
    try:
        result = subprocess.run(command, stdout=None if inherit else subprocess.PIPE,
                                stderr=None if inherit else subprocess.DEVNULL, env=clean_env)
    except OSError:
        raise SigningError(label + ' could not start') from None
    require(result.returncode == 0, label + ' failed')
    return result.stdout or b''


def signing_root():
    value = os.environ.get('RUNNER_TEMP', '')
    require(value and Path(value).is_absolute(), 'RUNNER_TEMP must be an absolute CI directory')
    return Path(value).resolve() / 'hoan-ios-signing'


def profile_directory():
    return Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles'


def private_write(path, data):
    with path.open('xb') as stream:
        os.chmod(path, 0o600)
        stream.write(data)


def save_state(root, state):
    path = root / 'state.json'
    candidate = root / 'state.json.tmp'
    candidate.write_text(json.dumps(state), encoding='utf-8')
    os.chmod(candidate, 0o600)
    os.replace(candidate, path)


def cleanup_signing(state=None):
    root = signing_root()
    state_file = root / 'state.json'
    if state is None and not state_file.is_file():
        return
    state = state if state is not None else json.loads(state_file.read_text(encoding='utf-8'))
    keychain = root / 'signing.keychain-db'
    require(state.get('keychain') == str(keychain), 'Refusing cleanup of an unrelated keychain')
    profile = state.get('ownedProfile')
    if profile:
        profile = Path(profile)
        require(profile.parent.resolve() == profile_directory().resolve()
                and re.fullmatch(r'[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}\.mobileprovision', profile.name),
                'Refusing cleanup of an unrelated profile')
    errors = []
    try:
        search_list = state.get('searchList')
        if search_list is not None:
            require(isinstance(search_list, list) and all(isinstance(p, str) for p in search_list), 'Invalid keychain search list state')
            run(['security', 'list-keychains', '-d', 'user', '-s', *search_list], 'Restore keychain search list')
    except SigningError as error:
        errors.append(str(error))
    try:
        if keychain.exists():
            run(['security', 'delete-keychain', str(keychain)], 'Remove temporary keychain')
    except SigningError as error:
        errors.append(str(error))
    if profile:
        profile.unlink(missing_ok=True)
    for name in ('certificate.p12', 'profile.mobileprovision', 'state.json.tmp'):
        (root / name).unlink(missing_ok=True)
    if not errors:
        state_file.unlink()
        root.rmdir()
    require(not errors, '; '.join(errors))


def build_signed():
    certificate, password, profile_bytes = signing_inputs()
    require(sys.platform == 'darwin', 'The signed build needs a macOS GitHub runner')
    root = signing_root()
    if root.exists():
        cleanup_signing()
    root.mkdir(mode=0o700)
    keychain = root / 'signing.keychain-db'
    state = {'keychain': str(keychain), 'ownedProfile': None, 'searchList': None}
    save_state(root, state)
    keychain_password = secrets.token_urlsafe(32)
    try:
        private_write(root / 'certificate.p12', certificate)
        private_write(root / 'profile.mobileprovision', profile_bytes)
        state['searchList'] = shlex.split(run(['security', 'list-keychains', '-d', 'user'], 'Read keychain search list').decode())
        save_state(root, state)
        run(['security', 'create-keychain', '-p', keychain_password, str(keychain)], 'Create temporary keychain')
        run(['security', 'set-keychain-settings', '-lut', '21600', str(keychain)], 'Set temporary keychain lifetime')
        run(['security', 'unlock-keychain', '-p', keychain_password, str(keychain)], 'Unlock temporary keychain')
        run(['security', 'import', str(root / 'certificate.p12'), '-P', password, '-t', 'cert', '-f', 'pkcs12',
             '-k', str(keychain), '-T', '/usr/bin/codesign', '-T', '/usr/bin/security'], 'Import p12 (check certificate and password)')
        run(['security', 'set-key-partition-list', '-S', 'apple-tool:,apple:', '-k', keychain_password, str(keychain)], 'Authorize signing tools')
        run(['security', 'list-keychains', '-d', 'user', '-s', str(keychain), *state['searchList']], 'Select temporary signing keychain')
        identities = run(['security', 'find-identity', '-v', '-p', 'codesigning', str(keychain)], 'Read valid signing identities').decode()
        fingerprints = set(re.findall(r'\b[A-Fa-f0-9]{40}\b', identities))
        bundle_id = os.environ.get('HOAN_APP_BUNDLE_ID', 'vn.hoanmakeup.admin')
        environment = os.environ.get('HOAN_APNS_ENVIRONMENT', 'production')
        config = profile_config(read_profile(root / 'profile.mobileprovision'), bundle_id, environment, fingerprints)
        directory = profile_directory()
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / (config['uuid'] + '.mobileprovision')
        require(not target.exists(), 'The runner already has this profile; refusing to overwrite it')
        with target.open('xb') as stream:
            state['ownedProfile'] = str(target)
            save_state(root, state)
            os.chmod(target, 0o600)
            stream.write(profile_bytes)
        build_env = {**os.environ, 'HOAN_DEVELOPMENT_TEAM': config['teamId'], 'HOAN_APP_BUNDLE_ID': bundle_id,
                     'HOAN_APNS_ENVIRONMENT': environment, 'HOAN_PROVISIONING_PROFILE_UUID': config['uuid'],
                     'HOAN_SIGNING_CERTIFICATE_SHA1': config['certificateSha1'], 'HOAN_EXPORT_METHOD': config['exportMethod']}
        print('Apple profile metadata and signing identity match; starting manual export.', flush=True)
        script = Path(__file__).resolve().with_name('export-signed-ipa.sh')
        run(['bash', str(script)], 'Signed IPA export', inherit=True, env=build_env)
    finally:
        cleanup_signing(state)


def main():
    parser = argparse.ArgumentParser(description='Build HOAN with an authorized Apple p12 and device profile.')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--check-secrets', action='store_true')
    group.add_argument('--cleanup', action='store_true')
    args = parser.parse_args()
    if args.check_secrets:
        signing_inputs()
        print('Signing inputs are present and Base64-decodable; Apple verification has not run.')
    elif args.cleanup:
        cleanup_signing()
    else:
        def interrupted(signum, frame):
            raise SystemExit(128 + signum)
        signal.signal(signal.SIGTERM, interrupted)
        build_signed()


if __name__ == '__main__':
    try:
        main()
    except (SigningError, OSError, ValueError) as error:
        # SigningError messages contain labels only, never commands or secret values.
        print(str(error) if isinstance(error, SigningError) else 'Signing setup or cleanup failed; no verified IPA was published by this step.', file=sys.stderr)
        sys.exit(1)
