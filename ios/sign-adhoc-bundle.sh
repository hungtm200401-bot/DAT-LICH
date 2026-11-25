#!/usr/bin/env bash
set -euo pipefail

app="${1:?Pass the staged iPhone .app directory}"
[[ -d "$app" && "$app" == *.app ]]
signing_list="$(mktemp "${TMPDIR:-/tmp}/hoan-codesign.XXXXXXXX")"
trap 'rm -f -- "$signing_list"' EXIT

# Sign code children before their containing framework/extension, and the main app last.
# Only the ad-hoc path uses this; Apple-signed exports retain their Xcode signatures.
find "$app" -depth \( \( -type f -name '*.dylib' \) -o \( -type d \( -name '*.framework' -o -name '*.appex' \) \) \) -print0 > "$signing_list"
while IFS= read -r -d '' component; do
  codesign --force --sign - --timestamp=none "$component"
done < "$signing_list"
codesign --force --sign - --timestamp=none "$app"
codesign --verify --deep --strict "$app"
