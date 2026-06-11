import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "SkillSwap - Connect, Learn & Grow Together",
  description:
    "A mentorship connector platform where you can swap skills, find mentors, and grow together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
