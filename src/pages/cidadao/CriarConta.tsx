import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { criarConta } from "@/services/api";
import { destinoAposLogin, type DestinoLogin } from "@/services/navegacao";
import type { CidadaoEntrada } from "@/types";

export function CriarConta({ cdHorario, cdOferta, destino }: { cdHorario: number; cdOferta: number; destino: DestinoLogin }) {
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
      void navigate(destinoAposLogin({ horario: cdHorario, oferta: cdOferta, destino }));
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
        <Link to="/cidadao/entrar" search={{ horario: cdHorario, oferta: cdOferta, destino }} className="font-bold text-primaria underline">Entrar</Link>
      </p>
    </div>
  );
}
