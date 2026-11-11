import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { DOENCAS_BASE } from "@/data/contaDemo";
import { fmtDiaHora } from "@/lib/datas";
import { apagarFicha, salvarFicha } from "@/services/api";
import type { CodigoDoencaBase, MedicamentoContinuo, TipoSanguineo } from "@/types";

interface FichaForm {
  dsDoencasBase: CodigoDoencaBase[];
  dsOutraDoenca: string;
  medicamentos: MedicamentoContinuo[];
  dsAlergias: string;
  dsTipoSanguineo: TipoSanguineo;
  flConsentimento: boolean;
}

const TIPOS: TipoSanguineo[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function FichaSaudePagina() {
  const { estado } = useSimulador();
  const cadastro = estado.cidadaos.find((c) => c.cdCidadao === estado.cdCidadaoAtual);
  if (!cadastro) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Entre na sua conta para ver ou editar a ficha de saúde." />
        <Link to="/cidadao/entrar" search={{ horario: 0, oferta: 0, destino: "ficha", ubs: 0 }} className="btn bg-primaria text-branco">Entrar</Link>
      </div>
    );
  }
  return <FormularioFicha cdCidadao={cadastro.cdCidadao} />;
}

function FormularioFicha({ cdCidadao }: { cdCidadao: number }) {
  const { estado } = useSimulador();
  const navigate = useNavigate();
  const ficha = (estado.fichas ?? []).find((f) => f.cdCidadao === cdCidadao);
  const cadastro = estado.cidadaos.find((c) => c.cdCidadao === cdCidadao);
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);
  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FichaForm>({
    defaultValues: {
      dsDoencasBase: ficha?.dsDoencasBase ?? [],
      dsOutraDoenca: ficha?.dsOutraDoenca ?? "",
      medicamentos: ficha?.medicamentos ?? [],
      dsAlergias: ficha?.dsAlergias ?? "",
      dsTipoSanguineo: ficha?.dsTipoSanguineo ?? "",
      flConsentimento: false,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "medicamentos" });
  const outra = (watch("dsDoencasBase") || []).includes("OUTRA");

  const enviar = handleSubmit(async (v) => {
    setErro(null);
    try {
      await salvarFicha({
        cdCidadao,
        dsDoencasBase: v.dsDoencasBase || [],
        dsOutraDoenca: outra ? v.dsOutraDoenca.trim() : "",
        medicamentos: v.medicamentos.filter((m) => m.nmMedicamento.trim()).map((m) => ({ nmMedicamento: m.nmMedicamento.trim(), dsDose: m.dsDose.trim() })),
        dsAlergias: v.dsAlergias.trim(),
        dsTipoSanguineo: v.dsTipoSanguineo,
        flConsentimento: v.flConsentimento,
      });
      void navigate({ to: "/cidadao/perfil" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar a ficha.");
    }
  });

  const apagar = async () => {
    await apagarFicha(cdCidadao);
    void navigate({ to: "/cidadao/perfil" });
  };

  const caixa = "h-5 w-5 accent-primaria";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Ficha de saúde</h1>
      <p className="text-base text-textoSuave">Opcional. Ajuda quem for socorrer você numa emergência.</p>
      {ficha && <p className="text-sm font-semibold text-textoSuave">Última atualização: {fmtDiaHora(ficha.dtAtualizacao, false)}</p>}
      {erro && <MensagemErro mensagem={erro} />}
      <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-5" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">Doenças de base</legend>
          {DOENCAS_BASE.map((d) => (
            <label key={d.cd} className="flex min-h-11 items-center gap-3 rounded-[12px] border border-borda bg-branco px-3">
              <input type="checkbox" value={d.cd} className={caixa} {...register("dsDoencasBase")} /> {d.nm}
            </label>
          ))}
          {outra && <CampoFormulario id="dsOutraDoenca" label="Qual outra doença?" registro={register("dsOutraDoenca")} />}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">Medicamentos de uso contínuo</legend>
          {fields.length === 0 && <p className="text-sm text-textoSuave">Nenhum medicamento adicionado.</p>}
          {fields.map((f, i) => (
            <div key={f.id} className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-3">
              <CampoFormulario id={`med-${i}`} label="Nome do remédio" registro={register(`medicamentos.${i}.nmMedicamento`)} />
              <CampoFormulario id={`dose-${i}`} label="Dose (opcional)" placeholder="Ex.: 50 mg, 1 vez ao dia" registro={register(`medicamentos.${i}.dsDose`)} />
              <button type="button" onClick={() => remove(i)} className="btn border border-borda bg-branco text-gravidade-vermelho"><FiTrash2 /> Remover</button>
            </div>
          ))}
          <button type="button" onClick={() => append({ nmMedicamento: "", dsDose: "" })} className="btn border border-borda bg-branco text-primaria"><FiPlus /> Adicionar medicamento</button>
        </fieldset>

        <CampoFormulario id="dsAlergias" label="Alergias" placeholder="Remédios, alimentos..." multilinha registro={register("dsAlergias")} />

        <div className="flex flex-col gap-1">
          <label htmlFor="dsTipoSanguineo" className="font-semibold">Tipo sanguíneo (opcional)</label>
          <select id="dsTipoSanguineo" className="min-h-12 w-full rounded-[12px] border border-borda bg-branco px-4 text-texto outline-none focus:ring-2 focus:ring-primaria" {...register("dsTipoSanguineo")}>
            <option value="">Não informar</option>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="NAO_SEI">Não sei</option>
          </select>
        </div>

        <div className="rounded-[12px] bg-mentaSuave p-3">
          <p className="font-semibold">Contato de emergência</p>
          <p>{cadastro?.nmContatoRecado ? `${cadastro.nmContatoRecado} · ${cadastro.nrContatoRecado}` : "Não informado"}</p>
          <Link to="/cidadao/perfil/editar" className="text-sm font-bold text-primaria underline">Alterar no cadastro</Link>
        </div>

        <div>
          <label className="flex items-start gap-3">
            <input type="checkbox" className={`${caixa} mt-1 shrink-0`} {...register("flConsentimento", { required: "É preciso autorizar para salvar a ficha." })} />
            <span className="font-semibold">Autorizo o uso destes dados de saúde para me orientar no app (LGPD, art. 11)</span>
          </label>
          {errors.flConsentimento && <p className="mt-1 text-sm font-semibold text-gravidade-vermelho">{errors.flConsentimento.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
          {isSubmitting ? "Salvando..." : "Salvar ficha"}
        </button>
      </form>

      {ficha && (apagando ? (
        <div className="rounded-[12px] border border-borda bg-branco p-3" role="alertdialog" aria-label="Confirmar exclusão da ficha">
          <p className="mb-3 font-semibold">Apagar sua ficha de saúde? Esta ação não pode ser desfeita.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setApagando(false)} className="btn border border-borda bg-branco text-texto">Cancelar</button>
            <button onClick={() => void apagar()} className="btn bg-gravidade-vermelho text-branco">Sim, apagar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setApagando(true)} className="btn border border-gravidade-vermelho bg-branco text-gravidade-vermelho"><FiTrash2 /> Apagar minha ficha</button>
      ))}
    </div>
  );
}
