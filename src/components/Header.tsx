import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { MenuMobile } from "./MenuMobile";

export const linksSite = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/solucao", label: "Solução" },
  { to: "/simulador", label: "Simulador" },
  { to: "/faq", label: "FAQ" },
  { to: "/integrantes", label: "Integrantes" },
  { to: "/contato", label: "Contato" },
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-2xl font-extrabold tracking-tight ${className}`}>
      Acolhe<span className="text-menta">+</span>
    </span>
  );
}

export function Header() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-primaria text-branco shadow-leve">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" aria-label="Acolhe+ — início">
          <Logo />
        </Link>
        <nav className="hidden gap-1 lg:flex" aria-label="Principal">
          {linksSite.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-[12px] px-3 py-2 font-semibold hover:bg-primariaEscura"
              activeProps={{ className: "bg-primariaEscura text-menta" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura lg:hidden"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
        >
          <FiMenu size={26} />
        </button>
      </div>
      <MenuMobile aberto={aberto} onFechar={() => setAberto(false)} />
    </header>
  );
}
