import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Project Anon Admin",
  description: "Moderation portal for Project Anon",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Providers defaultMode={defaultMode}>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}

