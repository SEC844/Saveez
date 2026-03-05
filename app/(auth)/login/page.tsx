import LoginForm from "./LoginForm";
import ClearSession from "./ClearSession";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connexion – Épargne",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  // Cookie JWT valide mais user supprimé en DB → effacer la session côté client
  if (params.error === "session") {
    return <ClearSession />;
  }

  // First visit : no account exists yet → go to setup
  const count = await prisma.user.count();
  if (count === 0) redirect("/setup");

  return <LoginForm />;
}
