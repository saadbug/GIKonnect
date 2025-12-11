import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminDb } from "@/app/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, uid } = await request.json();

    if (!email || !uid) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // 1. Generate 6-digit Code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to Firestore (Expires in 15 mins)
    await adminDb.collection("otp_codes").doc(uid).set({
      code: otp,
      email: email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    // 3. Configure Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD?.replace(/ /g, ""),
      },
    });

    // 4. Send Email
    await transporter.sendMail({
      from: `"GIKonnect Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome to GIKonnect!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #2563EB; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>Expires in 15 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}