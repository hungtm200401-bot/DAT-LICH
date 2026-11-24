#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]] || ! command -v xcodebuild >/dev/null; then
  echo 'Cần macOS và Xcode để xuất IPA có chữ ký Apple.' >&2
  exit 1
fi
: "${HOAN_DEVELOPMENT_TEAM:?Đặt HOAN_DEVELOPMENT_TEAM bằng Team ID có Push Notifications.}"
: "${HOAN_APNS_ENVIRONMENT:?Đặt HOAN_APNS_ENVIRONMENT=development hoặc production, khớp profile và máy chủ.}"
[[ "$HOAN_DEVELOPMENT_TEAM" =~ ^[A-Z0-9]{10}$ ]]
[[ "$HOAN_APNS_ENVIRONMENT" == development || "$HOAN_APNS_ENVIRONMENT" == production ]]
method="${HOAN_EXPORT_METHOD:-release-testing}"
[[ "$method" == debugging || "$method" == release-testing || "$method" == app-store-connect ]]
ios_root="$(cd "$(dirname "$0")" && pwd)"
source_commit="$(git -C "$ios_root/.." rev-parse HEAD 2>/dev/null || printf 'unknown')"
output_dir="$ios_root/../IPA"
mkdir -p "$output_dir"
build_dir="$(mktemp -d "$output_dir/.archive.XXXXXXXX")"
trap 'rm -rf -- "$build_dir"' EXIT

build_args=(
  -project "$ios_root/HoanAdmin.xcodeproj" -scheme HoanAdmin -configuration Release
  -destination 'generic/platform=iOS' -archivePath "$build_dir/HoanAdmin.xcarchive"
  -allowProvisioningUpdates "DEVELOPMENT_TEAM=$HOAN_DEVELOPMENT_TEAM"
  "HOAN_APNS_ENVIRONMENT=$HOAN_APNS_ENVIRONMENT" CODE_SIGNING_ALLOWED=YES
  "HOAN_BUILD_COMMIT=$source_commit"
)
if [[ -n "${HOAN_ADMIN_ORIGIN:-}" ]]; then
  [[ "$HOAN_ADMIN_ORIGIN" =~ ^https://[[:alnum:].-]+(:[0-9]+)?/?$ ]]
  build_args+=("HOAN_ADMIN_ORIGIN=$HOAN_ADMIN_ORIGIN")
fi
if [[ -n "${HOAN_APP_BUNDLE_ID:-}" ]]; then
  [[ "$HOAN_APP_BUNDLE_ID" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]]
  build_args+=("PRODUCT_BUNDLE_IDENTIFIER=$HOAN_APP_BUNDLE_ID")
fi
xcodebuild "${build_args[@]}" archive

cat > "$build_dir/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>$method</string>
<key>teamID</key><string>$HOAN_DEVELOPMENT_TEAM</string>
<key>signingStyle</key><string>automatic</string>
<key>destination</key><string>export</string>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
xcodebuild -exportArchive -archivePath "$build_dir/HoanAdmin.xcarchive" \
  -exportOptionsPlist "$build_dir/ExportOptions.plist" -exportPath "$build_dir/export" -allowProvisioningUpdates
ipa="$build_dir/export/HoanAdmin.ipa"
[[ -f "$ipa" ]]
mkdir "$build_dir/inspect"
ditto -xk "$ipa" "$build_dir/inspect"
app="$build_dir/inspect/Payload/HoanAdmin.app"
codesign --verify --deep --strict "$app"
codesign -d --entitlements :- "$app" > "$build_dir/entitlements.plist" 2>/dev/null
actual_environment="$(/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$build_dir/entitlements.plist")"
actual_team="$(/usr/libexec/PlistBuddy -c 'Print :com.apple.developer.team-identifier' "$build_dir/entitlements.plist")"
actual_origin="$(/usr/libexec/PlistBuddy -c 'Print :HoanPushEnvironment' "$app/Info.plist")"
version="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$app/Info.plist")"
build="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$app/Info.plist")"
[[ "$version" =~ ^[0-9]+(\.[0-9]+)*$ && "$build" =~ ^[0-9]+$ ]]
if [[ "$actual_environment" != "$HOAN_APNS_ENVIRONMENT" || "$actual_origin" != "$actual_environment" || "$actual_team" != "$HOAN_DEVELOPMENT_TEAM" ]]; then
  echo 'Chữ ký, môi trường APNs và cấu hình app chưa khớp; không xuất bản IPA này.' >&2
  exit 1
fi
signed_output="$output_dir/HOAN-Admin-iPhone-$version-build$build-$actual_environment-signed.ipa"
cp "$ipa" "$signed_output"
python3 "$ios_root/write-build-manifest.py" "$signed_output" "$app" "$source_commit" signed
printf 'IPA có quyền APNs (%s): %s\n' "$actual_environment" "$signed_output"
