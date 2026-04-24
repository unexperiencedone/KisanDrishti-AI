import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KisanDrishti AI | RS GreenGrow",
  description: "सही समय, सही निर्णय, बेहतर उपज | Precision STCR Agronomy",
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-100 sm:bg-slate-200`}
    >
      <body className="min-h-screen flex items-center justify-center">
        <div className="w-full h-full sm:max-w-md sm:h-[90dvh] sm:rounded-[2.5rem] bg-white relative overflow-hidden shadow-2xl sm:border-[8px] sm:border-slate-800 flex flex-col font-sans">
          {children}
        </div>
      </body>
    </html>
  );
}
