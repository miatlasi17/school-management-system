import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by the middleware. No Node.js-only imports
// (bcrypt, Prisma) are allowed here — the middleware runs on the Edge runtime.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isProtected =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/student");

      if (!isProtected) return true;
      if (!isLoggedIn) return false;

      const role = auth.user.role;
      if (pathname.startsWith("/admin") && role !== "ADMIN") return false;
      if (pathname.startsWith("/teacher") && role !== "TEACHER") return false;
      if (pathname.startsWith("/student") && role !== "STUDENT") return false;

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "TEACHER" | "STUDENT";
      }
      return session;
    },
  },
  providers: [], // configured in auth.ts (Node runtime)
};
