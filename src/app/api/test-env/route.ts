import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    projectId: process.env.FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ Missing",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "✅ Loaded" : "❌ Missing",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? "✅ Loaded" : "❌ Missing",
    gmailUser: process.env.GMAIL_USER ? "✅ Loaded" : "❌ Missing",
  });
}