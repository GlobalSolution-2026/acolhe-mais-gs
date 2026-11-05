import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EstadoVazio } from "@/components/EstadoVazio";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { atualizarCidadao } from "@/services/api";
import type { CidadaoEntrada } from "@/types";

export function EditarPerfil() {
  const { estado } = useSimulador();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cadastro = estado.cidadaos.find((c) => c.cdCidadao === estado.cdCidadaoAtual);

  if (!cadastro) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Você ainda não tem cadastro." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Voltar ao início</Link>
      </div>
    );
  }

  const aoEnviar = async (dados: CidadaoEntrada) => {
    setEnviando(true);
    setErro(null);
    try {
      await atualizarCidadao(cadastro.cdCidadao, dados);
      void navigate({ to: "/cidadao/perfil" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Editar dados</h1>
      <p className="text-base text-textoSuave">
        Confira seu celular: é por ele que avisamos a confirmação e as vagas.
      </p>
      {erro && <MensagemErro mensagem={erro} />}
      <FormularioCidadao
        nrCep={cadastro.nrCep}
        valoresIniciais={cadastro}
        aoEnviar={(d) => void aoEnviar(d)}
        textoBotao="Salvar"
        enviando={enviando}
      />
    </div>
  );
}
