import type { AuthProvider } from "@refinedev/core";
import { cookies } from "next/headers";

export const authProviderServer: Pick<AuthProvider, "check"> = {
  check: async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken");
    const auth = cookieStore.get("auth");

    if (accessToken && auth) {
      try {
        const parsedUser = JSON.parse(auth.value);
        const roles: string[] = parsedUser.roles || [];

        // Verify user has admin role
        if (!roles.includes("admin")) {
          return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
          };
        }

        return {
          authenticated: true,
        };
      } catch {
        // Invalid auth cookie
      }
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },
};
