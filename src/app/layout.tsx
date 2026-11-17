import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxFlow AI — Obsidian Voice Retail OS & Digital Ledger",
  description: "Next-generation Voice Ledger, Smart Billing, and Inventory Copilot for Indian Retailers",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎙️</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070B14] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-x-hidden">
        {/* Full-Screen Animated Aurora Dark Mesh Blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Electric Emerald Glow */}
          <div className="absolute -top-32 left-1/4 w-[650px] h-[500px] rounded-full bg-emerald-500/[0.14] blur-[150px] aurora-blob-1" />
          {/* Electric Indigo Glow */}
          <div className="absolute top-1/4 -right-20 w-[600px] h-[550px] rounded-full bg-indigo-500/[0.14] blur-[160px] aurora-blob-2" />
          {/* Subtle Deep Teal Center Anchor */}
          <div className="absolute bottom-10 left-1/3 w-[700px] h-[500px] rounded-full bg-teal-500/[0.08] blur-[170px]" />
          {/* Fine Grid Mesh Pattern Overlay for Texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
