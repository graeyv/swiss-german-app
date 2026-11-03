import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { DocumentLanguage } from "./document-language";
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
  title: "Grüezi – Learn Swiss German",
  description: "Short, practical lessons in Swiss German.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Browser extensions such as LanguageTool add attributes to this tag before React loads.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <CurrentLanguage />
        </Suspense>
      </body>
    </html>
  );
}

async function CurrentLanguage() {
  return <DocumentLanguage locale={await getLocale()} />;
}
