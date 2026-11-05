import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EstadoVazio } from "@/components/EstadoVazio";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { agendarConsulta, atualizarCidadao, cadastrarCidadao } from "@/services/api";
import type { CidadaoEntrada } from "@/types";

export function Agendar({ cdHorario, cdOferta }: { cdHorario: number; cdOferta: number }) {
  const { estado, definirCidadaoAtual, responderOferta } = useSimulador();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const horario = estado.horarios.find((h) => h.cdHorario === cdHorario);
  const unidade = horario ? estado.unidades.find((u) => u.cdUnidade === horario.cdUnidade) : undefined;
  const cadastro = estado.cidadaos.find((c) => c.cdCidadao === estado.cdCidadaoAtual);

  if (!horario || !unidade) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Horário não encontrado. Escolha outro horário." />
        <Link to="/inicio/ubs" className="btn bg-primaria text-branco">Ver UBS próximas</Link>
      </div>
    );
  }

  const aoEnviar = async (dados: CidadaoEntrada) => {
    setEnviando(true);
    setErro(null);
    try {
      const cidadao = cadastro ? await atualizarCidadao(cadastro.cdCidadao, dados) : await cadastrarCidadao(dados);
      definirCidadaoAtual(cidadao.cdCidadao);
      const consulta = await agendarConsulta({
        cdHorario,
        cdCidadao: cidadao.cdCidadao,
        cdOrientacao: estado.orientacaoAtual?.resultado?.cdOrientacao ?? null,
      });
      if (cdOferta) responderOferta(cdOferta, "ACEITA");
      void navigate({ to: "/inicio/sucesso", search: { consulta: consulta.cdConsulta } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir o agendamento.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Seus dados para agendar</h1>
      <p className="rounded-[12px] bg-mentaSuave p-3 font-semibold">
        {unidade.nmUnidade} · {fmtDiaHora(horario.dtHorario)}
      </p>
      {cadastro && (
        <p className="text-base text-textoSuave">
          Encontramos seu cadastro. Confira se o celular está certo: é por ele que avisamos a confirmação e as vagas.
        </p>
      )}
      {erro && <MensagemErro mensagem={erro} />}
      <FormularioCidadao
        nrCep={estado.orientacaoAtual?.nrCep ?? cadastro?.nrCep ?? ""}
        valoresIniciais={cadastro ?? {}}
        aoEnviar={(d) => void aoEnviar(d)}
        textoBotao={enviando ? "Agendando..." : "Confirmar agendamento"}
        enviando={enviando}
      />
    </div>
  );
}
