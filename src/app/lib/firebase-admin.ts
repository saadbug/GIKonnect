import admin from "firebase-admin";

console.log("🔥 Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("📧 Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fixes the newline issue in environment variables
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();