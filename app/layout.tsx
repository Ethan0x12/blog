import { Metadata } from "next";
import "./globals.css"; // 引入全局样式表
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "JAMX BLOG",
  description:
    "Hello, I'm jamx, a seasoned Senior Front-End Engineer with nearly a decade of experience in the field.",
  authors: [{ name: "jamx", url: "https://jamx.tech" }],
  openGraph: {
    type: "website",
    title: "JAMX BLOG",
    description: "前端开发博客，分享技术经验与见解",
    siteName: "JAMX BLOG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="cn">
      <body className="min-h-screen flex flex-col">
        {/* 导航栏 */}
        <Header />

        {/* 主要内容 */}
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>

        {/* 页脚 */}
        <Footer />
      </body>
    </html>
  );
}
