import type { Metadata } from "next";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tiemchena.com"),
  title: "Tiệm Chè Na - Nem Nướng Nha Trang, Mỳ Trộn Cay & Chè Xoài Caramen",
  description: "Đặt món trực tuyến tại Tiệm Chè Na (Vũ Lăng, Ngũ Hiệp, Thanh Trì). Nem nướng 35k, Mỳ trộn sốt cay 35k, Chân gà sốt Thái 35k, Chè xoài caramen 30k. Giao nóng giòn trong 30 phút!",
  keywords: ["tiệm chè na", "nem nướng ngũ hiệp", "mỳ trộn thanh trì", "chè xoài caramen", "ăn vặt thanh trì", "tiemchena"],
  icons: [
    { rel: "icon", url: "/logo.png?v=3" },
    { rel: "shortcut icon", url: "/logo.png?v=3" },
    { rel: "apple-touch-icon", url: "/logo.png?v=3" },
  ],
  openGraph: {
    title: "Tiệm Chè Na - Đồ Ăn Vặt & Chè Thanh Mát Chuẩn Vị",
    description: "Giao nóng giòn 30 phút khu vực Thanh Trì. Đặt món nhanh chóng và tiện lợi!",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white min-h-screen flex flex-col">
        <ToastProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
