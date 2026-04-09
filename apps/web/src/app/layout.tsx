import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "agenda-clubber",
  description: "Coordenação da cena eletrônica do Ceará",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
