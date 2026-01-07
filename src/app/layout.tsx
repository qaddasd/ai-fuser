import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import Script from "next/script";
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas"
});

export const metadata: Metadata = {
  title: "Fuser - AI Chat Interface",
  description: "Fuser is a powerful AI chat interface with multi-model support, image generation, and app building capabilities. Chat with AI models like GPT-4, Claude, Gemini, and more.",
  keywords: ["AI", "chatbot", "GPT", "Claude", "Gemini", "artificial intelligence", "chat", "app builder", "image generation"],
  authors: [{ name: "Fuser Team" }],
  openGraph: {
    title: "Fuser - AI Chat Interface",
    description: "Chat with multiple AI models, generate images, and build apps with Fuser.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuser - AI Chat Interface",
    description: "Chat with multiple AI models, generate images, and build apps with Fuser.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  applicationName: "Fuser",
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${bebasNeue.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground" suppressHydrationWarning>
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="006852fa-cadf-4865-9426-35b70f2f175b"
        />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "Fuser", "version": "1.0.0", "greeting": "hello"}'
        />
        <div className="noise-overlay" />
        <div className="grid-bg fixed inset-0 opacity-10 pointer-events-none" />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}