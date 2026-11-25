import importlib.util
import json
from pathlib import Path
import plistlib
import struct
import tempfile
import unittest
import zipfile

MODULE = Path(__file__).resolve().parents[1] / 'ios' / 'ipa_bundle.py'
spec = importlib.util.spec_from_file_location('ipa_bundle', MODULE)
tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tools)
COMMIT = 'a' * 40


def binary(platform=2, dependency=None, weak=False):
    commands = [struct.pack('<6I', 0x32, 24, platform, 0x100000, 0x120500, 0)]
    if dependency:
        name = dependency.encode() + b'\0'
        size = (24 + len(name) + 7) // 8 * 8
        commands.append(struct.pack('<6I', 0x80000018 if weak else 0xC, size, 24, 0, 0, 0) + name + bytes(size - 24 - len(name)))
    return struct.pack('<8I', 0xFEEDFACF, 0x100000C, 0, 2, len(commands), sum(map(len, commands)), 0, 0) + b''.join(commands)


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.app = self.root / 'HoanAdmin.app'
        self.app.mkdir()
        self.info = {
            'CFBundleIdentifier': 'vn.hoanmakeup.admin', 'CFBundleExecutable': 'HoanAdmin',
            'CFBundleName': 'HoanAdmin', 'CFBundlePackageType': 'APPL',
            'CFBundleShortVersionString': '1.3', 'CFBundleVersion': '4',
            'MinimumOSVersion': '16.0', 'UIDeviceFamily': [1],
            'DTPlatformName': 'iphoneos', 'CFBundleSupportedPlatforms': ['iPhoneOS'],
            'DTSDKName': 'iphoneos18.5', 'HoanAdminOrigin': 'https://hoan.example.test',
            'HoanBuildCommit': COMMIT, 'HoanPushEnvironment': 'production',
        }
        self.save_info()
        (self.app / 'HoanAdmin').write_bytes(binary())

    def save_info(self):
        (self.app / 'Info.plist').write_bytes(plistlib.dumps(self.info))

    def package(self):
        ipa = self.root / 'staged.ipa'
        with zipfile.ZipFile(ipa, 'w') as target:
            for source in self.app.rglob('*'):
                if source.is_file():
                    target.write(source, 'Payload/' + self.app.name + '/' + source.relative_to(self.app).as_posix())
        return ipa

    def test_accepts_actual_device_bundle_and_archive(self):
        info = tools.validate_app(self.app, COMMIT)
        self.assertEqual(info['CFBundleVersion'], '4')
        result = tools.build_manifest(self.package(), self.app, COMMIT, 'ad-hoc')
        self.assertFalse(result['apnsEntitlementVerified'])
        self.assertEqual(result['sourceCommit'], COMMIT)
        self.assertEqual(len(result['sha256']), 64)

    def test_rejects_every_missing_required_key(self):
        for key in tools.REQUIRED_KEYS:
            with self.subTest(key=key):
                value = self.info.pop(key)
                self.save_info()
                with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)
                self.info[key] = value
        self.save_info()

    def test_rejects_unexpanded_xcode_setting(self):
        self.info['CFBundleIdentifier'] = '$(PRODUCT_BUNDLE_IDENTIFIER)'
        self.save_info()
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_rejects_executable_outside_bundle(self):
        self.info['CFBundleExecutable'] = '../HoanAdmin'
        self.save_info()
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_rejects_missing_executable(self):
        (self.app / 'HoanAdmin').unlink()
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_rejects_simulator_even_when_it_is_arm64(self):
        (self.app / 'HoanAdmin').write_bytes(binary(platform=7))
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_rejects_wrong_plist_platform_and_no_iphone_family(self):
        for key, value in [('DTPlatformName', 'iphonesimulator'), ('UIDeviceFamily', [2])]:
            with self.subTest(key=key):
                original = self.info[key]
                self.info[key] = value
                self.save_info()
                with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)
                self.info[key] = original

    def test_rejects_truncated_or_non_macho_executable(self):
        for content in [b'not an iPhone executable', binary()[:40]]:
            (self.app / 'HoanAdmin').write_bytes(content)
            with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_requires_strong_embedded_dependency(self):
        (self.app / 'HoanAdmin').write_bytes(binary(dependency='@rpath/Example.framework/Example'))
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)
        framework = self.app / 'Frameworks/Example.framework'
        framework.mkdir(parents=True)
        (framework / 'Example').write_bytes(b'fixture framework')
        tools.validate_app(self.app, COMMIT)

    def test_accepts_system_and_optional_swift_dependencies(self):
        for dependency, weak in [('/usr/lib/swift/libswiftWebKit.dylib', False), ('/System/Library/Frameworks/UIKit.framework/UIKit', False), ('@rpath/libswift_Concurrency.dylib', True)]:
            (self.app / 'HoanAdmin').write_bytes(binary(dependency=dependency, weak=weak))
            tools.validate_app(self.app, COMMIT)

    def test_rejects_old_commit_or_old_archive(self):
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, 'b' * 40)
        ipa = self.package()
        self.info['CFBundleVersion'] = '5'
        self.save_info()
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')

    def test_archive_must_include_current_resources_and_embedded_libraries(self):
        (self.app / 'Assets.car').write_bytes(b'current resources')
        ipa = self.package()
        (self.app / 'Assets.car').write_bytes(b'new resources')
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')
        ipa = self.package()
        (self.app / 'Frameworks').mkdir()
        (self.app / 'Frameworks/Example.dylib').write_bytes(b'new library')
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')

    def test_allows_apple_export_support_files_but_not_an_extra_app(self):
        ipa = self.package()
        with zipfile.ZipFile(ipa, 'a') as target:
            target.writestr('SwiftSupport/iphoneos/libswiftExample.dylib', b'Apple export fixture')
        tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')
        with zipfile.ZipFile(ipa, 'a') as target:
            target.writestr('Payload/Other.app/Info.plist', b'unexpected app')
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')

    def test_rejects_archive_path_traversal(self):
        ipa = self.package()
        with zipfile.ZipFile(ipa, 'a') as target:
            target.writestr('Payload/../outside.txt', b'must not be published')
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'ad-hoc')

    def test_rejects_unsafe_admin_origin(self):
        for origin in ['http://example.test', 'https://user:secret@example.test', 'https://example.test/path', 'https://example.test:99999', 'https://example.test:0']:
            self.info['HoanAdminOrigin'] = origin
            self.save_info()
            with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_accepts_fat_arm64_and_rejects_invalid_slice_bounds(self):
        thin = binary()
        header = struct.pack('>II5I', 0xCAFEBABE, 1, 0x100000C, 0, 28, len(thin), 0)
        (self.app / 'HoanAdmin').write_bytes(header + thin)
        tools.validate_app(self.app, COMMIT)
        (self.app / 'HoanAdmin').write_bytes(header + thin[:8])
        with self.assertRaises(tools.BundleError): tools.validate_app(self.app, COMMIT)

    def test_invalid_package_preserves_existing_ipa_and_manifest(self):
        destination = self.root / 'IPA/HOAN.ipa'
        destination.parent.mkdir()
        destination.write_bytes(b'previous complete IPA')
        destination.with_suffix('.json').write_text('previous manifest')
        invalid = self.root / 'invalid.ipa'
        invalid.write_bytes(b'incomplete ZIP')
        with self.assertRaises(tools.BundleError): tools.publish_ipa(invalid, self.app, COMMIT, 'ad-hoc', destination)
        self.assertEqual(destination.read_bytes(), b'previous complete IPA')
        self.assertEqual(destination.with_suffix('.json').read_text(), 'previous manifest')

    def test_publish_uses_final_filename_and_verified_hash(self):
        destination = self.root / 'IPA/HOAN-1.3-build4.ipa'
        result = tools.publish_ipa(self.package(), self.app, COMMIT, 'ad-hoc', destination)
        self.assertEqual(result['file'], destination.name)
        self.assertEqual(json.loads(destination.with_suffix('.json').read_text())['sha256'], result['sha256'])
        self.assertTrue(zipfile.is_zipfile(destination))

    def test_signed_label_requires_matching_apns_entitlements(self):
        ipa = self.package()
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'signed')
        entitlements = {'aps-environment': 'development', 'com.apple.developer.team-identifier': 'TEAMID0000'}
        with self.assertRaises(tools.BundleError): tools.build_manifest(ipa, self.app, COMMIT, 'signed', entitlements=entitlements)
        entitlements['aps-environment'] = 'production'
        self.assertTrue(tools.build_manifest(ipa, self.app, COMMIT, 'signed', entitlements=entitlements)['apnsEntitlementVerified'])

    def test_preflight_finds_swift_file_not_in_sources(self):
        ios = self.root / 'ios'
        (ios / 'HoanAdmin').mkdir(parents=True)
        (ios / 'HoanAdmin.xcodeproj').mkdir()
        (ios / 'HoanAdmin/Example.swift').write_text('struct Example {}')
        project = ios / 'HoanAdmin.xcodeproj/project.pbxproj'
        definition = '''
AAAAAAAAAAAAAAAAAAAAAAAA = {isa = PBXNativeTarget; name = HoanAdmin; buildPhases = (BBBBBBBBBBBBBBBBBBBBBBBB); };
BBBBBBBBBBBBBBBBBBBBBBBB = {isa = PBXSourcesBuildPhase; files = (SOURCES); };
CCCCCCCCCCCCCCCCCCCCCCCC = {isa = PBXBuildFile; fileRef = DDDDDDDDDDDDDDDDDDDDDDDD; };
DDDDDDDDDDDDDDDDDDDDDDDD = {isa = PBXFileReference; path = HoanAdmin/Example.swift; sourceTree = SOURCE_ROOT; };
'''
        project.write_text(definition.replace('SOURCES', ''))
        with self.assertRaises(tools.BundleError): tools.validate_project_sources(ios)
        project.write_text(definition.replace('SOURCES', 'CCCCCCCCCCCCCCCCCCCCCCCC'))
        self.assertEqual(tools.validate_project_sources(ios)['swiftFiles'], 1)
        (ios / 'HoanAdmin/Subfolder').mkdir()
        (ios / 'HoanAdmin/Subfolder/Example.swift').write_text('struct Other {}')
        with self.assertRaises(tools.BundleError): tools.validate_project_sources(ios)


if __name__ == '__main__':
    unittest.main()
