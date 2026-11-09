import { DOENCAS_BASE } from "@/data/contaDemo";
import type { Cidadao, FichaSaude } from "@/types";

export function textoDoencas(f: FichaSaude): string {
  return f.dsDoencasBase
    .map((cd) => (cd === "OUTRA" ? f.dsOutraDoenca.trim() || "Outra" : DOENCAS_BASE.find((d) => d.cd === cd)?.nm ?? cd))
    .join(", ");
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p>
      <span className="block text-sm font-semibold text-textoSuave">{rotulo}</span>
      <span className="font-bold">{valor || "Não informado"}</span>
    </p>
  );
}

/** Resumo da ficha de saúde (perfil e emergência). */
export function ResumoFicha({ ficha, cidadao, contato = false }: { ficha: FichaSaude; cidadao: Cidadao; contato?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Item rotulo="Doenças de base" valor={textoDoencas(ficha)} />
      <Item rotulo="Medicamentos de uso contínuo" valor={ficha.medicamentos.map((m) => (m.dsDose ? `${m.nmMedicamento} (${m.dsDose})` : m.nmMedicamento)).join("; ")} />
      <Item rotulo="Alergias" valor={ficha.dsAlergias} />
      <Item rotulo="Tipo sanguíneo" valor={ficha.dsTipoSanguineo === "NAO_SEI" ? "Não sabe" : ficha.dsTipoSanguineo} />
      {contato && <Item rotulo="Contato de emergência" valor={cidadao.nmContatoRecado ? `${cidadao.nmContatoRecado} · ${cidadao.nrContatoRecado}` : ""} />}
    </div>
  );
}
