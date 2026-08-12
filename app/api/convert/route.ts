import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".xlsx",
  ".xls",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".ods",
  ".odt",
  ".odp",
  ".csv",
  ".txt"
]);

function getLibreOfficeCommand() {
  return process.env.LIBREOFFICE_PATH || "soffice";
}

function safeName(name: string) {
  return path
    .parse(name)
    .name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

export async function POST(request: NextRequest) {
  let tempDir = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Maximum file size is 25 MB." },
        { status: 413 }
      );
    }

    const originalName = path.basename(file.name);
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "File format is not supported." },
        { status: 415 }
      );
    }

    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "converter-")
    );

    const inputPath = path.join(
      tempDir,
      `input${ext}`
    );

    const outputDir = path.join(
      tempDir,
      "output"
    );

    await fs.mkdir(outputDir);

    await fs.writeFile(
      inputPath,
      Buffer.from(await file.arrayBuffer())
    );

    await execFileAsync(
      getLibreOfficeCommand(),
      [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        outputDir,
        inputPath
      ],
      {
        timeout: 55000,
        maxBuffer: 4 * 1024 * 1024
      }
    );

    const files = await fs.readdir(outputDir);

    const pdfName = files.find(
      (name) =>
        path.extname(name).toLowerCase() === ".pdf"
    );

    if (!pdfName) {
      throw new Error("PDF was not generated.");
    }

    const pdf = await fs.readFile(
      path.join(outputDir, pdfName)
    );

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="${safeName(
            originalName
          )}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Conversion error:", error);

    return NextResponse.json(
      {
        error:
          "Conversion failed. Please check your file and try again."
      },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, {
        recursive: true,
        force: true
      }).catch(() => {});
    }
  }
}
