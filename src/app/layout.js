import "./globals.css";
import { Jost, Bricolage_Grotesque } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import ToasterClient from "./components/ToasterClient";

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

export const metadata = {
  title: "Actinova AI Tutor - Personalized Learning Platform",
  description: "Master any skill with AI-powered personalized learning paths",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${jost.variable} ${bricolage.variable}`}>
      <body
        className="font-sans antialiased selection:bg-primary/30 selection:text-primary-foreground"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
          <ToasterClient />
        </AuthProvider>
      </body>
    </html>
  );
}
