import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, families } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
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
        token.id = user.id;
        token.role = (user as any).role;
        token.parentId = (user as any).parentId;
        token.familyId = (user as any).familyId;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).parentId = token.parentId;
        (session.user as any).familyId = token.familyId;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
};
