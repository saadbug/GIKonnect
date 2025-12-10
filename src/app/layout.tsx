import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation"; // <--- NEW IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GIKonnect",
  description: "Your Campus, Synchronized.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <AuthProvider>
          <div className="min-h-screen pb-20"> {/* Add padding for the dock */}
            {children}
          </div>
          <Navigation /> {/* <--- NEW COMPONENT */}
        </AuthProvider>
      </body>
    </html>
  );
}