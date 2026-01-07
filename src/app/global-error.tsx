"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        backgroundColor: "#0a0a0a",
                        color: "#fff",
                        fontFamily: "system-ui, sans-serif",
                        padding: "20px",
                    }}
                >
                    <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: "#888", marginBottom: "2rem" }}>
                        {error.message || "An unexpected error occurred"}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#333",
                            color: "#fff",
                            border: "1px solid #444",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
