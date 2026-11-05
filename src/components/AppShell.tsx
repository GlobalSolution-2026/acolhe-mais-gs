import { Link, Outlet, useLocation, useRouter, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle, FiBarChart2, FiBell, FiCalendar, FiChevronLeft, FiClock, FiHome, FiList, FiUser, FiX,
} from "react-icons/fi";
import { useSimulador } from "@/context/SimuladorContext";
import { precisaConfirmar } from "@/services/regrasAgendamento";
import { ModoDemonstracao } from "./ModoDemonstracao";

const TELAS_RAIZ = [
  "/inicio", "/consultas", "/emergencia", "/avisos", "/perfil",
  "/recepcao/agenda", "/recepcao/pendentes", "/recepcao/lista-do-dia", "/recepcao/indicadores",
];

function Aba({ to, label, icone: Icone }: { to: NonNullable<LinkProps["to"]>; label: string; icone: IconType }) {
  return (
    <Link
      to={to}
      className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold"
      activeProps={{ className: "text-primaria" }}
      inactiveProps={{ className: "text-textoSuave" }}
    >
      <Icone size={22} />
      {label}
    </Link>
  );
}

function BarraCidadao() {
  return (
    <>
      <Aba to="/inicio" label="Início" icone={FiHome} />
      <Aba to="/consultas" label="Consultas" icone={FiCalendar} />
      <div className="flex flex-1 justify-center">
        <Link
          to="/emergencia"
          aria-label="Emergência"
          className="-mt-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-branco bg-gravidade-vermelho text-[11px] font-extrabold text-branco shadow-celular"
        >
          <FiAlertTriangle size={26} />
          Emergência
        </Link>
      </div>
      <Aba to="/avisos" label="Avisos" icone={FiBell} />
      <Aba to="/perfil" label="Perfil" icone={FiUser} />
    </>
  );
}

function BarraRecepcao() {
  return (
    <>
      <Aba to="/recepcao/agenda" label="Agenda" icone={FiCalendar} />
      <Aba to="/recepcao/pendentes" label="Pendentes" icone={FiClock} />
      <Aba to="/recepcao/lista-do-dia" label="Lista do dia" icone={FiList} />
      <Aba to="/recepcao/indicadores" label="Indicadores" icone={FiBarChart2} />
    </>
  );
}

function Folha({ onFechar, children }: { onFechar: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-primariaEscura/50" aria-label="Fechar" onClick={onFechar} />
      <div className="absolute bottom-0 w-full max-w-md rounded-t-[20px] bg-branco p-4 pb-6 shadow-celular">
        <div className="mb-2 flex justify-end">
          <button onClick={onFechar} className="flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-fundo" aria-label="Fechar">
            <FiX size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AppShell() {
  const router = useRouter();
  const { pathname } = useLocation();
  const { estado, selecionarUnidadeRecepcao } = useSimulador();
  const [demoAberto, setDemoAberto] = useState(false);
  const cidadao = estado.perfil === "CIDADAO";
  const raiz = TELAS_RAIZ.includes(pathname.replace(/\/$/, ""));
  const agora = new Date();
  const avisos = cidadao
    ? estado.consultas.filter((c) => c.cdCidadao === estado.cdCidadaoAtual && precisaConfirmar(c, agora)).length +
      estado.ofertas.filter((o) => o.status === "PENDENTE").length
    : estado.consultas.filter(
        (c) =>
          c.dsStatus === "AGENDADA" &&
          estado.horarios.some((h) => h.cdHorario === c.cdHorario && h.cdUnidade === estado.cdUnidadeRecepcao),
      ).length;
  const ubs = estado.unidades.filter((u) => u.tpUnidade === "UBS");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-borda bg-branco text-[18px]">
      <header className="sticky top-0 z-30 bg-primaria text-branco shadow-leve">
        <div className="flex h-16 items-center gap-1 px-2">
          <div className="w-12">
            {!raiz && (
              <button onClick={() => router.history.back()} className="flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura" aria-label="Voltar">
                <FiChevronLeft size={26} />
              </button>
            )}
          </div>
          <span className="text-xl font-extrabold">Acolhe<span className="text-menta">+</span></span>
          <button
            onClick={() => setDemoAberto(true)}
            className="ml-2 rounded-full bg-menta px-3 py-1 text-xs font-extrabold text-primariaEscura"
            aria-label="Perfil atual — abrir modo demonstração"
          >
            {cidadao ? "Cidadão" : "Recepção UBS"}
          </button>
          <Link
            to={cidadao ? "/avisos" : "/recepcao/pendentes"}
            className="relative ml-auto flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura"
            aria-label={`Avisos: ${avisos}`}
          >
            <FiBell size={24} />
            <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-menta px-1 text-xs font-extrabold text-primariaEscura">
              {avisos}
            </span>
          </Link>
        </div>
        {!cidadao && (
          <div className="px-3 pb-3">
            <label htmlFor="ubs" className="sr-only">UBS exibida</label>
            <select
              id="ubs"
              value={estado.cdUnidadeRecepcao}
              onChange={(e) => selecionarUnidadeRecepcao(Number(e.target.value))}
              className="min-h-12 w-full rounded-[12px] border-0 bg-primariaEscura px-3 text-base font-bold text-branco"
            >
              {ubs.map((u) => (
                <option key={u.cdUnidade} value={u.cdUnidade}>{u.nmUnidade}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 pb-44">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 items-end border-x border-t border-borda bg-branco px-2 pb-3 pt-1"
        aria-label={cidadao ? "Menu do cidadão" : "Menu da recepção"}
      >
        {cidadao ? <BarraCidadao /> : <BarraRecepcao />}
      </nav>

      {demoAberto && (
        <Folha onFechar={() => setDemoAberto(false)}>
          <ModoDemonstracao onConcluir={() => setDemoAberto(false)} />
        </Folha>
      )}
    </div>
  );
}
