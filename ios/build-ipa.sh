#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == --signed ]]; then
  exec bash "$(dirname "$0")/export-signed-ipa.sh"
fi

if [[ "$(uname -s)" != Darwin ]] || ! command -v xcodebuild >/dev/null; then
  echo "Cần macOS và Xcode để build IPA." >&2
  exit 1
fi

ios_root="$(cd "$(dirname "$0")" && pwd)"
source_commit="$(git -C "$ios_root/.." rev-parse HEAD 2>/dev/null || printf 'unknown')"
if [[ -n "$(git -C "$ios_root/.." status --porcelain 2>/dev/null || true)" ]]; then source_commit="$source_commit-dirty"; fi
version="$(awk '$1 == "MARKETING_VERSION" {gsub("\r", "", $3); print $3}' "$ios_root/HoanAdmin.xcconfig")"
build="$(awk '$1 == "CURRENT_PROJECT_VERSION" {gsub("\r", "", $3); print $3}' "$ios_root/HoanAdmin.xcconfig")"
[[ "$version" =~ ^[0-9]+(\.[0-9]+)*$ && "$build" =~ ^[0-9]+$ ]]
default_output="$ios_root/../IPA/HOAN-Admin-iPhone-$version-build$build.ipa"
output="${1:-$default_output}"
mkdir -p "$(dirname "$output")"
output_dir="$(cd "$(dirname "$output")" && pwd)"
output="$output_dir/$(basename "$output")"
build_dir="$(mktemp -d "$output_dir/.hoan-build.XXXXXXXX")"
trap 'rm -rf -- "$build_dir"' EXIT
log_dir="${HOAN_BUILD_LOG_DIR:-$ios_root/../outputs/hoan-admin-app/ios/build}"
mkdir -p "$log_dir"
python3 "$ios_root/ipa_bundle.py" sources "$ios_root" > "$log_dir/source-validation.json"
xcodebuild -version > "$log_dir/toolchain.txt"

build_args=(
  -project "$ios_root/HoanAdmin.xcodeproj" -scheme HoanAdmin
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS'
  -derivedDataPath "$build_dir/DerivedData" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=
  "HOAN_BUILD_COMMIT=$source_commit"
)
if [[ -n "${HOAN_ADMIN_ORIGIN:-}" ]]; then
  if [[ ! "$HOAN_ADMIN_ORIGIN" =~ ^https://[[:alnum:].-]+(:[0-9]+)?/?$ ]]; then
    echo "HOAN_ADMIN_ORIGIN phải là địa chỉ HTTPS gốc của máy chủ." >&2
    exit 1
  fi
  build_args+=("HOAN_ADMIN_ORIGIN=$HOAN_ADMIN_ORIGIN")
fi

xcodebuild "${build_args[@]}" build 2>&1 | tee "$log_dir/xcodebuild.log"

app="$build_dir/DerivedData/Build/Products/Release-iphoneos/HoanAdmin.app"
plist="$app/Info.plist"
executable="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$plist")"
[[ -f "$app/$executable" ]]
[[ "$(/usr/libexec/PlistBuddy -c 'Print :DTPlatformName' "$plist")" == iphoneos ]]
[[ "$(/usr/libexec/PlistBuddy -c 'Print :HoanAdminOrigin' "$plist")" == https://* ]]
xcrun lipo "$app/$executable" -verify_arch arm64
python3 "$ios_root/ipa_bundle.py" validate "$app" --commit "$source_commit" > "$log_dir/bundle-validation.json"

mkdir "$build_dir/Payload"
staged_app="$build_dir/Payload/HoanAdmin.app"
ditto "$app" "$staged_app"
bash "$ios_root/sign-adhoc-bundle.sh" "$staged_app"
(cd "$build_dir" && /usr/bin/zip -qry "$build_dir/HOAN-Admin-iPhone.ipa" Payload)
python3 "$ios_root/write-build-manifest.py" "$build_dir/HOAN-Admin-iPhone.ipa" "$staged_app" "$source_commit" ad-hoc --publish "$output"
printf 'IPA đã sẵn sàng để ký và cài thử tại %s\n' "$output"
