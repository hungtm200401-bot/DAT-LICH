#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]] || ! command -v xcrun >/dev/null; then
  echo 'Cần macOS, Xcode và iOS Simulator.' >&2
  exit 1
fi

ios_root="$(cd "$(dirname "$0")" && pwd)"
output="${1:-$ios_root/../outputs/hoan-admin-app/ios/simulator}"
profile_filter="${2:-all}"
if [[ "$profile_filter" != all && "$profile_filter" != compact && "$profile_filter" != large ]]; then
  echo 'Chọn compact, large hoặc all.' >&2
  exit 1
fi
mkdir -p "$output"
output="$(cd "$output" && pwd)"
work_dir="$(mktemp -d "$output/.hoan-simulator.XXXXXXXX")"

run_simctl() {
  python3 - "$@" <<'PY'
import subprocess
import sys

command = ['xcrun', 'simctl', *sys.argv[2:]]
try:
    result = subprocess.run(command, timeout=int(sys.argv[1]), stdin=subprocess.DEVNULL)
except subprocess.TimeoutExpired:
    sys.exit(f'Simulator timed out: {command[2]}')
sys.exit(result.returncode)
PY
}

cleanup() {
  if [[ -f "$work_dir/created-devices" ]]; then
    while read -r id; do
      run_simctl 20 shutdown "$id" >/dev/null 2>&1 || true
      run_simctl 20 delete "$id" >/dev/null 2>&1 || true
    done < "$work_dir/created-devices"
  fi
  rm -rf -- "$work_dir"
}
trap cleanup EXIT

for path in '/api/admin-session' '/api/data?admin=1'; do
  status="$(curl -sS --max-time 12 -o /dev/null -w '%{http_code}' "http://127.0.0.1:5173$path")"
  if [[ "$status" != 401 ]]; then
    echo "Máy chủ local chưa trả HTTP 401 ở $path (HTTP $status)." >&2
    exit 1
  fi
done

sim_plist="$work_dir/Info.plist"
cp "$ios_root/HoanAdmin/Info.plist" "$sim_plist"
/usr/libexec/PlistBuddy \
  -c 'Add :NSAppTransportSecurity dict' \
  -c 'Add :NSAppTransportSecurity:NSAllowsLocalNetworking bool true' \
  -c 'Add :NSAppTransportSecurity:NSExceptionDomains dict' \
  -c 'Add :NSAppTransportSecurity:NSExceptionDomains:127.0.0.1 dict' \
  -c 'Add :NSAppTransportSecurity:NSExceptionDomains:127.0.0.1:NSExceptionAllowsInsecureHTTPLoads bool true' "$sim_plist"

xcodebuild -project "$ios_root/HoanAdmin.xcodeproj" -scheme HoanAdmin \
  -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$work_dir/DerivedData" CODE_SIGNING_ALLOWED=NO \
  INFOPLIST_FILE="$sim_plist" build

app="$work_dir/DerivedData/Build/Products/Debug-iphonesimulator/HoanAdmin.app"
bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Info.plist")"
run_simctl 30 list devices available -j > "$work_dir/devices.json"
sdk="$(xcrun --sdk iphonesimulator --show-sdk-version)"
python3 - "$work_dir/devices.json" "$sdk" "$profile_filter" > "$work_dir/profiles.tsv" <<'PY'
import json
import sys

with open(sys.argv[1], encoding='utf-8') as source:
    devices = json.load(source)['devices']
preferred_runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-' + sys.argv[2].replace('.', '-')
runtimes = sorted(
    (key for key in devices if '.iOS-' in key),
    key=lambda key: (key == preferred_runtime, tuple(int(value) for value in key.rsplit('.iOS-', 1)[1].split('-'))),
    reverse=True,
)
profiles = {
    'compact': ('iPhone SE (3rd generation)', 'iPhone 16e', 'iPhone 17e', 'iPhone 16', 'iPhone 17'),
    'large': ('iPhone 17 Pro Max', 'iPhone 16 Pro Max', 'iPhone 15 Pro Max', 'iPhone 16 Plus'),
}
for profile, models in profiles.items():
    if sys.argv[3] not in ('all', profile):
        continue
    candidates = (
        (model, device['deviceTypeIdentifier'], runtime)
        for runtime in runtimes for model in models for device in devices[runtime]
        if device['name'] == model and device.get('isAvailable') and device.get('deviceTypeIdentifier')
    )
    match = next(candidates, None)
    if match is None:
        sys.exit(f'No simulator available for {profile}: {models}')
    print('\t'.join((profile, *match)))
PY

while IFS=$'\t' read -r profile model device_type runtime; do
  id="$(run_simctl 45 create "HOAN Admin $profile $$" "$device_type" "$runtime")"
  printf '%s\n' "$id" >> "$work_dir/created-devices"
  echo "Đang kiểm tra $model ($runtime)"
  run_simctl 210 bootstatus "$id" -b
  echo "Đang cài app trên $model"
  run_simctl 90 install "$id" "$app"
  container="$(run_simctl 30 get_app_container "$id" "$bundle_id" data)"
  report="$container/Library/Caches/hoan-login-viewport.json"
  echo "Đang mở app trên $model"
  if ! SIMCTL_CHILD_HOAN_IOS_TEST_LOOPBACK=1 run_simctl 120 launch "$id" "$bundle_id"; then
    run_simctl 30 io "$id" screenshot "$output/$profile-failed.png" || true
    exit 1
  fi
  for ((attempt=0; attempt<50; attempt++)); do
    [[ ! -s "$report" ]] || break
    sleep 1
  done
  if [[ ! -s "$report" ]]; then
    run_simctl 30 io "$id" screenshot "$output/$profile-failed.png"
    echo "Không nhận được kết quả tải trang đăng nhập từ $model." >&2
    exit 1
  fi
  python3 - "$report" "$output/$profile.json" "$model" "$runtime" <<'PY'
import json
import sys

source_path, output_path, model, runtime = sys.argv[1:]
with open(source_path, encoding='utf-8') as source:
    report = json.load(source)
report.update(model=model, runtime=runtime)
print(json.dumps(report, ensure_ascii=False))
if not (report['login'] and report['compact'] and 320 <= report['width'] <= 500
        and report['documentWidth'] <= report['width'] + 1):
    sys.exit('Unexpected iPhone login layout')
with open(output_path, 'w', encoding='utf-8') as output:
    json.dump(report, output, ensure_ascii=False, indent=2)
    output.write('\n')
PY
  run_simctl 30 io "$id" screenshot "$output/$profile.png"
  run_simctl 30 shutdown "$id"
done < "$work_dir/profiles.tsv"

[[ "$profile_filter" == all ]] || exit 0
python3 - "$output" <<'PY'
import json
import pathlib
import sys

folder = pathlib.Path(sys.argv[1])
compact = json.loads((folder / 'compact.json').read_text(encoding='utf-8'))
large = json.loads((folder / 'large.json').read_text(encoding='utf-8'))
if large['width'] < compact['width'] + 20:
    sys.exit('Expected the large iPhone to have a wider viewport')
PY
