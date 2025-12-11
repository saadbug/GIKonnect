import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, code } = body;

    // --- DEBUG LOGS (Check your VS Code Terminal) ---
    console.log("🔍 Verify Request Received:");
    console.log("   - UID:", uid);
    console.log("   - Code:", code);
    // ------------------------------------------------

    // 1. Validate Input
    if (!uid || !code) {
      console.log("❌ Missing Data: uid or code is empty");
      return NextResponse.json({ error: "Missing User ID (uid) or Verification Code" }, { status: 400 });
    }

    // 2. Get the stored code from Firestore
    const docRef = adminDb.collection("otp_codes").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log("❌ No OTP found for this UID. It might have expired or never sent.");
      return NextResponse.json({ error: "Invalid or expired code. Please request a new one." }, { status: 400 });
    }

    const data = docSnap.data();
    console.log("   - Stored Code:", data?.code);

    // 3. Validate Match
    if (data?.code !== code) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // 4. Validate Expiry
    if (new Date() > data.expiresAt.toDate()) {
      return NextResponse.json({ error: "Code has expired. Please signup again." }, { status: 400 });
    }

    // 5. SUCCESS: Verify the user
    await adminAuth.updateUser(uid, {
      emailVerified: true,
    });

    console.log("✅ User Verified Successfully!");

    // 6. Cleanup
    await docRef.delete();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Verification Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}