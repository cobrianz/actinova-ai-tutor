import "./globals.css";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import ToasterClient from "./components/ToasterClient";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
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
    <html lang="en" dir="ltr" className={`${inter.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning={true}
        dir="ltr"
      >
        <AuthProvider>
          {children}
          <ToasterClient />
        </AuthProvider>
      </body>
    </html>
  );
}
