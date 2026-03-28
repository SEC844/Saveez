import DashboardShell from "@/components/dashboard/DashboardShell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/queries";
import ImprevuProgressCard from "@/components/dashboard/ImprevuProgressCard";
import AddImprevuModal from "@/components/dashboard/AddImprevuModal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImprevusPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);
  const { user, imprévusActifs, imprévusSoldés } = data;

  return (
    <DashboardShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Imprévus</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Gérez vos dépenses exceptionnelles et leur remboursement
          </p>
        </div>
        <AddImprevuModal objectifBase={user.objectifBase} />
      </div>

      {/* Actifs */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">En cours</h2>
          {imprévusActifs.length > 0 && (
            <Badge variant="secondary" className="text-xs rounded-lg">{imprévusActifs.length}</Badge>
          )}
        </div>

        {imprévusActifs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-10 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Aucun imprévu en cours</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Votre épargne est intacte !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {imprévusActifs.map((imp, i) => (
              <ImprevuProgressCard key={imp.id} imprevu={imp} delay={i * 0.05} />
            ))}
          </div>
        )}
      </section>

      {/* Soldés */}
      {imprévusSoldés.length > 0 && (
        <section>
          <Separator className="mb-6 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Soldés</h2>
            <Badge variant="secondary" className="text-xs rounded-lg">{imprévusSoldés.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {imprévusSoldés.map((imp, i) => (
              <ImprevuProgressCard key={imp.id} imprevu={imp} delay={i * 0.05} />
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
