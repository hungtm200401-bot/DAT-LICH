#!/usr/bin/env python3
"""Record the actual Xcode app version and IPA hash next to the build output."""
import argparse
import json
from pathlib import Path
import plistlib
from ipa_bundle import BundleError, build_manifest, publish_ipa

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('ipa', type=Path)
parser.add_argument('app', type=Path)
parser.add_argument('commit')
parser.add_argument('signing', choices=['ad-hoc', 'signed'])
parser.add_argument('--publish', type=Path, help='Validate before replacing the final IPA.')
parser.add_argument('--entitlements', type=Path, help='Entitlements from the verified Apple signature.')
args = parser.parse_args()
try:
    rights = plistlib.loads(args.entitlements.read_bytes()) if args.entitlements else None
    if args.publish:
        manifest = publish_ipa(args.ipa, args.app, args.commit, args.signing, args.publish, entitlements=rights)
        target = args.publish.with_suffix('.json')
    else:
        manifest = build_manifest(args.ipa, args.app, args.commit, args.signing, entitlements=rights)
        target = args.ipa.with_suffix('.json')
        temporary = target.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        temporary.replace(target)
    print(f'Build manifest: {target}')
except BundleError as error:
    raise SystemExit(str(error))
