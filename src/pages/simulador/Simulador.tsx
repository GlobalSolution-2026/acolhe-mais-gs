import { Link, Outlet } from "@tanstack/react-router";
import { FiActivity, FiHome, FiRotateCcw, FiSmartphone } from "react-icons/fi";
import { useSimulador } from "@/context/SimuladorContext";

const abas = [
  { to: "/simulador/cidadao", label: "Cidadão", icone: FiSmartphone },
  { to: "/simulador/recepcao", label: "Recepção UBS", icone: FiHome },
  { to: "/simulador/status-api", label: "Status da API", icone: FiActivity },
] as const;

export function Simulador() {
  const { reiniciarDemonstracao } = useSimulador();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-primaria">Simulador</h1>
        <button onClick={reiniciarDemonstracao} className="btn border border-borda bg-branco text-primaria hover:bg-mentaSuave">
          <FiRotateCcw /> Reiniciar demonstração
        </button>
      </div>
      <nav className="mb-6 flex gap-2 overflow-x-auto rounded-[12px] bg-branco p-1 shadow-leve" aria-label="Abas do simulador">
        {abas.map(({ to, label, icone: Icone }) => (
          <Link key={to} to={to}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-4 font-bold text-textoSuave hover:bg-fundo"
            activeProps={{ className: "bg-primaria text-branco hover:bg-primaria" }}>
            <Icone /> {label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-borda bg-branco p-10 text-center">
      <h2 className="text-xl font-bold text-primaria">{titulo}</h2>
      <p className="text-textoSuave">Em construção.</p>
    </div>
  );
}
