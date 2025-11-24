import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { LanguageProvider } from "@/context/language-context";

// Suppress browser extension errors
import "@/lib/suppress-errors";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "GrainTrust - Agricultural Traceability Platform",
  description: "Ensuring agricultural product authenticity through blockchain-powered traceability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </I18nProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
