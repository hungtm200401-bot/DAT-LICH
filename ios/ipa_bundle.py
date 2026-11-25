"""Portable HOAN bundle checks and verified publication, independent of Xcode APIs.

Packaging practices reviewed against Husk; see docs/IPA_BUILD.md for provenance.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import plistlib
import re
import shutil
import stat
import struct
import tempfile
from urllib.parse import urlsplit
import zipfile

REQUIRED_KEYS = (
    'CFBundleIdentifier', 'CFBundleExecutable', 'CFBundleName', 'CFBundlePackageType',
    'CFBundleVersion', 'CFBundleShortVersionString', 'MinimumOSVersion', 'UIDeviceFamily',
    'DTPlatformName', 'HoanAdminOrigin', 'HoanBuildCommit', 'HoanPushEnvironment',
)


class BundleError(ValueError):
    pass


def _sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def _require(condition, message):
    if not condition:
        raise BundleError(message)


def _macho(data):
    """Return load commands for the ARM64 slices; platform is checked by the caller."""
    if data[:4] in (b'\xca\xfe\xba\xbe', b'\xca\xfe\xba\xbf'):
        wide = data[3] == 0xBF
        count = struct.unpack_from('>I', data, 4)[0]
        width = 32 if wide else 20
        _require(0 < count <= 64 and 8 + count * width <= len(data), 'Invalid universal Mach-O header')
        slices = []
        for index in range(count):
            position = 8 + index * width
            cpu = struct.unpack_from('>I', data, position)[0]
            offset, size = struct.unpack_from('>QQ' if wide else '>II', data, position + 8)
            _require(offset >= 8 + count * width and size > 0 and offset + size <= len(data), 'Invalid universal Mach-O slice')
            if cpu == 0x100000C:
                slices.extend(_macho(data[offset:offset + size]))
        _require(slices, 'The executable has no ARM64 slice')
        return slices
    _require(len(data) >= 32 and data[:4] == b'\xcf\xfa\xed\xfe', 'Expected a 64-bit ARM64 Mach-O executable')
    _, cpu, _, filetype, count, size, _, _ = struct.unpack_from('<8I', data)
    _require(cpu == 0x100000C and filetype == 2, 'Expected an ARM64 iPhone application executable')
    _require(0 < count <= 4096 and 32 + size <= len(data), 'Truncated Mach-O load commands')
    position, end, platform, dependencies = 32, 32 + size, None, []
    for _ in range(count):
        _require(position + 8 <= end, 'Truncated Mach-O load command')
        command, length = struct.unpack_from('<II', data, position)
        _require(length >= 8 and position + length <= end, 'Invalid Mach-O load command size')
        if command == 0x32:  # LC_BUILD_VERSION; platform 2 is iOS, 7 is iOS Simulator.
            _require(length >= 24, 'Invalid LC_BUILD_VERSION')
            platform = struct.unpack_from('<I', data, position + 8)[0]
        elif command == 0x25 and platform is None:  # LC_VERSION_MIN_IPHONEOS in older device binaries.
            platform = 2
        elif command in (0xC, 0x80000018, 0x8000001F, 0x80000023):
            _require(length >= 24, 'Invalid dynamic library load command')
            offset = struct.unpack_from('<I', data, position + 8)[0]
            _require(24 <= offset < length, 'Invalid dynamic library name offset')
            name = data[position + offset:position + length].split(b'\0', 1)[0].decode('utf-8')
            dependencies.append((name, command == 0x80000018))
        position += length
    _require(position == end, 'Mach-O load command count does not match its size')
    return [(platform, dependencies)]


def validate_app(app, commit=None):
    app = Path(app).resolve()
    try:
        with (app / 'Info.plist').open('rb') as source:
            info = plistlib.load(source)
        for key in REQUIRED_KEYS:
            _require(info.get(key) not in (None, '', []), 'Missing Info.plist key: ' + key)
            _require(key == 'UIDeviceFamily' or isinstance(info[key], str), 'Expected a String Info.plist key: ' + key)
            _require('$(' not in str(info[key]), 'Unexpanded Xcode setting: ' + key)
        executable = info['CFBundleExecutable']
        _require(isinstance(executable, str) and executable not in ('.', '..') and '/' not in executable and '\\' not in executable, 'Invalid CFBundleExecutable')
        binary = app / executable
        _require(binary.is_file() and binary.resolve().is_relative_to(app), 'Executable is missing or outside the app bundle')
        _require(re.fullmatch(r'[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+', info['CFBundleIdentifier']), 'Invalid bundle identifier')
        _require(info['CFBundlePackageType'] == 'APPL', 'Expected an application bundle')
        _require(re.fullmatch(r'\d+(?:\.\d+){0,2}', str(info['CFBundleShortVersionString'])), 'Invalid application version')
        _require(re.fullmatch(r'\d+(?:\.\d+){0,2}', str(info['CFBundleVersion'])), 'Invalid application build')
        _require(re.fullmatch(r'\d+(?:\.\d+){0,2}', str(info['MinimumOSVersion'])), 'Invalid minimum iOS version')
        _require(isinstance(info['UIDeviceFamily'], list) and all(type(value) is int for value in info['UIDeviceFamily']) and 1 in info['UIDeviceFamily'], 'The bundle does not support iPhone')
        _require(info['DTPlatformName'] == 'iphoneos', 'Refusing to package a Simulator/non-iPhone bundle')
        origin = urlsplit(info['HoanAdminOrigin'])
        _require(origin.scheme == 'https' and origin.hostname and not origin.username and not origin.password and origin.path in ('', '/') and not origin.query and not origin.fragment, 'Expected an HTTPS admin origin')
        _require(not re.search(r'[\s\\]', info['HoanAdminOrigin']) and (origin.port is None or 1 <= origin.port <= 65535), 'Invalid admin origin host/port')
        _require(info['HoanPushEnvironment'] in ('development', 'production'), 'Invalid APNs environment metadata')
        _require(commit is None or info['HoanBuildCommit'] == commit, 'App source commit does not match the build request')
        for platform, dependencies in _macho(binary.read_bytes()):
            _require(platform == 2, 'ARM64 executable was not built for an iPhone device')
            for name, weak in dependencies:
                if weak or name.startswith(('/System/Library/', '/usr/lib/')):
                    continue
                # Swift back-deployment libraries may resolve from the OS runtime, not Frameworks.
                if name.startswith('@rpath/libswift'):
                    continue
                prefixes = {'@rpath/': app / 'Frameworks', '@executable_path/': app, '@loader_path/': app}
                location = next((root / name[len(prefix):] for prefix, root in prefixes.items() if name.startswith(prefix)), None)
                _require(location is not None and location.resolve().is_relative_to(app) and location.is_file(), 'Missing or external linked dependency: ' + name)
        for item in app.rglob('*'):
            if item.is_symlink():
                _require(item.exists() and item.resolve().is_relative_to(app), 'Broken or external bundle symlink: ' + str(item.relative_to(app)))
        return info
    except BundleError:
        raise
    except (OSError, ValueError, TypeError, struct.error, UnicodeError, plistlib.InvalidFileException) as error:
        raise BundleError('Invalid app bundle: ' + str(error)) from error


def validate_project_sources(ios):
    ios = Path(ios).resolve()
    source = (ios / 'HoanAdmin.xcodeproj/project.pbxproj').read_text(encoding='utf-8')
    objects = dict(re.findall(r'([A-Fa-f0-9]{24})(?:\s*/\*.*?\*/)?\s*=\s*\{(.*?)\};', source, re.S))
    def property_value(body, name):
        match = re.search(r'\b' + name + r'\s*=\s*("[^"]*"|[^;]+);', body)
        return match.group(1).strip().strip('"') if match else ''
    def ids(body, name):
        match = re.search(r'\b' + name + r'\s*=\s*\((.*?)\);', body, re.S)
        return re.findall(r'\b[A-Fa-f0-9]{24}\b', match.group(1)) if match else []
    targets = [body for body in objects.values() if property_value(body, 'isa') == 'PBXNativeTarget' and property_value(body, 'name') == 'HoanAdmin']
    _require(len(targets) == 1, 'Expected exactly one HoanAdmin Xcode target')
    parents = {child: key for key, body in objects.items() if property_value(body, 'isa') == 'PBXGroup' for child in ids(body, 'children')}
    def path_for(key, visited=frozenset()):
        _require(key not in visited and key in objects, 'Invalid/cyclic Xcode file reference')
        body = objects[key]
        tree = property_value(body, 'sourceTree')
        base = ios if tree == 'SOURCE_ROOT' or key not in parents else path_for(parents[key], visited | {key})
        return (base / property_value(body, 'path')).resolve()
    included = set()
    for phase in ids(targets[0], 'buildPhases'):
        body = objects.get(phase, '')
        if property_value(body, 'isa') != 'PBXSourcesBuildPhase':
            continue
        for build_file in ids(body, 'files'):
            value = property_value(objects.get(build_file, ''), 'fileRef').split()
            _require(value, 'Missing Xcode Sources file reference')
            reference = value[0]
            included.add(path_for(reference))
    files = set(path.resolve() for path in (ios / 'HoanAdmin').rglob('*.swift'))
    _require(files, 'No HoanAdmin Swift source files found')
    missing = files - included
    _require(not missing, 'Add Swift files to the HoanAdmin Sources target: ' + ', '.join(str(path.relative_to(ios)) for path in sorted(missing)))
    return {'target': 'HoanAdmin', 'swiftFiles': len(files), 'sourcesComplete': True}


def build_manifest(ipa, app, commit, signing, *, entitlements=None, filename=None):
    ipa, app = Path(ipa), Path(app)
    info = validate_app(app, commit)
    _require(signing in ('ad-hoc', 'signed'), 'Unknown signing type')
    if signing == 'signed':
        _require(entitlements and entitlements.get('aps-environment') == info['HoanPushEnvironment'] and re.fullmatch(r'[A-Z0-9]{10}', entitlements.get('com.apple.developer.team-identifier', '')), 'A signed APNs manifest needs the verified matching entitlements')
    try:
        with zipfile.ZipFile(ipa) as package:
            names = package.namelist()
            prefix = 'Payload/' + app.name + '/'
            _require(len(names) == len(set(names)), 'Duplicate entries in IPA')
            for name in names:
                path = PurePosixPath(name)
                _require(bool(path.parts), 'Empty IPA entry')
                _require(not path.is_absolute() and '..' not in path.parts and '\\' not in name, 'Unsafe IPA entry')
                _require(name == 'Payload/' or name.startswith(prefix) or path.parts[0] in ('SwiftSupport', 'Symbols', 'BCSymbolMaps') or name in ('iTunesMetadata.plist', 'iTunesArtwork', 'iTunesArtwork@2x'), 'Unexpected file outside the IPA application bundle')
            _require(package.testzip() is None, 'IPA ZIP checksum failed')
            expected = {prefix + file.relative_to(app).as_posix(): file for file in app.rglob('*') if file.is_file() or file.is_symlink()}
            _require(set(name for name in names if name.startswith(prefix) and not name.endswith('/')) == set(expected), 'IPA files do not match the staged app')
            for name, source in expected.items():
                entry = package.getinfo(name)
                symlink = stat.S_ISLNK(entry.external_attr >> 16)
                if source.is_symlink():
                    _require(symlink and package.read(name) == os.readlink(source).encode('utf-8'), 'IPA symlink does not match staged app: ' + name)
                else:
                    _require(not symlink, 'Unexpected IPA symlink: ' + name)
                    digest = hashlib.sha256()
                    with package.open(entry) as stream:
                        for block in iter(lambda: stream.read(1024 * 1024), b''):
                            digest.update(block)
                    _require(digest.hexdigest() == _sha256(source), 'IPA contains a different/old app file: ' + name)
    except (OSError, zipfile.BadZipFile, KeyError) as error:
        raise BundleError('Invalid IPA archive: ' + str(error)) from error
    digest = _sha256(ipa)
    return {
        'file': filename or ipa.name, 'version': info['CFBundleShortVersionString'], 'build': str(info['CFBundleVersion']),
        'bundleId': info['CFBundleIdentifier'], 'origin': info['HoanAdminOrigin'], 'sourceCommit': commit,
        'signing': signing, 'apnsEnvironment': info['HoanPushEnvironment'], 'apnsEntitlementVerified': signing == 'signed',
        'minimumOSVersion': info['MinimumOSVersion'], 'sdk': info.get('DTSDKName'),
        'bytes': ipa.stat().st_size, 'sha256': digest, 'builtAt': datetime.now(timezone.utc).isoformat(),
    }


def publish_ipa(ipa, app, commit, signing, destination, *, entitlements=None):
    destination = Path(destination).resolve()
    manifest = build_manifest(ipa, app, commit, signing, entitlements=entitlements, filename=destination.name)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Stage both complete files on the destination filesystem. The IPA rename is atomic;
    # consumers must still verify the JSON hash, since a pair of renames is not a transaction.
    with tempfile.TemporaryDirectory(prefix='.hoan-publish-', dir=destination.parent) as folder:
        candidate = Path(folder) / destination.name
        shutil.copyfile(ipa, candidate)
        metadata = candidate.with_suffix('.json')
        metadata.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        _require(_sha256(candidate) == manifest['sha256'], 'Staged IPA checksum changed')
        os.replace(candidate, destination)
        os.replace(metadata, destination.with_suffix('.json'))
    return manifest


def main():
    parser = argparse.ArgumentParser(description='Check HOAN iPhone sources or a built app bundle.')
    parser.add_argument('command', choices=['sources', 'validate'])
    parser.add_argument('path', type=Path)
    parser.add_argument('--commit')
    args = parser.parse_args()
    result = validate_project_sources(args.path) if args.command == 'sources' else validate_app(args.path, args.commit)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except BundleError as error:
        raise SystemExit(str(error))
