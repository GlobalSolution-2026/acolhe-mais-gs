import { createFileRoute } from "@tanstack/react-router";
import { CriarConta } from "@/pages/cidadao/CriarConta";
import { lerDestinoLogin } from "@/services/navegacao";

export const Route = createFileRoute("/cidadao/criar-conta")({
  validateSearch: (s: Record<string, unknown>) => ({
    horario: Number(s["horario"]) || 0,
    oferta: Number(s["oferta"]) || 0,
    destino: lerDestinoLogin(s["destino"]),
    ubs: Number(s["ubs"]) || 0,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Criar conta | Acolhe+" },
      { name: "description", content: "Crie sua conta no aplicativo Acolhe+ para agendar consultas na UBS." },
      { property: "og:title", content: "Criar conta | Acolhe+" },
      { property: "og:description", content: "Crie sua conta no aplicativo Acolhe+ para agendar consultas na UBS." },
    ],
  }),
  component: function CriarContaRoute() {
    const { horario, oferta, destino, ubs } = Route.useSearch();
    return <CriarConta cdHorario={horario} cdOferta={oferta} destino={destino} cdUnidade={ubs} />;
  },
});
