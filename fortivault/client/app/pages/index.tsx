import Image from "next/image";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import Header from "@/compoents/index/Header";
import EnterButtons from "@/compoents/index/Enter";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-20">
      <div className="flex flex-col items-center">
        <Header />
      </div>
      <div className="flex flex-col items-center">
        <EnterButtons />
      </div>
    </div>
  );
}
