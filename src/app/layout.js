import "./globals.css";
import { Jost } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import { Toaster } from "sonner";

const jost = Jost({ subsets: ["latin"] });

export const metadata = {
  title: "Actinova AI Tutor - Personalized Learning Platform",
  description: "Master any skill with AI-powered personalized learning paths",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jost.className} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
