import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const description =
    "Registra tus entrenamientos, entiende tu progreso y recibe recomendaciones explicables.";

  return {
    metadataBase,
    title: {
      default: "Entrena — progreso con criterio",
      template: "%s · Entrena",
    },
    description,
    applicationName: "Entrena",
    openGraph: {
      type: "website",
      locale: "es_CL",
      siteName: "Entrena",
      title: "Entrena — progreso con criterio",
      description,
      images: [
        {
          url: new URL("/og.png", metadataBase).toString(),
          width: 1659,
          height: 948,
          alt: "Entrena — Progreso con criterio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Entrena — progreso con criterio",
      description,
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f3f1ea",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
