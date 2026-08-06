import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sportSans = Sora({
  variable: "--font-sport-sans",
  subsets: ["latin"],
  display: "swap",
});

const sportMono = IBM_Plex_Mono({
  variable: "--font-sport-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    "Max Level te ayuda a registrar entrenamientos, entender tu progreso y alcanzar tu máximo nivel.";

  return {
    metadataBase,
    title: {
      default: "Max Level — alcanza tu máximo nivel",
      template: "%s · Max Level",
    },
    description,
    applicationName: "Max Level",
    openGraph: {
      type: "website",
      locale: "es_CL",
      siteName: "Max Level Fitness",
      title: "Max Level — alcanza tu máximo nivel",
      description,
      images: [
        {
          url: new URL("/max-level-logo.png", metadataBase).toString(),
          width: 791,
          height: 759,
          alt: "Max Level Fitness",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Max Level — alcanza tu máximo nivel",
      description,
      images: [new URL("/max-level-logo.png", metadataBase).toString()],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b1020",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sportSans.variable} ${sportMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
