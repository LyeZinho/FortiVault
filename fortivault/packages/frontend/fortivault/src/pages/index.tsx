import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import { Spinner } from '@chakra-ui/react'

export default function Home() {
  return (
    <main className={`flex min-h-screen items-center justify-center`}>
      <div className={`flex flex-col items-center space-y-4`}>
        <div className={`flex items-center space-x-4`}>
          <Image
            src="/vercel.svg"
            alt="Vercel Logo"
            width={72}
            height={16}
          />
          <Spinner size="lg" />
        </div>
      </div>
    </main>
  );
}
