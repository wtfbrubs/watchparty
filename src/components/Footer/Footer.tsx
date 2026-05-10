import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "8px",
      padding: "1.2rem 5%",
      borderTop: "1px solid var(--nc-border)",
      background: "var(--nc-bg-secondary)",
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "0.7rem",
      color: "var(--nc-text-muted)",
    }}
  >
    <span>
      nativos<span style={{ color: "var(--nc-green)" }}>.cloud</span>
    </span>
    <div style={{ display: "flex", gap: "1.2rem" }}>
      <Link to="/terms" style={{ color: "var(--nc-text-muted)", textDecoration: "none" }}>
        termos
      </Link>
      <Link to="/privacy" style={{ color: "var(--nc-text-muted)", textDecoration: "none" }}>
        privacidade
      </Link>
      <Link to="/faq" style={{ color: "var(--nc-text-muted)", textDecoration: "none" }}>
        faq
      </Link>
    </div>
  </footer>
);
