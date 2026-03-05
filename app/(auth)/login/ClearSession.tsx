"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * Composant invisible : quand le JWT est valide mais l'user n'existe plus en DB,
 * on efface le cookie de session côté client puis on recharge la page proprement.
 */
export default function ClearSession() {
  useEffect(() => {
    signOut({ redirect: true, callbackUrl: "/login" });
  }, []);

  return null;
}
