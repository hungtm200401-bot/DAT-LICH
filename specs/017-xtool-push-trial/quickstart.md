# Validation guide

1. Dispatch HOAN Admin iPhone on codex/xtool-push-trial with use_xtool=true.
2. Trial downloads the pinned Xtool binary, validates SHA-256 and reads CLI help.
3. Build existing ios/HoanAdmin.xcodeproj with scheme HoanAdmin and Release.
4. Attempt --sign in a clean runner without supplied auth. Expect the real Xtool
   error requesting login. Diagnostic compilation success is not Push success.
5. Download Xtool-Trial-Diagnostics; inspect report.json, logs and output hashes.
6. Verify IPA/LATEST.json and existing IPA hashes are unchanged.
7. Before claiming Push: supply authorized Apple signing rights and server APNs
   credentials, validate real signature/profile/Bundle ID/environment, install on
   registered iPhone, allow notifications, and test locked/background plus force
   quit with an explicitly authorized TEST booking. Tapping must open its code.

No automatic production booking or device actions are part of this trial.
