import "./globals.css";
import { Jost, Bricolage_Grotesque, EB_Garamond } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import ToasterClient from "./components/ToasterClient";
import InstallPrompt from "./components/InstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleOAuthProvider } from "@react-oauth/google";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://actirova.com"),
  title: {
    default: "Actirova AI Tutor - Personalized Learning Platform",
    template: "%s | Actirova AI",
  },
  description: "Master any skill with AI-powered personalized learning paths, instant feedback, and dynamic courses. Your smartest AI tutor.",
  keywords: ["AI tutor", "personalized learning", "online courses", "AI education", "skill mastery", "flashcards", "study tools"],
  authors: [{ name: "Actirova" }],
  creator: "Actirova",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://actirova.com",
    title: "Actirova AI Tutor - Personalized Learning Platform",
    description: "Master any skill with AI-powered personalized learning paths.",
    siteName: "Actirova AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Actirova AI Tutor",
    description: "Master any skill with our cutting-edge AI personalized learning platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${jost.variable} ${bricolage.variable} ${ebGaramond.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased selection:bg-primary/30 selection:text-primary-foreground"
        suppressHydrationWarning={true}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
            <ToasterClient />
            <InstallPrompt />
            <SpeedInsights />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
