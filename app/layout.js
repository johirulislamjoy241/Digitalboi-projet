import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hind = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Digiboi — আপনার ব্যবসার ডিজিটাল সহকারী",
  description: "Bangladesh-এর সেরা POS ও Shop Management SaaS",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF5722",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={hind.className}>{children}</body>
    </html>
  );
}
