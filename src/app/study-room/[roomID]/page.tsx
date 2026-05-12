"use client";

import { useEffect, useRef, use } from "react"; 
// Notice: We removed the top-level ZegoCloud import!
import { useAuth } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

export default function StudyRoom({ params }: { params: Promise<{ roomID: string }> }) {
  const { user, userProfile, loading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedParams = use(params);
  const roomID = resolvedParams.roomID;

  useEffect(() => {
    if (!user || !userProfile || !containerRef.current || !roomID) return;

    const initializeMeeting = async () => {
      // 🚨 THE FIX: Dynamically import ZegoCloud only when the browser is ready!
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

      const appID = 1572748723; // Replace with your number
      const serverSecret = "de2ef12bebe21a4da671207f793b25d3"; // Replace with your string

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID, 
        user.id, 
        userProfile.fullName 
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall, 
        },
        showScreenSharingButton: true, 
      });
    };

    initializeMeeting();
  }, [user, userProfile, roomID]);

  if (loading) return <PageLoader text="Connecting to Secure Server..." />;

  return (
    <div className="h-screen w-full bg-slate-950">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}