import { createFileRoute } from "@tanstack/react-router";
import { EditarPerfil } from "@/pages/cidadao/EditarPerfil";

export const Route = createFileRoute("/cidadao/perfil_/editar")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Editar dados | Acolhe+" },
      { name: "description", content: "Editar dados do cadastro no aplicativo Acolhe+." },
      { property: "og:title", content: "Editar dados | Acolhe+" },
      { property: "og:description", content: "Editar dados do cadastro no aplicativo Acolhe+." },
    ],
  }),
  component: EditarPerfil,
});
