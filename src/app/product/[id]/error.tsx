"use client";

import { useEffect } from "react";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Product route error:", error);
  }, [error]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2 style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
        Product page crashed
      </h2>

      <div style={{ whiteSpace: "pre-wrap", fontSize: 14, marginBottom: 12 }}>
        {String(error?.message || error)}
      </div>

      {error?.stack ? (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Show stack
          </summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {error.stack}
          </pre>
        </details>
      ) : null}

      <button
        onClick={() => reset()}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          background: "#111",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}