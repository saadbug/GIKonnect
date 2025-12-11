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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              
              <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08); overflow: hidden;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); height: 8px;"></td>
                </tr>
      
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h2 style="margin: 0; color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">GIKonnect</h2>
                      <p style="margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Campus Synchronized</p>
                    </div>
      
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="margin: 0 0 12px; color: #0f172a; font-size: 24px; font-weight: 700;">Verify your identity</h1>
                      <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.6;">
                        Use the code below to complete your sign up. <br>This code is secure and expires in 15 minutes.
                      </p>
                    </div>
      
                    <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                      <span style="display: block; color: #2563EB; font-size: 36px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
      
                    <div style="text-align: center; margin-bottom: 0;">
                      <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                        If you didn't request this code, you can safely ignore this email. Someone else might have typed your email by mistake.
                      </p>
                    </div>
      
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600;">SECURE LOGIN</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} GIKonnect. All rights reserved.<br>
                      Ghulam Ishaq Khan Institute
                    </p>
                  </td>
                </tr>
      
              </table>
            </td>
          </tr>
        </table>
      
      </body>
      </html>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}