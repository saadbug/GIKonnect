import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, code } = body;

    // --- SERVER LOGS (Check VS Code Terminal) ---
    console.log("🔍 [Verify API] Request Received:");
    console.log("   - UID:", uid);
    console.log("   - Code Input:", code);
    // -------------------------------------------

    // 1. Validate Input Presence
    if (!uid || !code) {
      console.log("❌ [Verify API] Missing Data: uid or code is empty");
      return NextResponse.json({ error: "Missing User ID (uid) or Verification Code" }, { status: 400 });
    }

    // 2. Get the stored code from Firestore
    const docRef = adminDb.collection("otp_codes").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log("❌ [Verify API] No OTP found in database for this UID.");
      return NextResponse.json({ error: "Invalid or expired code. Please request a new one." }, { status: 400 });
    }

    const data = docSnap.data();

    // 🛑 TYPESCRIPT FIX: Explicitly check if data is undefined
    if (!data) {
        return NextResponse.json({ error: "System Error: OTP data is corrupted." }, { status: 500 });
    }

    console.log("   - Database stored code:", data?.code);

    // 3. Validate Match
    if (String(data?.code).trim() !== String(code).trim()) {
      console.log("❌ [Verify API] Code Mismatch!");
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // 4. Validate Expiry
    // We use optional chaining here just to be double-safe
    if (data.expiresAt && new Date() > data.expiresAt.toDate()) {
      console.log("❌ [Verify API] Code Expired.");
      return NextResponse.json({ error: "Code has expired. Please signup again." }, { status: 400 });
    }

    // 5. SUCCESS: Verify the user
    await adminAuth.updateUser(uid, {
      emailVerified: true,
    });

    console.log("✅ [Verify API] User Verified Successfully!");

    // 6. Cleanup (Delete used code)
    await docRef.delete();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 [Verify API] Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}