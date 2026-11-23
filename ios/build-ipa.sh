#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]] || ! command -v xcodebuild >/dev/null; then
  echo "Cần macOS và Xcode để build IPA." >&2
  exit 1
fi

ios_root="$(cd "$(dirname "$0")" && pwd)"
default_output="$ios_root/../outputs/hoan-admin-app/ios/HOAN-Admin-iPhone.ipa"
output="${1:-$default_output}"
mkdir -p "$(dirname "$output")"
output_dir="$(cd "$(dirname "$output")" && pwd)"
output="$output_dir/$(basename "$output")"
build_dir="$(mktemp -d "$output_dir/.hoan-build.XXXXXXXX")"
trap 'rm -rf -- "$build_dir"' EXIT

build_args=(
  -project "$ios_root/HoanAdmin.xcodeproj" -scheme HoanAdmin
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS'
  -derivedDataPath "$build_dir/DerivedData" CODE_SIGNING_ALLOWED=NO
)
if [[ -n "${HOAN_ADMIN_ORIGIN:-}" ]]; then
  if [[ ! "$HOAN_ADMIN_ORIGIN" =~ ^https://[[:alnum:].-]+(:[0-9]+)?/?$ ]]; then
    echo "HOAN_ADMIN_ORIGIN phải là địa chỉ HTTPS gốc của máy chủ." >&2
    exit 1
  fi
  build_args+=("HOAN_ADMIN_ORIGIN=$HOAN_ADMIN_ORIGIN")
fi

xcodebuild "${build_args[@]}" build

app="$build_dir/DerivedData/Build/Products/Release-iphoneos/HoanAdmin.app"
plist="$app/Info.plist"
executable="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$plist")"
[[ -f "$app/$executable" ]]
[[ "$(/usr/libexec/PlistBuddy -c 'Print :DTPlatformName' "$plist")" == iphoneos ]]
[[ "$(/usr/libexec/PlistBuddy -c 'Print :HoanAdminOrigin' "$plist")" == https://* ]]
xcrun lipo -verify_arch arm64 "$app/$executable"

mkdir "$build_dir/Payload"
staged_app="$build_dir/Payload/HoanAdmin.app"
ditto "$app" "$staged_app"
codesign --force --sign - --timestamp=none "$staged_app"
codesign --verify --strict "$staged_app"
(cd "$build_dir" && /usr/bin/zip -qry "$build_dir/HOAN-Admin-iPhone.ipa" Payload)
mv -f "$build_dir/HOAN-Admin-iPhone.ipa" "$output"
printf 'IPA đã sẵn sàng để ký và cài thử tại %s\n' "$output"
