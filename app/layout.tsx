import type { Metadata, Viewport } from "next";
import { Dancing_Script, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const script = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Pentru tine",
  description: "Un buchet de flori, doar pentru tine.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pentru tine",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#12071a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${script.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
