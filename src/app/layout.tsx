import React from "react";
import { Providers } from "@/store/providers";
import MyApp from "./app";
import "./global.css";
import { AuthProvider } from '@/contexts/AuthContext';
import localFont from 'next/font/local';

const plusJakarta = localFont({
  src: [
    { path: '../fonts/plus-jakarta/PlusJakartaSans-Light.ttf', weight: '300', style: 'normal' },
    { path: '../fonts/plus-jakarta/PlusJakartaSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/plus-jakarta/PlusJakartaSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/plus-jakarta/PlusJakartaSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/plus-jakarta/PlusJakartaSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: "Tokopandai",
  description: "Tokopandai Main kit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakarta.className}>
          <AuthProvider>
            <Providers>
              <MyApp>{children}</MyApp>
            </Providers>
          </AuthProvider>
      </body>
    </html>
  );
}
