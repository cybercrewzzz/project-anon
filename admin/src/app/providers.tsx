"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { DevtoolsProvider } from "@providers/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import { dataProvider } from "@providers/data-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@refinedev/antd/dist/reset.css";
import { AppIcon } from "@components/app-icon";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import {
  DashboardOutlined,
  WarningOutlined,
  SolutionOutlined,
  UserOutlined,
  MessageOutlined,
} from "@ant-design/icons";

type Props = {
  defaultMode: "dark" | "light";
  children: React.ReactNode;
};

export default function Providers({ defaultMode, children }: Props) {
  return (
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
                  list: "/",
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
                    label: "Abuse Reports",
                    icon: <WarningOutlined />,
                  },
                },
                {
                  name: "volunteer-applications",
                  list: "/volunteer-applications",
                  show: "/volunteer-applications/show/:id",
                  meta: {
                    label: "Verifications",
                    icon: <SolutionOutlined />,
                  },
                },
                {
                  name: "accounts",
                  list: "/accounts",
                  show: "/accounts/show/:id",
                  meta: { label: "Accounts", icon: <UserOutlined /> },
                },
                {
                  name: "sessions",
                  list: "/sessions",
                  meta: {
                    label: "Session Logs",
                    icon: <MessageOutlined />,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "fatI3y-dOGV08-YzTIic",
                title: {
                  text: "Anora Admin",
                  icon: <AppIcon />,
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
  );
}
