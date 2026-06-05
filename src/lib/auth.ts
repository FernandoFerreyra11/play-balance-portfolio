import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, families, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  parentId?: string | null;
  familyId?: string | null;
  organizationId?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email/Usuario", type: "text" },
        password: { label: "Password", type: "password" },
        familyCode: { label: "Código de Familia", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales faltantes");
        }

        let user;

        if (credentials.familyCode) {
          // Búsqueda por Nombre + Código de Familia (para niños)
          const [result] = await db
             .select({
               user: users,
               family: families
             })
            .from(users)
            .innerJoin(families, eq(users.familyId, families.id))
            .where(
              and(
                eq(users.name, credentials.email),
                eq(families.code, credentials.familyCode.toUpperCase())
              )
            )
            .limit(1);
          
          if (result) user = result.user;
        } else {
          // Búsqueda por Email (para padres) - Normalizado a minúsculas
          const normalizedEmail = credentials.email.toLowerCase().trim();
          const [result] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);
          
          user = result;
        }

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado o código de familia inválido");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          parentId: user.parentId,
          familyId: user.familyId,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.role = customUser.role;
        token.parentId = customUser.parentId;
        token.familyId = customUser.familyId;
        token.organizationId = customUser.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as {
          id?: string;
          role?: string | null;
          parentId?: string | null;
          familyId?: string | null;
          organizationId?: string | null;
        };
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string | null;
        sessionUser.parentId = token.parentId as string | null;
        sessionUser.familyId = token.familyId as string | null;
        sessionUser.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
};
