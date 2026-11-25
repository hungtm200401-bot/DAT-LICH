"""Metadata checks for HOAN's Apple-signed exports; no private keys are logged.

These checks complement Xcode/codesign, and do not replace Apple's verification.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import plistlib
import re
import subprocess


class SigningError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise SigningError(message)


def profile_config(profile, bundle_id, environment, identities, *, now=None):
    require(isinstance(profile, dict), 'Invalid provisioning profile')
    require(isinstance(bundle_id, str) and re.fullmatch(r'[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+', bundle_id), 'Invalid app bundle ID')
    require(environment in ('development', 'production'), 'Invalid APNs environment')
    uuid = profile.get('UUID', '')
    require(isinstance(uuid, str) and re.fullmatch(r'[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}', uuid), 'Invalid profile UUID')
    teams = profile.get('TeamIdentifier')
    require(isinstance(teams, list) and len(teams) == 1 and isinstance(teams[0], str) and re.fullmatch(r'[A-Z0-9]{10}', teams[0]), 'Invalid profile TeamIdentifier')
    team = teams[0]
    entitlement = profile.get('Entitlements')
    require(isinstance(entitlement, dict), 'Missing profile entitlements')
    require(entitlement.get('com.apple.developer.team-identifier') == team, 'Profile team identifiers do not match')
    prefixes = profile.get('ApplicationIdentifierPrefix')
    require(isinstance(prefixes, list) and prefixes and all(isinstance(p, str) and re.fullmatch(r'[A-Z0-9]{10}', p) for p in prefixes), 'Invalid App ID prefix')
    app_id = entitlement.get('application-identifier')
    require(app_id in [prefix + '.' + bundle_id for prefix in prefixes], 'Profile must authorize this exact bundle ID; wildcard profiles are not accepted')
    require(entitlement.get('aps-environment') == environment, 'Profile is missing Push Notifications or has a different APNs environment')
    debug = entitlement.get('get-task-allow', False)
    require(type(debug) is bool and debug == (environment == 'development'), 'Profile debug right and APNs environment do not match')
    expires = profile.get('ExpirationDate')
    require(isinstance(expires, datetime), 'Profile has no valid expiration date')
    expires = expires.replace(tzinfo=timezone.utc) if expires.tzinfo is None else expires.astimezone(timezone.utc)
    require(expires > (now or datetime.now(timezone.utc)), 'Provisioning profile has expired')
    devices = profile.get('ProvisionedDevices')
    require(isinstance(devices, list) and devices and all(isinstance(d, str) and d.strip() for d in devices)
            and not profile.get('ProvisionsAllDevices'), 'Use a development or Ad Hoc profile with registered iPhone devices')
    certificates = profile.get('DeveloperCertificates')
    require(isinstance(certificates, list) and certificates and all(isinstance(c, bytes) and c for c in certificates), 'Profile has no valid developer certificates')
    authorized = {hashlib.sha1(c).hexdigest().upper() for c in certificates}
    matches = authorized.intersection(identity.upper() for identity in identities)
    require(matches, 'No valid signing identity/private key matches the profile certificate')
    return {'uuid': uuid.upper(), 'teamId': team, 'appId': app_id, 'bundleId': bundle_id,
            'environment': environment, 'certificateSha1': sorted(matches)[0],
            'exportMethod': 'debugging' if debug else 'release-testing'}


def export_options(method, team, profile_uuid=None, bundle_id=None, identity=None):
    require(method in ('debugging', 'release-testing', 'app-store-connect'), 'Invalid export method')
    require(isinstance(team, str) and re.fullmatch(r'[A-Z0-9]{10}', team), 'Invalid export Team ID')
    options = {'method': method, 'teamID': team, 'signingStyle': 'automatic',
               'destination': 'export', 'manageAppVersionAndBuildNumber': False}
    if any((profile_uuid, bundle_id, identity)):
        require(method in ('debugging', 'release-testing'), 'Manual CI export requires a device profile')
        require(isinstance(profile_uuid, str) and re.fullmatch(r'[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}', profile_uuid), 'Manual export requires a profile UUID')
        require(isinstance(bundle_id, str) and re.fullmatch(r'[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+', bundle_id), 'Manual export requires an exact bundle ID')
        require(isinstance(identity, str) and re.fullmatch(r'[A-Fa-f0-9]{40}', identity), 'Manual export requires a certificate fingerprint')
        options.update(signingStyle='manual', signingCertificate=identity.upper(), provisioningProfiles={bundle_id: profile_uuid.upper()})
    return options


def validate_export(profile, entitlements, info, uuid, team, environment, bundle_id, identity, *, signed_identity, now=None):
    config = profile_config(profile, bundle_id, environment, {identity}, now=now)
    require(config['uuid'] == uuid.upper() and config['teamId'] == team, 'Exported profile UUID or Team differs from the requested profile')
    require(signed_identity.upper() == identity.upper(), 'The exported signature uses a different certificate')
    require(isinstance(entitlements, dict) and isinstance(info, dict), 'Invalid exported app metadata')
    require(entitlements.get('application-identifier') == config['appId'], 'Signed app identifier differs from profile')
    require(entitlements.get('com.apple.developer.team-identifier') == team, 'Signed app Team differs from profile')
    require(entitlements.get('aps-environment') == environment, 'Signed app is missing the expected APNs entitlement')
    require(entitlements.get('get-task-allow', False) is profile['Entitlements'].get('get-task-allow', False), 'Signed app debug right differs from profile')
    require(info.get('CFBundleIdentifier') == bundle_id and info.get('HoanPushEnvironment') == environment, 'Exported app bundle ID or APNs environment differs from the request')
    return {'profileVerified': True, 'bundleId': bundle_id, 'environment': environment}


def read_profile(path):
    result = subprocess.run(['security', 'cms', '-D', '-i', str(path)], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    require(result.returncode == 0, 'Could not decode the Apple provisioning profile')
    try:
        return plistlib.loads(result.stdout)
    except (ValueError, TypeError, plistlib.InvalidFileException):
        raise SigningError('Invalid provisioning profile data') from None


def main():
    parser = argparse.ArgumentParser(description='Validate Apple signing metadata without exposing private keys.')
    sub = parser.add_subparsers(dest='command', required=True)
    options = sub.add_parser('export-options')
    for name in ('path', 'method', 'team', 'uuid', 'bundle', 'identity'):
        options.add_argument(name)
    verify = sub.add_parser('verify-export')
    for name in ('app', 'entitlements', 'uuid', 'team', 'environment', 'bundle', 'identity', 'certificate'):
        verify.add_argument(name)
    args = parser.parse_args()
    if args.command == 'export-options':
        value = export_options(args.method, args.team, args.uuid or None, args.bundle or None, args.identity or None)
        with Path(args.path).open('wb') as stream:
            plistlib.dump(value, stream)
        return
    app = Path(args.app)
    entitlements = plistlib.loads(Path(args.entitlements).read_bytes())
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    result = validate_export(read_profile(app / 'embedded.mobileprovision'), entitlements, info,
                             args.uuid, args.team, args.environment, args.bundle, args.identity,
                             signed_identity=hashlib.sha1(Path(args.certificate).read_bytes()).hexdigest())
    print(json.dumps(result))


if __name__ == '__main__':
    try:
        main()
    except (SigningError, OSError, ValueError) as error:
        raise SystemExit(str(error))
