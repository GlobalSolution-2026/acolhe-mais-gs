import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/simulador/cidadao/")({
  beforeLoad: () => {
    throw redirect({ to: "/simulador/cidadao/inicio" });
  },
});
