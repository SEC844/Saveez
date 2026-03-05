"use server";

import { signIn } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }

  // Rate limit by IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  try {
    await checkRateLimit(ip);
  } catch {
    return {
      error: "Trop de tentatives. Réessayez dans 15 minutes.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    // signIn throws a NEXT_REDIRECT — let it propagate
    throw error;
  }

  return null;
}
