import { createFileRoute } from "@tanstack/react-router";
import { Entrar } from "@/pages/cidadao/Entrar";
import { lerDestinoLogin } from "@/services/navegacao";

export const Route = createFileRoute("/cidadao/entrar")({
  validateSearch: (s: Record<string, unknown>) => ({
    horario: Number(s["horario"]) || 0,
    oferta: Number(s["oferta"]) || 0,
    destino: lerDestinoLogin(s["destino"]),
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Entrar | Acolhe+" },
      { name: "description", content: "Entre com o Cartão SUS no aplicativo Acolhe+." },
      { property: "og:title", content: "Entrar | Acolhe+" },
      { property: "og:description", content: "Entre com o Cartão SUS no aplicativo Acolhe+." },
    ],
  }),
  component: function EntrarRoute() {
    const { horario, oferta, destino } = Route.useSearch();
    return <Entrar cdHorario={horario} cdOferta={oferta} destino={destino} />;
  },
});
