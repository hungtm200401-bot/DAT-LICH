#!/usr/bin/env python3
"""Record the actual Xcode app version and IPA hash next to the build output."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import plistlib
import sys

ipa, app, commit, signing = sys.argv[1:]
ipa = Path(ipa)
with (Path(app) / "Info.plist").open("rb") as source:
    info = plistlib.load(source)
if info.get("HoanBuildCommit") != commit:
    raise SystemExit("App source commit does not match the build request")
digest = hashlib.sha256()
with ipa.open("rb") as source:
    for block in iter(lambda: source.read(1024 * 1024), b""):
        digest.update(block)
manifest = {
    "file": ipa.name,
    "version": info["CFBundleShortVersionString"],
    "build": str(info["CFBundleVersion"]),
    "bundleId": info["CFBundleIdentifier"],
    "origin": info["HoanAdminOrigin"],
    "sourceCommit": commit,
    "signing": signing,
    "apnsEnvironment": info.get("HoanPushEnvironment"),
    "apnsEntitlementVerified": signing == "signed",
    "minimumOSVersion": info.get("MinimumOSVersion"),
    "sdk": info.get("DTSDKName"),
    "bytes": ipa.stat().st_size,
    "sha256": digest.hexdigest(),
    "builtAt": datetime.now(timezone.utc).isoformat(),
}
target = ipa.with_suffix(".json")
temporary = target.with_suffix(".json.tmp")
temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
temporary.replace(target)
print(f"Build manifest: {target}")
