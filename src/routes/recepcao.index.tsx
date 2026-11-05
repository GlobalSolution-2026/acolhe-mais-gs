import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recepcao/")({
  beforeLoad: () => {
    throw redirect({ to: "/recepcao/agenda" });
  },
});
