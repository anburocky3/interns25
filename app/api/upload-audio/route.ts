import { put, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 600 * 1024; // 600KB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userName = formData.get("userName") as string;
    const oldAudioUrl = formData.get("oldAudioUrl") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Only audio files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024}KB limit` },
        { status: 400 },
      );
    }

    // Delete old audio file if it exists
    if (oldAudioUrl) {
      try {
        await del(oldAudioUrl);
      } catch (error) {
        console.warn("Failed to delete old audio file:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Generate unique filename with first name prefix
    const firstName = userName
      ? userName
          .split(" ")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "audio";

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `audio/${firstName}-${timestamp}-${randomId}.${extension}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json(
      {
        url: blob.url,
        filename: blob.pathname,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const audioUrl = body.audioUrl as string;

    if (!audioUrl) {
      return NextResponse.json(
        { error: "No audio URL provided" },
        { status: 400 },
      );
    }

    // Delete file from Vercel Blob
    await del(audioUrl);

    return NextResponse.json(
      { message: "Audio deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
