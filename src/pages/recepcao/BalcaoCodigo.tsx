import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiClipboard } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDia } from "@/lib/datas";
import { buscarOrientacao } from "@/services/api";
import { avaliarCodigo, type OrientacaoBalcao } from "@/services/balcao";
import type { Orientacao } from "@/types/orientacao";

type Aviso = { tipo: "VENCIDA" | "JA_UTILIZADA"; orientacao: Orientacao } | null;

export function BalcaoCodigo({ onSeguir, onFazerAqui }: { onSeguir: (d: OrientacaoBalcao) => void; onFazerAqui: () => void }) {
  const { obterEstado } = useSimulador();
  const { register, handleSubmit, formState: { errors } } = useForm<{ codigo: string }>();
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);

  const buscar = handleSubmit(async ({ codigo }) => {
    setBuscando(true);
    setErro(null);
    setAviso(null);
    try {
      const o = await buscarOrientacao(Number(codigo));
      const r = avaliarCodigo(o.cdOrientacao, [o], obterEstado().consultas, new Date());
      if (r.tipo === "VENCIDA" || r.tipo === "JA_UTILIZADA") setAviso(r);
      else if (r.tipo === "INEXISTENTE") setErro("Código não encontrado. Confira o número com o cidadão.");
      else onSeguir({ orientacao: r.orientacao, sinais: [] }); // OK ou ENCAMINHAR: o Balcao decide pela cor.
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível buscar o código.");
    } finally {
      setBuscando(false);
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={buscar} className="flex flex-col gap-3" noValidate>
        <CampoFormulario id="codigo" label="Código da orientação" placeholder="Ex.: 37" erro={errors.codigo}
          registro={register("codigo", {
            required: "Informe o código.",
            pattern: { value: /^\d{1,9}$/, message: "O código tem só números." },
          })} />
        <button type="submit" disabled={buscando} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
          {buscando ? "Buscando..." : "Buscar código"}
        </button>
      </form>
      {erro && <MensagemErro mensagem={erro} />}
      {aviso?.tipo === "VENCIDA" && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-borda bg-branco p-4" role="alert">
          <p className="font-extrabold text-gravidade-laranja">Orientação vencida</p>
          <p>O código vale só no dia da orientação ({fmtDia(aviso.orientacao.dtOrientacao, false)}).</p>
          <button onClick={onFazerAqui} className="btn bg-primaria text-branco hover:bg-primariaEscura">
            <FiClipboard /> Fazer a orientação aqui
          </button>
        </div>
      )}
      {aviso?.tipo === "JA_UTILIZADA" && (
        <p className="rounded-[12px] bg-mentaSuave p-3 font-bold text-primaria" role="alert">Código já utilizado.</p>
      )}
    </div>
  );
}
