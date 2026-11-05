import { createFileRoute } from "@tanstack/react-router";
import { EditarPerfil } from "@/pages/cidadao/EditarPerfil";

export const Route = createFileRoute("/perfil/editar")({
  head: () => ({
    meta: [
      { title: "Editar dados | Acolhe+" },
      { name: "description", content: "Editar dados do cadastro no aplicativo Acolhe+." },
      { property: "og:title", content: "Editar dados | Acolhe+" },
      { property: "og:description", content: "Editar dados do cadastro no aplicativo Acolhe+." },
    ],
  }),
  component: EditarPerfil,
});
