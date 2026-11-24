import UIKit
import UserNotifications
import WebKit

/// Only the configured admin origin may use this bridge. APNs credentials stay on the server.
@MainActor
final class NativePushCoordinator: NSObject {
    static let shared = NativePushCoordinator()
    private weak var webView: WKWebView?
    private var server: AdminServer?
    private var authenticated = false
    private var revision = 0
    private var busy = false
    private var token: String?
    private var pendingCode: String?
    private var openingBooking = false
    private var lastSync = Date.distantPast
    private var registrationAttempt: UUID?
    private var subscriptionTask: Task<Void, Never>?
    private var state = "loading"
    private var message = "Đang kiểm tra thông báo iPhone…"
    private let preference = "hoanNativePushOptIn"
    private var optedIn: Bool {
        get { UserDefaults.standard.bool(forKey: preference) }
        set { UserDefaults.standard.set(newValue, forKey: preference) }
    }
    private var environment: String? {
        let value = Bundle.main.object(forInfoDictionaryKey: "HoanPushEnvironment") as? String
        return ["development", "production"].contains(value ?? "") ? value : nil
    }

    private override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil)
    }

    func attach(_ browser: WKWebView, server: AdminServer?) {
        webView = browser
        self.server = server
        authenticated = false
        revision += 1
    }

    func receive(_ action: String) {
        if action == "unauthenticated" {
            authenticated = false
            revision += 1
            return // Session expiry alone must not revoke an opted-in installation.
        }
        if action == "logout" {
            authenticated = false
            revision += 1
            optedIn = false
            token = nil
            pendingCode = nil
            registrationAttempt = nil
            UIApplication.shared.unregisterForRemoteNotifications()
            return // The logout API revokes the installation in the same transaction.
        }
        if action == "sync" {
            authenticated = true
            openPendingBooking()
            if !busy && Date().timeIntervalSince(lastSync) > 20 {
                lastSync = Date()
                Task { await refresh() }
            } else { publish() }
            return
        }
        guard ["enable", "disable", "test"].contains(action), authenticated, !busy else { return }
        busy = true
        publish()
        Task {
            switch action {
            case "enable": await enable()
            case "disable": await disable()
            case "test": await test()
            default: break
            }
        }
    }

    @objc private func becameActive() {
        guard authenticated, !busy else { return }
        Task { await refresh() }
    }

    private func request(_ method: String = "GET", body: [String: Any] = [:]) async throws -> [String: Any] {
        guard let browser = webView, let url = browser.url, server?.contains(url) == true else { throw failure("Chưa mở đúng máy chủ quản trị.") }
        let encoded = String(decoding: try JSONSerialization.data(withJSONObject: body), as: UTF8.self)
        let value = try await browser.callAsyncJavaScript("""
            const options = {method, credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(12000)};
            if (method === 'POST') { options.headers={'Content-Type':'application/json'}; options.body=body; }
            const response = await fetch('/api/admin-native-push', options);
            return {status:response.status, data:await response.json().catch(()=>({}))};
            """, arguments: ["method": method, "body": encoded], in: nil, contentWorld: .page)
        guard let result = value as? [String: Any], let status = result["status"] as? Int,
              let data = result["data"] as? [String: Any] else { throw failure("Máy chủ chưa trả trạng thái thông báo.") }
        guard (200...299).contains(status) else {
            throw failure(data["error"] as? String ?? "Chưa kết nối được thông báo. Thử lại khi có mạng.", code: status)
        }
        return data
    }

    private func failure(_ message: String, code: Int = 0) -> NSError {
        NSError(domain: "HOANNativePush", code: code, userInfo: [NSLocalizedDescriptionKey: message])
    }

    private func update(_ value: String, _ text: String) {
        state = value
        message = text
        publish()
    }

    private func publish() {
        guard authenticated, let browser = webView, let url = browser.url, server?.contains(url) == true else { return }
        browser.callAsyncJavaScript("window.HoanMobileAdmin?.setNativePushStatus?.(state)",
            arguments: ["state": ["state": state, "message": message, "busy": busy]], in: nil, in: .page) { _ in }
    }

    private func configuration() async throws -> [String: Any] {
        let config = try await request()
        guard config["available"] as? Bool == true else { throw failure("Máy chủ chưa cấu hình thông báo iPhone. Liên hệ chủ hệ thống để bật APNs.") }
        guard let environment, config["environment"] as? String == environment else {
            throw failure("Môi trường thông báo của bản cài chưa khớp máy chủ. Cần bản ký phù hợp.")
        }
        return config
    }

    private func refresh() async {
        guard authenticated, !busy else { return }
        busy = true
        let current = revision
        defer { busy = false; publish() }
        do {
            _ = try await configuration()
            let permission = await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
            guard current == revision, authenticated else { return }
            if permission == .denied { update("denied", "Thông báo đang bị tắt trong Cài đặt iPhone."); return }
            if optedIn && [.authorized, .provisional, .ephemeral].contains(permission) {
                update("registering", "Đang đăng ký thông báo với Apple…")
                registerWithApple()
            } else { update("available", "Bật để nhận thông báo khi có lịch mới, kể cả khi đóng app.") }
        } catch {
            guard current == revision, authenticated else { return }
            update("error", error.localizedDescription)
        }
    }

    private func enable() async {
        busy = true
        let current = revision
        defer { busy = false; publish() }
        do {
            _ = try await configuration()
            let center = UNUserNotificationCenter.current()
            let permission = await center.notificationSettings().authorizationStatus
            if permission == .denied {
                if let url = URL(string: UIApplication.openSettingsURLString) { await UIApplication.shared.open(url) }
                return
            }
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            guard current == revision, authenticated else { return }
            guard granted else { update("denied", "Chưa cấp quyền thông báo trên iPhone."); return }
            optedIn = true
            update("registering", "Đang đăng ký thông báo với Apple…")
            registerWithApple()
        } catch {
            guard current == revision, authenticated else { return }
            update("error", error.localizedDescription)
        }
    }

    private func registerWithApple() {
        let attempt = UUID()
        registrationAttempt = attempt
        UIApplication.shared.registerForRemoteNotifications()
        Task {
            try? await Task.sleep(nanoseconds: 20_000_000_000)
            guard registrationAttempt == attempt, authenticated, optedIn else { return }
            registrationAttempt = nil
            update("error", "Chưa nhận được đăng ký Apple. Kiểm tra mạng và bản ký có quyền Push Notifications, rồi thử lại.")
        }
    }

    func didRegister(_ data: Data) {
        registrationAttempt = nil
        // Ask Apple at each app launch; do not persist a device token in local storage.
        token = data.map { String(format: "%02x", $0) }.joined()
        guard authenticated, optedIn, let token, let environment else { return }
        let current = revision
        let previous = subscriptionTask
        subscriptionTask = Task {
            await previous?.value
            guard current == revision, authenticated, optedIn else { return }
            do {
                _ = try await request("POST", body: ["action": "subscribe", "token": token, "environment": environment])
                guard current == revision, authenticated, optedIn else { return }
                update("enabled", "Đã bật báo lịch mới trên iPhone.")
            } catch {
                guard current == revision, authenticated else { return }
                update("error", error.localizedDescription)
            }
        }
    }

    func didFailRegistration() {
        registrationAttempt = nil
        guard authenticated, optedIn else { return }
        update("error", "Chưa đăng ký được với Apple. Kiểm tra mạng và chữ ký có quyền Push Notifications. Bản ký Apple ID miễn phí không hỗ trợ quyền này.")
    }

    private func disable() async {
        busy = true
        optedIn = false
        revision += 1
        registrationAttempt = nil
        let current = revision
        defer { busy = false; publish() }
        do {
            // Finish an in-flight subscribe before revoking, so it cannot resurrect this installation.
            await subscriptionTask?.value
            _ = try await request("DELETE")
            guard current == revision, authenticated else { return }
            optedIn = false
            token = nil
            registrationAttempt = nil
            UIApplication.shared.unregisterForRemoteNotifications()
            update("available", "Đã tắt báo lịch mới trên iPhone này.")
        } catch {
            guard current == revision, authenticated else { return }
            update("error", error.localizedDescription)
        }
    }

    private func test() async {
        busy = true
        let current = revision
        defer { busy = false; publish() }
        do {
            let result = try await request("POST", body: ["action": "test"])
            guard current == revision, authenticated else { return }
            update(result["accepted"] as? Bool == true ? "enabled" : "error", "Đã gửi yêu cầu thử tới Apple. Kiểm tra thông báo trên iPhone.")
        } catch {
            guard current == revision, authenticated else { return }
            update("error", error.localizedDescription)
        }
    }

    func openNotification(_ response: UNNotificationResponse) {
        let data = response.notification.request.content.userInfo
        guard response.actionIdentifier == UNNotificationDefaultActionIdentifier,
              data["kind"] as? String == "booking", let code = data["code"] as? String,
              code.range(of: #"^[A-Z0-9-]{3,80}$"#, options: .regularExpression) != nil else { return }
        pendingCode = code
        openPendingBooking()
    }

    private func openPendingBooking() {
        guard authenticated, !openingBooking, let code = pendingCode, let browser = webView,
              let url = browser.url, server?.contains(url) == true else { return }
        openingBooking = true
        let current = revision
        Task {
            defer {
                openingBooking = false
                // A newer notification or a completed login may arrive while this request is pending.
                if authenticated, let waiting = pendingCode, waiting != code || current != revision { openPendingBooking() }
            }
            do {
                _ = try await request() // Recheck the session before consuming a cold-start/deferred route.
                guard current == revision, authenticated, pendingCode == code else { return }
                let opened = try await browser.callAsyncJavaScript("await window.HoanAdminAuth?.reload?.(); if (!window.HoanAdminAuth?.isAuthorized?.()) return false; location.hash='/admin/appointments/'+code; return true;",
                    arguments: ["code": code], in: nil, contentWorld: .page)
                if opened as? Bool == true, current == revision, authenticated, pendingCode == code { pendingCode = nil }
            } catch {
                // Keep the code across session expiry or a temporary outage; the next authenticated sync retries.
                guard current == revision else { return }
                if (error as NSError).code == 401 {
                    authenticated = false
                    browser.callAsyncJavaScript("await window.HoanAdminAuth?.reload?.();", arguments: [:], in: nil, in: .page) { _ in }
                }
            }
        }
    }
}
