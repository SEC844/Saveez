import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Création de compte – Saveez",
};

export default async function SetupPage() {
  return <SetupForm />;
}
