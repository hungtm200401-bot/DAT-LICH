import Script from "next/script";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua để đến nội dung chính</a>
      <div id="app" aria-live="polite" suppressHydrationWarning />
      <div id="toast" className="toast" role="status" aria-live="polite" />
      <div id="modal-root" />
      <Script src="/app.js?v=138.1" strategy="afterInteractive" />
    </>
  );
}
