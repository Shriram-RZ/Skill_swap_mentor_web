import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only image or video files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
    }

    // ponytail: ext from filename, fallback to mime subtype; sanitized to alnum
    const rawExt = (path.extname(file.name) || `.${file.type.split("/")[1] || "bin"}`).toLowerCase();
    const ext = rawExt.replace(/[^a-z0-9.]/g, "").slice(0, 6);
    const filename = `${randomUUID()}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${filename}`, type: isImage ? "image" : "video" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
