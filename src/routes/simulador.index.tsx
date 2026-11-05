import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/simulador/")({
  beforeLoad: () => {
    throw redirect({ to: "/simulador/cidadao" });
  },
});
