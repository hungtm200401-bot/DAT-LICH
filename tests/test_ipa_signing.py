import copy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'ios'))
from ios_signing import SigningError, export_options, profile_config, validate_export

NOW = datetime(2026, 11, 25, tzinfo=timezone.utc)
CERT = b'fixture certificate; not an Apple identity'
FINGERPRINT = hashlib.sha1(CERT).hexdigest().upper()
BUNDLE = 'vn.hoanmakeup.admin'
TEAM = 'TEAM123456'
UUID = '12345678-1234-1234-1234-123456789ABC'


def profile():
    return {
        'UUID': UUID, 'TeamIdentifier': [TEAM], 'ApplicationIdentifierPrefix': ['LEGACY1234'],
        'ExpirationDate': (NOW + timedelta(days=30)).replace(tzinfo=None),
        'ProvisionedDevices': ['fixture-device'], 'DeveloperCertificates': [CERT],
        'Entitlements': {'application-identifier': 'LEGACY1234.' + BUNDLE,
                         'com.apple.developer.team-identifier': TEAM,
                         'aps-environment': 'production', 'get-task-allow': False},
    }


class ProfileTests(unittest.TestCase):
    def check(self, value=None, **options):
        return profile_config(value or profile(), BUNDLE, options.get('environment', 'production'),
                              options.get('identities', {FINGERPRINT}), now=NOW)

    def test_legacy_prefix_is_independent_of_team(self):
        result = self.check()
        self.assertEqual(result['teamId'], TEAM)
        self.assertEqual(result['appId'], 'LEGACY1234.' + BUNDLE)
        self.assertEqual(result['exportMethod'], 'release-testing')

    def test_development_profile(self):
        value = profile()
        value['Entitlements'].update({'aps-environment': 'development', 'get-task-allow': True})
        self.assertEqual(self.check(value, environment='development')['exportMethod'], 'debugging')

    def test_missing_and_malformed_profile_fields(self):
        for key in profile():
            with self.subTest(key=key):
                value = profile()
                del value[key]
                with self.assertRaises(SigningError):
                    self.check(value)
        for value in (None, [], 'profile', {'Entitlements': None}):
            with self.assertRaises(SigningError):
                profile_config(value, BUNDLE, 'production', {FINGERPRINT}, now=NOW)

    def test_rejects_expired_profile_at_boundary(self):
        value = profile()
        value['ExpirationDate'] = NOW.replace(tzinfo=None)
        with self.assertRaises(SigningError): self.check(value)

    def test_rejects_wildcard_or_wrong_app(self):
        for app in ('LEGACY1234.*', 'LEGACY1234.other.app', 'WRONG12345.' + BUNDLE):
            value = profile()
            value['Entitlements']['application-identifier'] = app
            with self.assertRaises(SigningError): self.check(value)

    def test_rejects_team_mismatch(self):
        value = profile()
        value['Entitlements']['com.apple.developer.team-identifier'] = 'OTHER12345'
        with self.assertRaises(SigningError): self.check(value)

    def test_rejects_missing_or_wrong_apns(self):
        for environment in ('development', '', None, 'production\n'):
            value = profile()
            value['Entitlements']['aps-environment'] = environment
            with self.assertRaises(SigningError): self.check(value)

    def test_rejects_cert_without_matching_private_key_identity(self):
        with self.assertRaises(SigningError): self.check(identities={'F' * 40})
        value = profile()
        value['DeveloperCertificates'] = ['not bytes']
        with self.assertRaises(SigningError): self.check(value)

    def test_rejects_non_device_and_enterprise_profiles(self):
        for devices in ([], None, [''], 'device'):
            value = profile()
            value['ProvisionedDevices'] = devices
            with self.assertRaises(SigningError): self.check(value)
        value = profile()
        value['ProvisionsAllDevices'] = True
        with self.assertRaises(SigningError): self.check(value)

    def test_rejects_uuid_path_and_inconsistent_debug_right(self):
        for key, invalid in (('UUID', '../profile'), ('UUID', 'not-a-uuid')):
            value = profile()
            value[key] = invalid
            with self.assertRaises(SigningError): self.check(value)
        value = profile()
        value['Entitlements']['get-task-allow'] = True
        with self.assertRaises(SigningError): self.check(value)


class ExportTests(unittest.TestCase):
    def test_manual_export_maps_uuid_bundle_and_certificate(self):
        value = export_options('release-testing', TEAM, UUID, BUNDLE, FINGERPRINT)
        self.assertEqual(value['signingStyle'], 'manual')
        self.assertEqual(value['provisioningProfiles'], {BUNDLE: UUID})
        self.assertEqual(value['signingCertificate'], FINGERPRINT)

    def test_automatic_mac_export_is_preserved(self):
        self.assertEqual(export_options('debugging', TEAM)['signingStyle'], 'automatic')
        self.assertNotIn('provisioningProfiles', export_options('debugging', TEAM))

    def test_rejects_partial_or_injected_export_settings(self):
        for args in [('release-testing', TEAM, UUID, BUNDLE, ''),
                     ('release-testing', TEAM, '', BUNDLE, FINGERPRINT),
                     ('release-testing', TEAM, UUID, '../app', FINGERPRINT),
                     ('app-store-connect', TEAM, UUID, BUNDLE, FINGERPRINT),
                     ('invalid', TEAM), ('debugging', '<invalid>')]:
            with self.subTest(args=args), self.assertRaises(SigningError): export_options(*args)

    def test_embedded_profile_and_actual_signature_must_match(self):
        value = profile()
        entitlements = copy.deepcopy(value['Entitlements'])
        info = {'CFBundleIdentifier': BUNDLE, 'HoanPushEnvironment': 'production'}
        def verify(p=value, e=entitlements, i=info, signed=FINGERPRINT):
            return validate_export(p, e, i, UUID, TEAM, 'production', BUNDLE, FINGERPRINT, signed_identity=signed, now=NOW)
        self.assertTrue(verify()['profileVerified'])
        for key in ('application-identifier', 'aps-environment', 'com.apple.developer.team-identifier', 'get-task-allow'):
            altered = copy.deepcopy(entitlements)
            altered[key] = 'wrong'
            with self.subTest(key=key), self.assertRaises(SigningError): verify(e=altered)
        changed = copy.deepcopy(value)
        changed['UUID'] = 'AAAAAAAA-1234-1234-1234-123456789ABC'
        with self.assertRaises(SigningError): verify(p=changed)
        with self.assertRaises(SigningError): verify(signed='A' * 40)
        with self.assertRaises(SigningError): verify(i={'CFBundleIdentifier': 'other.app', 'HoanPushEnvironment': 'production'})


class SecretTests(unittest.TestCase):
    def test_missing_inputs_report_only_names(self):
        from ci_signed_build import signing_inputs
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(SigningError) as error:
            signing_inputs()
        self.assertIn('IOS_CERTIFICATE_BASE64', str(error.exception))
        self.assertIn('IOS_PROVISIONING_PROFILE_BASE64', str(error.exception))

    def test_bad_base64_does_not_echo_secret(self):
        from ci_signed_build import signing_inputs
        secret = 'private-do-not-log!'
        with patch.dict(os.environ, {'IOS_CERTIFICATE_BASE64': secret, 'IOS_CERTIFICATE_PASSWORD': 'password',
                                    'IOS_PROVISIONING_PROFILE_BASE64': secret}, clear=True), self.assertRaises(SigningError) as error:
            signing_inputs()
        self.assertNotIn(secret, str(error.exception))

    def test_command_failures_do_not_echo_password_or_output(self):
        import subprocess
        from ci_signed_build import run
        secret = 'do-not-print-this-password'
        with patch('ci_signed_build.subprocess.run', return_value=subprocess.CompletedProcess([], 1, secret.encode())), self.assertRaises(SigningError) as error:
            run(['security', 'import', '-P', secret], 'Import identity')
        self.assertEqual(str(error.exception), 'Import identity failed')

    def test_cleanup_only_removes_owned_profile(self):
        import ci_signed_build as ci
        with tempfile.TemporaryDirectory(prefix='hoan-signing-test-') as folder:
            base = Path(folder).resolve()
            root = base / 'hoan-ios-signing'
            profiles = base / 'profiles'
            root.mkdir()
            profiles.mkdir()
            owned = profiles / (UUID + '.mobileprovision')
            unrelated = profiles / 'owner.mobileprovision'
            owned.write_bytes(b'owned')
            unrelated.write_bytes(b'owner')
            (root / 'certificate.p12').write_bytes(b'fixture')
            state = {'keychain': str(root / 'signing.keychain-db'), 'ownedProfile': str(owned), 'searchList': ['original.keychain-db']}
            (root / 'state.json').write_text(json.dumps(state))
            with patch.dict(os.environ, {'RUNNER_TEMP': str(base)}), patch.object(ci, 'profile_directory', return_value=profiles), patch.object(ci, 'run', return_value=b'') as command:
                ci.cleanup_signing()
            self.assertFalse(root.exists())
            self.assertFalse(owned.exists())
            self.assertEqual(unrelated.read_bytes(), b'owner')
            command.assert_called_once_with(['security', 'list-keychains', '-d', 'user', '-s', 'original.keychain-db'], 'Restore keychain search list')

    def test_cleanup_refuses_unrelated_profile_path(self):
        import ci_signed_build as ci
        with tempfile.TemporaryDirectory(prefix='hoan-signing-test-') as folder:
            base = Path(folder).resolve()
            root = base / 'hoan-ios-signing'
            root.mkdir()
            unrelated = base / (UUID + '.mobileprovision')
            unrelated.write_bytes(b'owner')
            (root / 'state.json').write_text(json.dumps({'keychain': str(root / 'signing.keychain-db'), 'ownedProfile': str(unrelated)}))
            with patch.dict(os.environ, {'RUNNER_TEMP': str(base)}), patch.object(ci, 'profile_directory', return_value=base / 'profiles'), self.assertRaises(SigningError):
                ci.cleanup_signing()
            self.assertEqual(unrelated.read_bytes(), b'owner')


@unittest.skipUnless(sys.platform == 'darwin', 'Needs real macOS security/keychain tools')
class MacKeychainTests(unittest.TestCase):
    def test_bad_p12_restores_search_list_and_removes_keychain(self):
        import base64
        import subprocess
        import ci_signed_build as ci
        original = subprocess.check_output(['security', 'list-keychains', '-d', 'user'])
        with tempfile.TemporaryDirectory(prefix='hoan-keychain-test-') as folder:
            fixture = base64.b64encode(b'invalid p12, intentionally not an Apple certificate').decode()
            environment = {'RUNNER_TEMP': str(Path(folder).resolve()), 'IOS_CERTIFICATE_BASE64': fixture,
                           'IOS_CERTIFICATE_PASSWORD': 'test-password', 'IOS_PROVISIONING_PROFILE_BASE64': fixture}
            with patch.dict(os.environ, environment), self.assertRaisesRegex(SigningError, 'Import p12'):
                ci.build_signed()
            self.assertFalse((Path(folder) / 'hoan-ios-signing').exists())
        self.assertEqual(subprocess.check_output(['security', 'list-keychains', '-d', 'user']), original)


if __name__ == '__main__':
    unittest.main()
