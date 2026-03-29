import SetupForm from "./SetupForm";
import { prisma } from "@/lib/db";
import { isRegistrationEnabled } from "@/lib/app-settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Création de compte – Saveez",
};

export default async function SetupPage() {
  const count = await prisma.user.count();

  // Premier utilisateur — bootstrapping, toujours autorisé
  if (count === 0) {
    return <SetupForm />;
  }

  // Vérifier si l'inscription est activée
  const regEnabled = await isRegistrationEnabled();
  if (!regEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white shadow-lg mx-auto">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              Inscription désactivée
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              La création de nouveaux comptes est temporairement désactivée par l&apos;administrateur.
              Contactez un administrateur pour obtenir un accès.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return <SetupForm />;
}
