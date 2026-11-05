import { createFileRoute } from "@tanstack/react-router";
import { LayoutRecepcao } from "@/components/LayoutRecepcao";

export const Route = createFileRoute("/recepcao")({ component: LayoutRecepcao });
