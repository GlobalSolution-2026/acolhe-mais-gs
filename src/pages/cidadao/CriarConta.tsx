import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { criarConta } from "@/services/api";
import type { CidadaoEntrada } from "@/types";

export function CriarConta({ cdHorario, cdOferta }: { cdHorario: number; cdOferta: number }) {
  const { estado, definirCidadaoAtual } = useSimulador();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aoEnviar = async (dados: CidadaoEntrada, dsSenha?: string) => {
    setEnviando(true);
    setErro(null);
    try {
      const cidadao = await criarConta(dados, dsSenha ?? "");
      definirCidadaoAtual(cidadao.cdCidadao);
      void (cdHorario
        ? navigate({ to: "/cidadao/agendar", search: { horario: cdHorario, oferta: cdOferta } })
        : navigate({ to: "/cidadao/perfil" }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Criar conta</h1>
      <p className="text-base text-textoSuave">Confira seu celular: é por ele que avisamos a confirmação e as vagas.</p>
      {erro && <MensagemErro mensagem={erro} />}
      <FormularioCidadao
        nrCep={estado.orientacaoAtual?.nrCep ?? ""}
        valoresIniciais={{}}
        aoEnviar={(d, s) => void aoEnviar(d, s)}
        textoBotao="Criar conta"
        enviando={enviando}
        pedirSenha
      />
      <p className="text-center">
        Já tem conta?{" "}
        <Link to="/cidadao/entrar" search={{ horario: cdHorario, oferta: cdOferta, destino: "" }} className="font-bold text-primaria underline">Entrar</Link>
      </p>
    </div>
  );
}
