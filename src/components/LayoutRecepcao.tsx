import { FiBarChart2, FiCalendar, FiClock, FiList } from "react-icons/fi";
import { Aba, LayoutCompartilhado } from "./LayoutCompartilhado";

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


export function LayoutRecepcao() {
  return <LayoutCompartilhado cidadao={false} barra={<BarraRecepcao />} />;
}
