"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function convertFile() {
    if (!file) return;

    setLoading(true);
    setMessage("Converting...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Conversion failed");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        file.name.replace(/\.[^/.]+$/, "") + ".pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setMessage("✓ PDF downloaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "60px 20px",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "auto",
          textAlign: "center"
        }}
      >
        <h1 style={{ fontSize: "48px" }}>
          File Converter
        </h1>

        <p style={{ color: "#94a3b8" }}>
          Convert Excel, Word and PowerPoint files to PDF
        </p>

        <div
          style={{
            marginTop: "40px",
            padding: "50px 20px",
            border: "2px dashed #475569",
            borderRadius: "20px"
          }}
        >
          <div style={{ fontSize: "50px" }}>📄</div>

          <h2>Choose your file</h2>

          <input
            type="file"
            accept=".xlsx,.xls,.docx,.doc,.pptx,.ppt,.ods,.odt,.odp,.csv,.txt"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          {file && (
            <div style={{ marginTop: "25px" }}>
              <p>{file.name}</p>

              <button
                onClick={convertFile}
                disabled={loading}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "14px 30px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {loading
                  ? "Converting..."
                  : "Convert to PDF"}
              </button>
            </div>
          )}

          {message && (
            <p style={{ marginTop: "25px" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
        }
