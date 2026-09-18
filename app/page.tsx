import Script from "next/script";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua để đến nội dung chính</a>
      <div id="app" aria-live="polite" suppressHydrationWarning />
      <div id="toast" className="toast" role="status" aria-live="polite" />
      <div id="modal-root" />
      <Script src="/scroll-enhancements.js?v=1.2" strategy="afterInteractive" />
      <Script src="/mobile-admin.js?v=1.2" strategy="afterInteractive" />
      <Script src="/app.js?v=142.0" strategy="afterInteractive" />
    </>
  );
}
