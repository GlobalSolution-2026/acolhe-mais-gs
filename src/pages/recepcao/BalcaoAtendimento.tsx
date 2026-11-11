import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiCalendar, FiCheckCircle, FiList, FiSearch } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { agendarConsulta, atualizarCidadao, buscarCidadaoPorCns, cadastrarCidadao, incluirNaListaDoDia, vincularOrientacao } from "@/services/api";
import { horariosLivresBalcao, podeVincular, type OrientacaoBalcao } from "@/services/balcao";
import { posicaoNaFila } from "@/services/regrasAgendamento";
import type { Cidadao, CidadaoEntrada } from "@/types";

type Etapa =
  | { tipo: "CNS" }
  | { tipo: "BLOQUEADO" }
  | { tipo: "CADASTRO"; nrCns: string; existente: Cidadao | null }
  | { tipo: "DESTINO"; cidadao: Cidadao }
  | { tipo: "AGENDADO"; cidadao: Cidadao; dtHorario: string }
  | { tipo: "NA_LISTA"; cidadao: Cidadao; cdEntrada: number };

/** Depois da orientação VERDE/AZUL: identifica pelo CNS, vincula a orientação e agenda ou põe na lista do dia. */
export function BalcaoAtendimento({ dados, cdUnidade, nrCep }: { dados: OrientacaoBalcao; cdUnidade: number; nrCep: string }) {
  const { estado, obterEstado } = useSimulador();
  const { orientacao } = dados;
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "CNS" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cdHorario, setCdHorario] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ nrCns: string }>();

  // Qualquer horário futuro livre da UBS da recepção; sugere o mais próximo.
  const livres = horariosLivresBalcao(estado.horarios, estado.ofertas, cdUnidade, new Date());
  const escolhido = livres.find((h) => h.cdHorario === cdHorario) ?? livres[0];

  const executar = async (fn: () => Promise<void>) => {
    setEnviando(true);
    setErro(null);
    try {
      await fn();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  };

  const buscar = handleSubmit(({ nrCns }) => executar(async () => {
    const cns = nrCns.replace(/\D/g, "");
    const existente = await buscarCidadaoPorCns(cns);
    // Regra B(1): vinculada a outra pessoa bloqueia; ao mesmo CNS (e sem consulta, já conferido no código) segue.
    const atual = obterEstado().orientacoes.find((o) => o.cdOrientacao === orientacao.cdOrientacao) ?? orientacao;
    const bloqueada = existente ? !podeVincular(atual, existente.cdCidadao) : atual.cdCidadao != null;
    setEtapa(bloqueada ? { tipo: "BLOQUEADO" } : { tipo: "CADASTRO", nrCns: cns, existente });
  }));

  const salvarCadastro = (d: CidadaoEntrada, existente: Cidadao | null) => executar(async () => {
    if (existente && d.nrCns !== existente.nrCns) throw new Error("O Cartão SUS não pode ser alterado aqui.");
    // Cadastro de balcão: sem senha (o cidadão pode criar a conta depois com o mesmo CNS).
    const cidadao = existente ? await atualizarCidadao(existente.cdCidadao, d) : await cadastrarCidadao(d);
    await vincularOrientacao(orientacao.cdOrientacao, cidadao.cdCidadao);
    setEtapa({ tipo: "DESTINO", cidadao });
  });

  const agendar = (cidadao: Cidadao) => executar(async () => {
    if (!escolhido) return;
    const c = await agendarConsulta({ cdHorario: escolhido.cdHorario, cdCidadao: cidadao.cdCidadao, cdOrientacao: orientacao.cdOrientacao });
    setEtapa({ tipo: "AGENDADO", cidadao, dtHorario: c.dtHorario });
  });

  const colocarNaLista = (cidadao: Cidadao) => executar(async () => {
    const dsCor = orientacao.dsCor === "AZUL" ? "AZUL" : "VERDE";
    const entrada = await incluirNaListaDoDia({ cdUnidade, cdCidadao: cidadao.cdCidadao, cdOrientacao: orientacao.cdOrientacao, dsCor });
    setEtapa({ tipo: "NA_LISTA", cidadao, cdEntrada: entrada.cdEntrada });
  });

  const nomeCor = orientacao.dsCor === "AZUL" ? "Azul" : "Verde";

  return (
    <section className="flex flex-col gap-4">
      {erro && <MensagemErro mensagem={erro} />}

      {etapa.tipo === "CNS" && (
        <form onSubmit={buscar} className="flex flex-col gap-3" noValidate>
          <h2 className="text-xl font-extrabold">Identificar o cidadão</h2>
          <CampoFormulario id="cnsBusca" label="Cartão SUS do cidadão (15 números)" placeholder="000000000000000" erro={errors.nrCns}
            registro={register("nrCns", {
              required: "Informe o Cartão SUS.",
              validate: (v) => /^\d{15}$/.test(v.replace(/\D/g, "")) || "O cartão SUS tem 15 números.",
            })} />
          <button type="submit" disabled={enviando} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
            <FiSearch /> {enviando ? "Buscando..." : "Buscar cadastro"}
          </button>
        </form>
      )}

      {etapa.tipo === "BLOQUEADO" && (
        <div className="rounded-[12px] bg-mentaSuave p-3 text-primaria" role="alert">
          <p className="font-bold">Código já utilizado.</p>
          <p>Esta orientação está vinculada a outro cidadão.</p>
        </div>
      )}

      {etapa.tipo === "CADASTRO" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">{etapa.existente ? "Conferir cadastro" : "Cadastro de balcão"}</h2>
          <p className="text-base text-textoSuave">
            {etapa.existente
              ? "Confira com o cidadão o celular e o contato de recado."
              : "Sem cadastro com este CNS. O cadastro é feito sem senha; o cidadão pode criar a conta depois no app."}
          </p>
          <FormularioCidadao
            key={etapa.nrCns}
            nrCep={etapa.existente?.nrCep ?? nrCep}
            valoresIniciais={etapa.existente ?? { nrCns: etapa.nrCns }}
            aoEnviar={(d) => void salvarCadastro(d, etapa.existente)}
            textoBotao={etapa.existente ? "Confirmar dados" : "Cadastrar"}
            enviando={enviando}
          />
          <button onClick={() => setEtapa({ tipo: "CNS" })} className="btn border border-borda bg-branco text-texto">Buscar outro CNS</button>
        </div>
      )}

      {etapa.tipo === "DESTINO" && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold">Orientação {orientacao.cdOrientacao} vinculada a {etapa.cidadao.nmCidadao}.</p>
          {escolhido ? (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="horarioBalcao" className="font-semibold">Horário livre (sugerido: o mais próximo)</label>
                <select id="horarioBalcao" value={escolhido.cdHorario} onChange={(e) => setCdHorario(Number(e.target.value))}
                  className="min-h-12 rounded-[12px] border border-borda bg-branco px-4">
                  {livres.map((h) => <option key={h.cdHorario} value={h.cdHorario}>{fmtDiaHora(h.dtHorario)}</option>)}
                </select>
              </div>
              <button onClick={() => void agendar(etapa.cidadao)} disabled={enviando} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
                <FiCalendar /> {enviando ? "Agendando..." : "Agendar"}
              </button>
            </>
          ) : (
            <>
              <p className="rounded-[12px] bg-mentaSuave p-3 font-semibold text-textoSuave">Sem horário livre nesta UBS.</p>
              <button onClick={() => void colocarNaLista(etapa.cidadao)} disabled={enviando} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
                <FiList /> {enviando ? "Aguarde..." : `Colocar na lista do dia (${nomeCor})`}
              </button>
            </>
          )}
        </div>
      )}

      {etapa.tipo === "AGENDADO" && (
        <div className="flex flex-col gap-2 rounded-[12px] border-2 border-primaria bg-branco p-4" role="status">
          <p className="flex items-center gap-2 text-lg font-extrabold text-primaria"><FiCheckCircle /> Consulta agendada</p>
          <p>{etapa.cidadao.nmCidadao} · {fmtDiaHora(etapa.dtHorario)}</p>
          <p className="text-sm text-textoSuave">Quando precisar de confirmação, ela aparece na aba Pendentes (telefone ou presencial).</p>
        </div>
      )}

      {etapa.tipo === "NA_LISTA" && (
        <div className="flex flex-col gap-2 rounded-[12px] border-2 border-primaria bg-branco p-4" role="status">
          <p className="flex items-center gap-2 text-lg font-extrabold text-primaria"><FiCheckCircle /> Na lista do dia</p>
          <p>{etapa.cidadao.nmCidadao} · {posicaoNaFila(estado.listaDoDia.filter((x) => x.cdUnidade === cdUnidade), etapa.cdEntrada)}º da fila ({nomeCor})</p>
          <p className="text-sm text-textoSuave">Quando surgir vaga, ofereça pela aba Lista do dia e registre "Aceitou por telefone" ou "Recusou".</p>
        </div>
      )}
    </section>
  );
}
