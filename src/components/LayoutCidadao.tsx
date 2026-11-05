import { Link } from "@tanstack/react-router";
import { FiAlertTriangle, FiBell, FiCalendar, FiHome, FiUser } from "react-icons/fi";
import { Aba, LayoutCompartilhado } from "./LayoutCompartilhado";

function BarraCidadao() {
  return (
    <>
      <Aba to="/cidadao/inicio" label="Início" icone={FiHome} />
      <Aba to="/cidadao/consultas" label="Consultas" icone={FiCalendar} />
      <div className="flex flex-1 justify-center">
        <Link
          to="/cidadao/emergencia"
          aria-label="Emergência"
          className="-mt-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-branco bg-gravidade-vermelho text-[11px] font-extrabold text-branco shadow-celular"
        >
          <FiAlertTriangle size={26} />
          Emergência
        </Link>
      </div>
      <Aba to="/cidadao/avisos" label="Avisos" icone={FiBell} />
      <Aba to="/cidadao/perfil" label="Perfil" icone={FiUser} />
    </>
  );
}

export function LayoutCidadao() {
  return <LayoutCompartilhado cidadao=true barra={<BarraCidadao />} />;
}
