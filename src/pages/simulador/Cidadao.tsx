import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { FiAlertTriangle, FiBell, FiCalendar, FiChevronLeft, FiHome, FiUser } from "react-icons/fi";
import type { IconType } from "react-icons";
import { useSimulador } from "@/context/SimuladorContext";

function AbaCelular({ to, label, icone: Icone }: { to: "/simulador/cidadao/inicio" | "/simulador/cidadao/consultas" | "/simulador/cidadao/avisos" | "/simulador/cidadao/perfil"; label: string; icone: IconType }) {
  return (
    <Link to={to} className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold"
      activeProps={{ className: "text-primaria" }}
      inactiveProps={{ className: "text-textoSuave" }}>
      <Icone size={22} />
      {label}
    </Link>
  );
}

export function Cidadao() {
  const router = useRouter();
  const { estado } = useSimulador();
  const avisos = estado.consultas.filter((c) => c.dsStatus === "AGENDADA").length;

  return (
    <div className="flex justify-center">
      <div className="relative h-[760px] w-[370px] rounded-[48px] border-[10px] border-primariaEscura bg-primariaEscura shadow-celular">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-primariaEscura" />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-fundo text-[18px]">
          <header className="flex items-center justify-between bg-primaria px-3 pb-3 pt-8 text-branco">
            <button onClick={() => router.history.back()} className="flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura" aria-label="Voltar">
              <FiChevronLeft size={26} />
            </button>
            <span className="text-xl font-extrabold">Acolhe<span className="text-menta">+</span></span>
            <Link to="/simulador/cidadao/avisos" className="relative flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura" aria-label={`Avisos: ${avisos}`}>
              <FiBell size={24} />
              <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-menta px-1 text-xs font-extrabold text-primariaEscura">{avisos}</span>
            </Link>
          </header>
          <main className="flex-1 overflow-y-auto p-4 pb-28">
            <Outlet />
          </main>
          <nav className="absolute inset-x-0 bottom-0 flex items-end border-t border-borda bg-branco px-2 pb-3 pt-1" aria-label="Abas do aplicativo">
            <AbaCelular to="/simulador/cidadao/inicio" label="Início" icone={FiHome} />
            <AbaCelular to="/simulador/cidadao/consultas" label="Consultas" icone={FiCalendar} />
            <div className="flex flex-1 justify-center">
              <Link to="/simulador/cidadao/emergencia" aria-label="Emergência"
                className="-mt-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-branco bg-gravidade-vermelho text-[11px] font-extrabold text-branco shadow-celular">
                <FiAlertTriangle size={26} />
                Emergência
              </Link>
            </div>
            <AbaCelular to="/simulador/cidadao/avisos" label="Avisos" icone={FiBell} />
            <AbaCelular to="/simulador/cidadao/perfil" label="Perfil" icone={FiUser} />
          </nav>
        </div>
      </div>
    </div>
  );
}

export function TelaCelular({ titulo }: { titulo: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-primaria">{titulo}</h2>
      <p className="mt-2 text-textoSuave">Em construção.</p>
    </div>
  );
}
