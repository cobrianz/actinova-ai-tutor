import "./globals.css";
import { Jost, Bricolage_Grotesque, EB_Garamond } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
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

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata = {
  title: "Actirova AI Tutor - Personalized Learning Platform",
  description: "Master any skill with AI-powered personalized learning paths",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${jost.variable} ${bricolage.variable} ${ebGaramond.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme = saved || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    // Force a consistent state if null
                    if (!saved) localStorage.setItem('theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans antialiased selection:bg-primary/30 selection:text-primary-foreground"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ToasterClient />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
