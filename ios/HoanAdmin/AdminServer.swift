import Foundation

struct AdminServer {
    let origin: URL
    let loginURL: URL
    private let scheme: String
    private let host: String
    private let port: Int

    static let current: Self? = {
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["HOAN_IOS_TEST_LOOPBACK"] == "1" {
            return Self("http://127.0.0.1:5173", simulatorLoopback: true)
        }
        #endif

        guard let value = Bundle.main.object(forInfoDictionaryKey: "HoanAdminOrigin") as? String else { return nil }
        return Self(value)
    }()

    private init?(_ address: String, simulatorLoopback: Bool = false) {
        guard var parts = URLComponents(string: address),
              let scheme = parts.scheme?.lowercased(),
              let host = parts.host?.lowercased(), !host.isEmpty,
              scheme == "https" || (simulatorLoopback && scheme == "http" && host == "127.0.0.1" && parts.port == 5173),
              parts.user == nil, parts.password == nil,
              parts.path.isEmpty || parts.path == "/",
              parts.query == nil, parts.fragment == nil
        else { return nil }

        let port = parts.port ?? (scheme == "https" ? 443 : 80)
        guard (1...65535).contains(port) else { return nil }
        parts.path = "/"
        guard let origin = parts.url else { return nil }
        parts.fragment = "/admin"
        guard let loginURL = parts.url else { return nil }

        self.origin = origin
        self.loginURL = loginURL
        self.scheme = scheme
        self.host = host
        self.port = port
    }

    func contains(_ url: URL) -> Bool {
        guard let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == scheme, parts.host?.lowercased() == host,
              parts.user == nil, parts.password == nil
        else { return false }
        return (parts.port ?? (scheme == "https" ? 443 : 80)) == port
    }

    func allowsDownload(from url: URL) -> Bool {
        if url.scheme == "blob", let source = URL(string: String(url.absoluteString.dropFirst(5))) {
            return contains(source)
        }
        return contains(url)
    }

    func hasProtectedAdminEndpoints() async throws -> Bool {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.timeoutIntervalForRequest = 12
        configuration.timeoutIntervalForResource = 20
        let session = URLSession(configuration: configuration)
        defer { session.finishTasksAndInvalidate() }

        let sessionURL = origin.appendingPathComponent("api").appendingPathComponent("admin-session")
        var dataURL = URLComponents()
        dataURL.path = "/api/data"
        dataURL.queryItems = [URLQueryItem(name: "admin", value: "1")]
        guard let adminURL = dataURL.url(relativeTo: origin) else { return false }

        async let sessionProtected = rejectsAnonymousRequest(sessionURL, using: session)
        async let dataProtected = rejectsAnonymousRequest(adminURL.absoluteURL, using: session)
        let (sessionDenied, dataDenied) = try await (sessionProtected, dataProtected)
        return sessionDenied && dataDenied
    }

    private func rejectsAnonymousRequest(_ url: URL, using session: URLSession) async throws -> Bool {
        let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        let (bytes, response) = try await session.bytes(for: request)
        defer { bytes.task.cancel() }
        guard let http = response as? HTTPURLResponse,
              let responseURL = http.url, responseURL == url, contains(responseURL)
        else { return false }
        return http.statusCode == 401
    }
}
