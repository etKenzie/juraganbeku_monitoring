import React from "react";
import { Providers } from "@/store/providers";
import MyApp from "./app";
import "./global.css";
import { AuthProvider } from '@/contexts/AuthContext';


export const metadata = {
  title: "Tokopandai",
  description: "Tokopandai Main kit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <AuthProvider>
            <Providers>
              <MyApp>{children}</MyApp>
            </Providers>
          </AuthProvider>
      </body>
    </html>
  );
}
