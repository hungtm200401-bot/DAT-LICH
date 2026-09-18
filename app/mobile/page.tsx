import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HOÀN — Giả lập Mobile App",
  description: "Trình giả lập và kiểm thử ứng dụng HOÀN Makeup trên thiết bị di động",
};

export default function MobileSimulatorPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a202c 0%, #0d1117 100%)",
      color: "#e2e8f0",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 16px 40px",
      boxSizing: "border-box"
    }}>
      {/* Top Header Bar */}
      <header style={{
        width: "100%",
        maxWidth: "960px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        marginBottom: "20px",
        padding: "12px 20px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #a20d38, #5e0821)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: "bold",
            fontFamily: "Tinos, Georgia, serif",
            fontSize: "20px"
          }}>
            H
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#fff", letterSpacing: "0.02em" }}>
              HOÀN Makeup — Mobile Simulator
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Trình giả lập thiết bị di động chuẩn xác (iPhone 16 Pro)
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            background: "rgba(0,0,0,0.4)",
            borderRadius: "8px",
            padding: "3px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <button
              id="btn-switch-client"
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: "6px",
                background: "#a20d38",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              data-target="/"
            >
              💄 Khách đặt lịch
            </button>
            <button
              id="btn-switch-admin"
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              data-target="/#/admin"
            >
              💼 Quản trị Mobile
            </button>
          </div>

          <button
            id="btn-reload-frame"
            title="Làm mới màn hình mobile và xóa bộ nhớ tạm"
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            🔄 Tải lại
          </button>

          <button
            id="btn-open-popup"
            title="Mở cửa sổ chuẩn kích thước điện thoại"
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ↗ Cửa sổ riêng
          </button>
        </div>
      </header>

      {/* Main Simulation Area */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "36px",
        width: "100%",
        maxWidth: "1060px"
      }}>
        {/* Realistic iPhone 16 Pro Frame */}
        <div style={{
          position: "relative",
          width: "393px",
          height: "852px",
          background: "#18181b",
          borderRadius: "54px",
          padding: "12px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 2px #3f3f46, 0 0 0 5px #27272a, inset 0 0 0 2px rgba(255,255,255,0.1)",
          boxSizing: "border-box",
          flexShrink: 0
        }}>
          {/* Hardware Buttons Simulation */}
          <div style={{ position: "absolute", left: "-6px", top: "115px", width: "4px", height: "26px", background: "#3f3f46", borderRadius: "2px" }} />
          <div style={{ position: "absolute", left: "-6px", top: "155px", width: "4px", height: "48px", background: "#3f3f46", borderRadius: "2px" }} />
          <div style={{ position: "absolute", left: "-6px", top: "215px", width: "4px", height: "48px", background: "#3f3f46", borderRadius: "2px" }} />
          <div style={{ position: "absolute", right: "-6px", top: "165px", width: "4px", height: "68px", background: "#3f3f46", borderRadius: "2px" }} />

          {/* Screen Container */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "#ffffff",
            borderRadius: "44px",
            overflow: "hidden",
            boxSizing: "border-box"
          }}>
            {/* Sleek Camera / Speaker Pill */}
            <div style={{
              position: "absolute",
              top: "7px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "16px",
              background: "rgba(0, 0, 0, 0.7)",
              borderRadius: "12px",
              zIndex: 100,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#111827", border: "1px solid #374151" }} />
              <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: "#1f2937" }} />
            </div>

            {/* Embedded Live Mobile App */}
            <iframe
              id="mobile-frame"
              src="/?v=142.0"
              title="HOÀN Makeup Mobile View"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "44px",
                background: "#ffffff",
                display: "block"
              }}
            />
          </div>
        </div>

        {/* Info & Fast Setup Panel */}
        <aside style={{
          flex: "1 1 320px",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}>
          {/* Card: Direct Mobile Links */}
          <div style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#10b981" }}>🌐</span> Dùng mọi nơi (4G/5G/Wi-Fi khác)
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: "12px", lineHeight: "1.5", color: "#94a3b8" }}>
              Link HTTPS công khai toàn cầu, không cần chung Wi-Fi, truy cập mọi lúc mọi nơi trên điện thoại:
            </p>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#34d399",
              marginBottom: "10px",
              wordBreak: "break-all"
            }}>
              <span>https://hoan-makeup-artist.hoan-makeup.workers.dev/</span>
              <button
                id="btn-copy-public-link"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#34d399",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  flexShrink: 0,
                  marginLeft: "8px"
                }}
              >
                Sao chép
              </button>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#fb7185",
              wordBreak: "break-all"
            }}>
              <span>https://hoan-makeup-artist.hoan-makeup.workers.dev/#/admin</span>
              <button
                id="btn-copy-public-admin"
                style={{
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#fb7185",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  flexShrink: 0,
                  marginLeft: "8px"
                }}
              >
                Sao chép
              </button>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginTop: "14px",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px"
            }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=https://hoan-makeup-artist.hoan-makeup.workers.dev/"
                alt="QR Code"
                style={{ width: "85px", height: "85px", borderRadius: "6px", background: "#fff", flexShrink: 0 }}
              />
              <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                <b style={{ color: "#fff", display: "block", marginBottom: "3px" }}>Quét mã QR từ điện thoại bất kỳ</b>
                Dùng 4G/5G quét mã để mở ngay lập tức trên điện thoại mà không cần chung Wi-Fi.
                <div style={{ color: "#34d399", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  ✔ Logo mới dạng chữ (Typography Text)
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.1)", fontSize: "11px", color: "#64748b" }}>
              IP Wi-Fi nội bộ: <code>http://192.168.100.164:5173/</code>
            </div>
          </div>

          {/* Card: Cài như App thật (PWA) */}
          <div style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "15px", color: "#f8fafc" }}>
              📱 Cài đặt như App Native (Không cần App Store)
            </h3>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#94a3b8", lineHeight: "1.7" }}>
              <li>
                <b style={{ color: "#e2e8f0" }}>Trên iPhone:</b> Mở bằng Safari → Nhấn nút <b style={{ color: "#38bdf8" }}>Chia sẻ (Share)</b> → Chọn <b style={{ color: "#fff" }}>"Thêm vào MH chính" (Add to Home Screen)</b>.
              </li>
              <li>
                <b style={{ color: "#e2e8f0" }}>Trên Android:</b> Mở bằng Chrome → Nhấn dấu 3 chấm góc trên → Chọn <b style={{ color: "#fff" }}>"Cài đặt ứng dụng"</b>.
              </li>
              <li>Ứng dụng sẽ có biểu tượng riêng trên màn hình chính, mở không có thanh địa chỉ trình duyệt, mượt và nhanh như app gốc.</li>
            </ul>
          </div>

          {/* Card: Các tính năng mobile đã tối ưu */}
          <div style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "15px", color: "#f8fafc" }}>
              ✨ Điểm mượt mà của bản Mobile
            </h3>
            <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
              <div>✔ Tự nhận diện kích cỡ màn hình và chuyển layout tối ưu.</div>
              <div>✔ Khách đặt lịch 5 bước trơn tru, hỗ trợ chuyển khoản & VietQR.</div>
              <div>✔ HOÀN Admin Mobile: Quản lý lịch hẹn, chặn giờ, duyệt cọc, quản lý dịch vụ và cài đặt ngay trên điện thoại.</div>
              <div>✔ Không bị đè nút, không bị che khuất thanh điều hướng.</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Simulator Control Script */}
      <script dangerouslySetInnerHTML={{ __html: `
        (() => {
          const frame = document.getElementById('mobile-frame');
          const btnClient = document.getElementById('btn-switch-client');
          const btnAdmin = document.getElementById('btn-switch-admin');
          const btnReload = document.getElementById('btn-reload-frame');
          const btnPopup = document.getElementById('btn-open-popup');
          const btnCopyPublic = document.getElementById('btn-copy-public-link');
          const btnCopyPublicAdmin = document.getElementById('btn-copy-public-admin');

          function setView(target, isClient) {
            const clean = target.split('?')[0];
            frame.src = clean + '?v=142.0&t=' + Date.now();
            if (isClient) {
              btnClient.style.background = '#a20d38';
              btnClient.style.color = '#fff';
              btnAdmin.style.background = 'transparent';
              btnAdmin.style.color = '#94a3b8';
            } else {
              btnAdmin.style.background = '#a20d38';
              btnAdmin.style.color = '#fff';
              btnClient.style.background = 'transparent';
              btnClient.style.color = '#94a3b8';
            }
          }

          btnReload?.addEventListener('click', () => {
            const cur = frame.getAttribute('src') || '/';
            const clean = cur.split('?')[0];
            frame.src = clean + '?v=142.0&t=' + Date.now();
            btnReload.textContent = 'Đang tải...';
            setTimeout(() => { btnReload.textContent = '🔄 Tải lại'; }, 800);
          });

          btnClient?.addEventListener('click', () => setView('/', true));
          btnAdmin?.addEventListener('click', () => setView('/#/admin', false));

          btnPopup?.addEventListener('click', () => {
            const currentSrc = frame.getAttribute('src') || '/';
            window.open(currentSrc, 'HoanMobilePopup', 'width=390,height=844,resizable=yes,scrollbars=yes');
          });

          btnCopyPublic?.addEventListener('click', () => {
            navigator.clipboard.writeText('https://hoan-makeup-artist.hoan-makeup.workers.dev/');
            btnCopyPublic.textContent = 'Đã chép!';
            setTimeout(() => { btnCopyPublic.textContent = 'Sao chép'; }, 2000);
          });

          btnCopyPublicAdmin?.addEventListener('click', () => {
            navigator.clipboard.writeText('https://hoan-makeup-artist.hoan-makeup.workers.dev/#/admin');
            btnCopyPublicAdmin.textContent = 'Đã chép!';
            setTimeout(() => { btnCopyPublicAdmin.textContent = 'Sao chép'; }, 2000);
          });
        })();
      ` }} />
    </div>
  );
}
