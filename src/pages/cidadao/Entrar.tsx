import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CampoFormulario } from "@/components/CampoFormulario";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { entrar } from "@/services/api";
import { destinoAposLogin, type DestinoLogin } from "@/services/navegacao";

interface EntrarForm { nrCns: string; dsSenha: string }

/** Depois de entrar, volta ao agendamento (se veio dele) ou ao destino pedido. */
export function Entrar({ cdHorario, cdOferta, destino }: { cdHorario: number; cdOferta: number; destino: DestinoLogin }) {
  const { definirCidadaoAtual } = useSimulador();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EntrarForm>();

  const voltar = () => navigate(destinoAposLogin({ horario: cdHorario, oferta: cdOferta, destino }));

  const enviar = handleSubmit(async (v) => {
    setErro(null);
    try {
      const cidadao = await entrar(v.nrCns, v.dsSenha);
      definirCidadaoAtual(cidadao.cdCidadao);
      void voltar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Entrar</h1>
      {cdHorario > 0 && <p className="rounded-[12px] bg-mentaSuave p-3 font-semibold">Entre para concluir o agendamento.</p>}
      {destino === "lista-do-dia" && <p className="rounded-[12px] bg-mentaSuave p-3 font-semibold">Entre para receber a vaga da lista do dia no seu nome.</p>}
      {erro && <MensagemErro mensagem={erro} />}
      <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-4" noValidate>
        <CampoFormulario id="nrCns" label="Cartão SUS (CNS)" placeholder="000000000000000" erro={errors.nrCns}
          registro={register("nrCns", { required: "Informe o número do cartão SUS.", validate: (v) => /^\d{15}$/.test(v.replace(/\D/g, "")) || "O cartão SUS tem 15 números." })} />
        <CampoFormulario id="dsSenha" label="Senha" tipo="password" alternarSenha erro={errors.dsSenha}
          registro={register("dsSenha", { required: "Informe a senha." })} />
        <button type="submit" disabled={isSubmitting} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <button type="button" disabled className="btn border border-borda bg-branco text-textoSuave opacity-70">
        Entrar com gov.br <span className="text-sm font-semibold">(Em breve)</span>
      </button>
      <p className="text-center">
        Ainda não tem conta?{" "}
        <Link to="/cidadao/criar-conta" search={{ horario: cdHorario, oferta: cdOferta, destino }} className="font-bold text-primaria underline">Criar conta</Link>
      </p>
    </div>
  );
}
