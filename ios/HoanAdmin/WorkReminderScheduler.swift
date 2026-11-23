import CryptoKit
import UIKit
import UserNotifications

@MainActor
final class WorkReminderScheduler {
    nonisolated static let identifierPrefix = "hoan-work-"

    private struct Reminder {
        let identifier: String
        let startsAt: Date
        let remindAt: Date

        init?(_ value: [String: Any]) {
            guard let code = value["code"] as? String,
                  code.range(of: #"^[A-Za-z0-9-]{3,90}$"#, options: .regularExpression) != nil,
                  let start = value["startsAt"] as? NSNumber,
                  let reminder = value["remindAt"] as? NSNumber,
                  start.doubleValue.isFinite, reminder.doubleValue.isFinite,
                  abs(start.doubleValue - reminder.doubleValue - 86_400_000) <= 1,
                  start.doubleValue / 1_000 < Date().timeIntervalSince1970 + 3_652 * 86_400
            else { return nil }

            let digest = SHA256.hash(data: Data(code.utf8))
            identifier = WorkReminderScheduler.identifierPrefix + digest.map { String(format: "%02x", $0) }.joined()
            startsAt = Date(timeIntervalSince1970: start.doubleValue / 1_000)
            remindAt = Date(timeIntervalSince1970: reminder.doubleValue / 1_000)
        }
    }

    private let center = UNUserNotificationCenter.current()
    private let permissionChanged: (String) -> Void
    private var reminders: [Reminder] = []
    private var hasSnapshot = false
    private var clearDelivered = false
    private var revision = 0
    private var processing = false
    private var permissionInProgress = false

    init(permissionChanged: @escaping (String) -> Void) {
        self.permissionChanged = permissionChanged
    }

    func sync(_ values: [[String: Any]]) {
        guard values.count <= 60 else { return }
        let incoming = values.compactMap(Reminder.init)
        guard incoming.count == values.count, Set(incoming.map(\.identifier)).count == incoming.count else { return }
        reminders = incoming
        hasSnapshot = true
        scheduleReconciliation()
    }

    func clear() {
        reminders = []
        hasSnapshot = false
        clearDelivered = true
        scheduleReconciliation()
    }

    func enable() {
        guard hasSnapshot, !permissionInProgress else { return }
        permissionInProgress = true
        Task {
            defer { permissionInProgress = false }
            let settings = await center.notificationSettings()
            guard hasSnapshot else { return }
            switch settings.authorizationStatus {
            case .notDetermined:
                _ = try? await center.requestAuthorization(options: [.alert, .sound])
            case .denied:
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    _ = await UIApplication.shared.open(url)
                }
            default:
                break
            }
            scheduleReconciliation()
        }
    }

    private func scheduleReconciliation() {
        revision += 1
        guard !processing else { return }
        processing = true
        Task {
            defer { processing = false }
            while true {
                let current = revision
                await reconcile(current)
                if current == revision { return }
            }
        }
    }

    private func reconcile(_ current: Int) async {
        #if DEBUG && targetEnvironment(simulator)
        if hasSnapshot, let testTime = ProcessInfo.processInfo.environment["HOAN_IOS_TEST_WORK_REMINDER"],
           Double(testTime) != nil {
            _ = try? await center.requestAuthorization(options: [.alert, .sound, .provisional])
        }
        #endif
        let authorization = await center.notificationSettings().authorizationStatus
        let permitted = [.authorized, .provisional, .ephemeral].contains(authorization)
        let pending = await center.pendingNotificationRequests()
            .filter { $0.identifier.hasPrefix(Self.identifierPrefix) }
        guard current == revision else { return }

        let now = Date()
        let desired = permitted ? reminders.filter { $0.remindAt > now } : []
        let desiredIDs = Set(desired.map(\.identifier))
        let obsolete = pending.map(\.identifier).filter { !desiredIDs.contains($0) }
        if !obsolete.isEmpty { center.removePendingNotificationRequests(withIdentifiers: obsolete) }

        var hadError = false
        for entry in desired {
            guard current == revision else { return }
            if let oldTrigger = pending.first(where: { $0.identifier == entry.identifier })?.trigger as? UNCalendarNotificationTrigger,
               let oldDate = oldTrigger.nextTriggerDate(), abs(oldDate.timeIntervalSince(entry.remindAt)) < 1 {
                continue
            }
            do {
                try await center.add(Self.request(for: entry))
            } catch {
                hadError = true
            }
        }

        if clearDelivered {
            let delivered = await center.deliveredNotifications().map(\.request.identifier)
                .filter { $0.hasPrefix(Self.identifierPrefix) }
            guard current == revision else { return }
            center.removeDeliveredNotifications(withIdentifiers: delivered)
            clearDelivered = false
        }
        guard current == revision else { return }
        let status = hadError ? "error" : permitted ? "granted" : authorization == .denied ? "denied" : "available"
        permissionChanged(status)
    }

    private static func request(for entry: Reminder) -> UNNotificationRequest {
        var calendar = Calendar(identifier: .gregorian)
        let utc = TimeZone(secondsFromGMT: 0)!
        calendar.timeZone = utc
        var components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: entry.remindAt)
        components.timeZone = utc
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let format = DateFormatter()
        format.locale = Locale(identifier: "vi_VN")
        format.timeZone = TimeZone(identifier: "Asia/Ho_Chi_Minh")
        format.dateFormat = "HH:mm 'ngày' dd/MM"
        let content = UNMutableNotificationContent()
        content.title = "Nhắc lịch làm"
        content.body = format.string(from: entry.startsAt)
        content.sound = .default
        return UNNotificationRequest(identifier: entry.identifier, content: content, trigger: trigger)
    }
}
