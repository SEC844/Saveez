import SetupForm from "./SetupForm";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Création de compte – Saveez",
};

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return <SetupForm />;
}
