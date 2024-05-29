import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import {PropsWithChildren} from "react";
import {cn} from "@/classname";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fraunces"
})

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={cn(fraunces.variable)}>{children}</body>
    </html>
  );
}
