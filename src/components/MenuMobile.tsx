import { Link } from "@tanstack/react-router";
import { FiX } from "react-icons/fi";
import { linksSite, Logo } from "./Header";

export function MenuMobile({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-primariaEscura/60" onClick={onFechar} aria-label="Fechar menu" />
      <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-primaria p-4 shadow-leve">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button className="flex h-12 w-12 items-center justify-center rounded-[12px] hover:bg-primariaEscura" onClick={onFechar} aria-label="Fechar menu">
            <FiX size={26} />
          </button>
        </div>
        {linksSite.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={onFechar}
            activeOptions={{ exact: l.to === "/" }}
            className="flex min-h-12 items-center rounded-[12px] px-4 text-lg font-semibold hover:bg-primariaEscura"
            activeProps={{ className: "bg-primariaEscura text-menta" }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
