import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cidadao/")({
  beforeLoad: () => { throw redirect({ to: "/cidadao/inicio" }); },
});
