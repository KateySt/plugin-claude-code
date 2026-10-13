import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BundleProvider } from "@/components/bundle/BundleProvider";
import { bundleSourceFrom } from "@/lib/bundle/settings";
import { getCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t("site.title"),
  description: t("site.tagline"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BundleProvider source={bundleSourceFrom(getCatalog())}>{children}</BundleProvider>
      </body>
    </html>
  );
}
