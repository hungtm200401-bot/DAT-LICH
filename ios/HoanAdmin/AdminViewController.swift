import UIKit
import WebKit

final class AdminViewController: UIViewController {
    private let server = AdminServer.current
    private lazy var browser: WKWebView = {
        let configuration = WKWebViewConfiguration()
        let scripts = configuration.userContentController
        scripts.addUserScript(WKUserScript(source: Self.edgeLayout, injectionTime: .atDocumentEnd,
                                           forMainFrameOnly: true, in: .defaultClient))
        scripts.add(StatusBarListener(owner: self), contentWorld: .defaultClient, name: "hoanStatusBar")
        return WKWebView(frame: .zero, configuration: configuration)
    }()
    private let progress = UIActivityIndicatorView(style: .large)
    private let status = UILabel()
    private let retry = UIButton(type: .system)
    private var hasDarkHeader = false
    private var downloadDestinations: [ObjectIdentifier: URL] = [:]

    override var preferredStatusBarStyle: UIStatusBarStyle {
        hasDarkHeader ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = .light
        view.backgroundColor = .systemBackground

        browser.translatesAutoresizingMaskIntoConstraints = false
        browser.navigationDelegate = self
        browser.uiDelegate = self
        browser.allowsBackForwardNavigationGestures = true
        browser.scrollView.contentInsetAdjustmentBehavior = .never
        view.addSubview(browser)

        let burgundy = UIColor(red: 122 / 255.0, green: 24 / 255.0, blue: 50 / 255.0, alpha: 1)
        progress.color = burgundy
        status.textAlignment = .center
        status.numberOfLines = 0
        status.font = .preferredFont(forTextStyle: .body)
        status.adjustsFontForContentSizeCategory = true

        var button = UIButton.Configuration.filled()
        button.title = "Thử lại"
        button.buttonSize = .large
        button.baseBackgroundColor = burgundy
        retry.configuration = button
        retry.addTarget(self, action: #selector(openAdmin), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [progress, status, retry])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 16
        view.addSubview(stack)

        let safeArea = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            browser.topAnchor.constraint(equalTo: view.topAnchor),
            browser.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            browser.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            browser.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            stack.centerXAnchor.constraint(equalTo: safeArea.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: safeArea.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: safeArea.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: safeArea.trailingAnchor, constant: -24)
        ])
        openAdmin()
    }

    @objc private func openAdmin() {
        updateStatusBar(darkHeader: false)
        browser.isHidden = true
        retry.isHidden = true
        status.isHidden = true
        guard let server else {
            showFailure("Bản cài đặt thiếu địa chỉ HTTPS của trang quản trị.")
            return
        }

        progress.startAnimating()
        Task {
            do {
                guard try await server.hasProtectedAdminEndpoints() else {
                    showFailure("Máy chủ cần cập nhật trước khi đăng nhập quản trị.")
                    return
                }
                browser.load(URLRequest(url: server.loginURL, timeoutInterval: 25))
            } catch {
                showFailure("Chưa kết nối được với HOÀN Admin. Kiểm tra mạng rồi thử lại.")
            }
        }
    }

    private func showFailure(_ message: String) {
        updateStatusBar(darkHeader: false)
        progress.stopAnimating()
        browser.isHidden = true
        status.text = message
        status.isHidden = false
        retry.isHidden = server == nil
        UIAccessibility.post(notification: .layoutChanged, argument: status)
    }

    private func updateStatusBar(darkHeader: Bool) {
        guard hasDarkHeader != darkHeader else { return }
        hasDarkHeader = darkHeader
        setNeedsStatusBarAppearanceUpdate()
    }

    private final class StatusBarListener: NSObject, WKScriptMessageHandler {
        weak var owner: AdminViewController?

        init(owner: AdminViewController) {
            self.owner = owner
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let owner, message.frameInfo.isMainFrame, let url = message.frameInfo.request.url,
                  owner.server?.contains(url) == true, let dark = message.body as? Bool else { return }
            owner.updateStatusBar(darkHeader: dark)
        }
    }

    private static let edgeLayout = """
    (() => {
      const root = document.documentElement;
      root.classList.add('hoan-iphone');
      const style = document.createElement('style');
      style.textContent = [
        'html.hoan-iphone { --ios-top: env(safe-area-inset-top); --ios-right: env(safe-area-inset-right);',
        '--ios-bottom: env(safe-area-inset-bottom); --ios-left: env(safe-area-inset-left); }',
        '.hoan-iphone body:not(:has(.ma-app)) { padding: var(--ios-top) var(--ios-right) var(--ios-bottom) var(--ios-left); }',
        '.hoan-iphone .ma-app { box-sizing: border-box; padding-bottom: calc(76px + var(--ios-bottom)); }',
        '.hoan-iphone .ma-app > .ma-top { box-sizing: border-box; height: calc(66px + var(--ios-top));',
        'padding: var(--ios-top) calc(16px + var(--ios-right)) 0 calc(16px + var(--ios-left)); }',
        '.hoan-iphone .ma-app > .ma-main { width: auto; margin-right: var(--ios-right); margin-left: var(--ios-left); }',
        '.hoan-iphone .ma-app > .ma-bottom { box-sizing: border-box; height: calc(67px + var(--ios-bottom));',
        'padding: 0 var(--ios-right) var(--ios-bottom) var(--ios-left); }'
      ].join(' ');
      document.head.append(style);
      let previous;
      const updateStatusBar = () => {
        const dark = Boolean(document.querySelector('.ma-app > .ma-top'));
        if (dark === previous) return;
        previous = dark;
        window.webkit.messageHandlers.hoanStatusBar.postMessage(dark);
      };
      new MutationObserver(updateStatusBar).observe(document.querySelector('#app') || document.body, {
        childList: true, subtree: true
      });
      updateStatusBar();
    })();
    """

    private func pageFailed(_ error: Error) {
        let failure = error as NSError
        if failure.domain == NSURLErrorDomain && failure.code == NSURLErrorCancelled { return }
        if failure.domain == "WebKitErrorDomain" && failure.code == 102 { return }
        showFailure("Không tải được trang quản trị. Vui lòng thử lại.")
    }
}

extension AdminViewController: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor action: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = action.request.url, let server else {
            decisionHandler(.cancel)
            return
        }
        if action.targetFrame?.isMainFrame == false {
            decisionHandler(.allow)
            return
        }
        if action.shouldPerformDownload && server.allowsDownload(from: url) {
            decisionHandler(.download)
            return
        }
        if server.contains(url) {
            if action.targetFrame == nil {
                decisionHandler(.cancel)
                webView.load(action.request)
            } else {
                decisionHandler(.allow)
            }
            return
        }

        decisionHandler(.cancel)
        if action.sourceFrame.isMainFrame, action.navigationType == .linkActivated,
           let scheme = url.scheme?.lowercased(), ["https", "mailto", "tel", "sms"].contains(scheme) {
            UIApplication.shared.open(url)
        }
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor response: WKNavigationResponse,
        decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
    ) {
        guard response.isForMainFrame else {
            decisionHandler(.allow)
            return
        }
        guard let url = response.response.url, server?.allowsDownload(from: url) == true else {
            decisionHandler(.cancel)
            showFailure("Trang quản trị chuyển sang một địa chỉ khác.")
            return
        }
        if let http = response.response as? HTTPURLResponse, http.statusCode >= 400 {
            decisionHandler(.cancel)
            showFailure("Máy chủ chưa tải được trang quản trị (HTTP \(http.statusCode)).")
            return
        }
        decisionHandler(response.canShowMIMEType ? .allow : .download)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progress.stopAnimating()
        status.isHidden = true
        retry.isHidden = true
        browser.isHidden = false
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["HOAN_IOS_TEST_LOOPBACK"] == "1" {
            recordViewport(webView)
        }
        #endif
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        pageFailed(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        pageFailed(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        showFailure("Trang quản trị cần được tải lại.")
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }
}

extension AdminViewController: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard frame.isMainFrame, let url = frame.request.url, server?.contains(url) == true,
              presentedViewController == nil, viewIfLoaded?.window != nil else {
            completionHandler(false)
            return
        }
        let alert = UIAlertController(title: "Xác nhận", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "Xác nhận", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }
}

extension AdminViewController: WKDownloadDelegate {
    func download(
        _ download: WKDownload,
        decideDestinationUsing response: URLResponse,
        suggestedFilename: String,
        completionHandler: @escaping (URL?) -> Void
    ) {
        guard let url = response.url, server?.allowsDownload(from: url) == true else {
            completionHandler(nil)
            return
        }
        let filename = (suggestedFilename as NSString).lastPathComponent
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false,
                                                    attributes: [.protectionKey: FileProtectionType.complete])
            let safeName = ["", ".", ".."].contains(filename) ? "HOAN-export" : filename
            let destination = directory.appendingPathComponent(safeName)
            downloadDestinations[ObjectIdentifier(download)] = destination
            completionHandler(destination)
        } catch {
            completionHandler(nil)
        }
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let file = downloadDestinations.removeValue(forKey: ObjectIdentifier(download)) else { return }
        let directory = file.deletingLastPathComponent()
        guard presentedViewController == nil, viewIfLoaded?.window != nil else {
            try? FileManager.default.removeItem(at: directory)
            return
        }
        let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
        sheet.completionWithItemsHandler = { _, _, _, _ in
            try? FileManager.default.removeItem(at: directory)
        }
        present(sheet, animated: true)
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        if let file = downloadDestinations.removeValue(forKey: ObjectIdentifier(download)) {
            try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
        }
        guard presentedViewController == nil, viewIfLoaded?.window != nil else { return }
        let alert = UIAlertController(title: "Không tải được tệp", message: "Vui lòng thử xuất lại.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Đóng", style: .cancel))
        present(alert, animated: true)
    }
}

#if DEBUG && targetEnvironment(simulator)
private extension AdminViewController {
    func recordViewport(_ webView: WKWebView, remaining: Int = 160) {
        let key = ProcessInfo.processInfo.environment["HOAN_IOS_TEST_ADMIN_KEY"] ?? ""
        let keyJSON = String(decoding: (try? JSONEncoder().encode(key)) ?? Data([34, 34]), as: UTF8.self)
        let script = """
        (() => {
          if (!location.hash.startsWith('#/admin') || !document.documentElement.classList.contains('hoan-iphone')) return null;
          const header = document.querySelector('.ma-app > .ma-top');
          const tabs = document.querySelector('.ma-app > .ma-bottom');
          const password = document.querySelector('#main input[type=password]');
          const key = \(keyJSON);
          if (key && !(header && tabs)) {
            if (password?.form && !window.hoanSimulatorLoginSubmitted) {
              window.hoanSimulatorLoginSubmitted = true;
              password.value = key;
              password.form.requestSubmit();
            }
            return null;
          }
          const compact = window.HoanMobileAdmin?.matches();
          if (typeof compact !== 'boolean' || !key && !password) return null;
          return JSON.stringify({
            width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
            compact, login: Boolean(password), dashboard: Boolean(header && tabs),
            headerTop: header?.getBoundingClientRect().top,
            headerInset: header && parseFloat(getComputedStyle(header).paddingTop),
            tabsBottom: tabs?.getBoundingClientRect().bottom,
            tabsInset: tabs && parseFloat(getComputedStyle(tabs).paddingBottom)
          });
        })();
        """
        webView.evaluateJavaScript(script) { [weak self, weak webView] result, _ in
            guard let self, let webView else { return }
            if let json = result as? String,
               var report = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any],
               let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
                report["fillsWindow"] = webView.frame == self.view.bounds
                report["safeTop"] = self.view.safeAreaInsets.top
                report["safeBottom"] = self.view.safeAreaInsets.bottom
                if let data = try? JSONSerialization.data(withJSONObject: report) {
                    try? data.write(to: directory.appendingPathComponent("hoan-viewport.json"), options: .atomic)
                }
            } else if remaining > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self, weak webView] in
                    if let webView { self?.recordViewport(webView, remaining: remaining - 1) }
                }
            }
        }
    }
}
#endif
