"use client";

export default function AnimatedLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  // Define sizing classes
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-50 h-50", 
  };

  return (
    // We add select-none to stop highlighting
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center select-none`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        // 👇 ADDED: pointer-events-none (Disables all clicking/hovering)
        // 👇 ADDED: onContextMenu (Disables right-click menu just to be safe)
        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(37,99,235,0.4)] pointer-events-none"
        onContextMenu={(e) => e.preventDefault()} 
      >
        <source src="/logo-anim.webm" type="video/webm" />
        <img src="/logo.png" alt="GIKonnect Logo" className="w-full h-full object-contain" />
      </video>
    </div>
  );
}