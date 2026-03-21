import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import { Refine } from "@refinedev/core";
import { DevtoolsProvider } from "@providers/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import {
  DashboardOutlined,
  FlagOutlined,
  SolutionOutlined,
  TeamOutlined,
  MessageOutlined,
} from "@ant-design/icons";

import { dataProvider } from "@providers/data-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@refinedev/antd/dist/reset.css";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Anora Admin",
  description: "Anora App Admin Dashboard",
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
        <Suspense>
          <RefineKbarProvider>
            <AntdRegistry>
              <ColorModeContextProvider defaultMode={defaultMode}>
                <DevtoolsProvider>
                  <Refine
                    routerProvider={routerProvider}
                    dataProvider={dataProvider}
                    notificationProvider={useNotificationProvider}
                    authProvider={authProviderClient}
                    resources={[
                      {
                        name: "dashboard",
                        list: "/dashboard",
                        meta: {
                          label: "Dashboard",
                          icon: <DashboardOutlined />,
                        },
                      },
                      {
                        name: "reports",
                        list: "/reports",
                        show: "/reports/show/:id",
                        meta: {
                          icon: <FlagOutlined />,
                        },
                      },
                      {
                        name: "volunteer-applications",
                        list: "/volunteer-applications",
                        show: "/volunteer-applications/show/:id",
                        meta: {
                          label: "Applications",
                          icon: <SolutionOutlined />,
                        },
                      },
                      {
                        name: "accounts",
                        list: "/accounts",
                        show: "/accounts/show/:id",
                        meta: {
                          icon: <TeamOutlined />,
                        },
                      },
                      {
                        name: "sessions",
                        list: "/sessions",
                        meta: {
                          icon: <MessageOutlined />,
                        },
                      },
                    ]}
                    options={{
                      syncWithLocation: true,
                      warnWhenUnsavedChanges: true,
                      projectId: "7fsHuo-qrDnml-AgIy9A",
                      title: {
                        text: (
                          <div
                            style={{ paddingTop: "8px", paddingLeft: "6px" }}
                          >
                            Admin Dashboard
                          </div>
                        ),
                        icon: (
                          <Image
                            src="/anora.png"
                            alt="Anora Logo"
                            width={32}
                            height={32}
                          />
                        ),
                      },
                    }}
                  >
                    {children}
                    <RefineKbar />
                  </Refine>
                </DevtoolsProvider>
              </ColorModeContextProvider>
            </AntdRegistry>
          </RefineKbarProvider>
        </Suspense>
      </body>
    </html>
  );
}
