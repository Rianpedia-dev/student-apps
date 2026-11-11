import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Source_Code_Pro, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GlobalBackground } from "@/components/shared/global-background";
import { NetworkProvider } from "@/components/shared/network-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Student Apps - SD - SMP Islam Al-Azhar Cairo Palembang",
    template: "%s | Student Apps - SD - SMP",
  },
  description: "Student Apps SD - SMP Islam Al-Azhar Cairo Palembang",
  icons: {
    icon: "/images/logo-alazhar-cairo.avif",
    shortcut: "/images/logo-alazhar-cairo.avif",
    apple: "/images/logo-alazhar-cairo.avif",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      dir="ltr"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} ${sourceCodePro.variable} ${poppins.variable} h-full antialiased`}
    >
      <body dir="ltr" className="min-h-full flex flex-col font-sans bg-transparent text-foreground relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <NetworkProvider>
            <GlobalBackground />
          {children}
            <Toaster richColors position="top-right" />
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
