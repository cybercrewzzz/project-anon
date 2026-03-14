"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import { apiClient } from "@providers/axios";

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { data } = await apiClient.post("/auth/login", {
        email,
        password,
      });

      Cookies.set("accessToken", data.accessToken, { path: "/" });
      Cookies.set("refreshToken", data.refreshToken, { path: "/" });
      Cookies.set(
        "auth",
        JSON.stringify({
          name: data.account.name || data.account.nickname,
          email: data.account.email,
          roles: data.account.roles,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.account.name || data.account.nickname)}&background=random`,
        }),
        { expires: 30, path: "/" },
      );

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Invalid email or password";
      return {
        success: false,
        error: {
          name: "LoginError",
          message,
        },
      };
    }
  },
  logout: async () => {
    const refreshToken = Cookies.get("refreshToken");
    const accessToken = Cookies.get("accessToken");

    if (refreshToken && accessToken) {
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore logout errors
      }
    }

    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("auth", { path: "/" });
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const accessToken = Cookies.get("accessToken");
    const auth = Cookies.get("auth");
    if (accessToken && auth) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser.roles;
    }
    return null;
  },
  getIdentity: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser;
    }
    return null;
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
