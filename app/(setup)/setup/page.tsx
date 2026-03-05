import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Création de compte – Épargne",
};

export default async function SetupPage() {
  // If a user already exists, redirect to login
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return <SetupForm />;
}
