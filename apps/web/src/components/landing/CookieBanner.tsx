"use client";

import CookieConsent from "react-cookie-consent";

export function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="hirevault-consent"
      style={{ background: "#2B373B", fontFamily: "var(--font-sans)" }}
      buttonStyle={{ color: "#fff", fontSize: "13px", background: "#1da074", borderRadius: "6px", fontWeight: "bold" }}
      declineButtonStyle={{ color: "#fff", fontSize: "13px", background: "transparent", border: "1px solid #fff", borderRadius: "6px" }}
      expires={150}
    >
      This website uses cookies to enhance the user experience and ensure security.{" "}
      <a href="/privacy" style={{ textDecoration: "underline", color: "#fff" }}>Learn more</a>
    </CookieConsent>
  );
}
