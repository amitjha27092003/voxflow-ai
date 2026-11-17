import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxFlow AI — Voice Retail OS & Digital Ledger",
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
    <html lang="en">
      <body className="min-h-screen bg-[#F5F7FB] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
        {/* Living Ambient Mesh Gradients (Emerald-500/10 and Indigo-500/10) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[400px] rounded-full bg-emerald-500/10 blur-[130px]" />
          <div className="absolute -top-40 right-1/4 w-[550px] h-[420px] rounded-full bg-indigo-500/10 blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-teal-500/5 blur-[160px]" />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
