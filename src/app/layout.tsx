import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { DocumentLanguage } from "./document-language";
import "./globals.css";

// The app's one font (DESIGN.md).
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hoi – Learn Swiss German",
  description: "Short, practical modules in Swiss German.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
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
