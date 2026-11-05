import { ModoDemonstracao } from "@/components/ModoDemonstracao";
import { TelaEmConstrucao } from "../TelaEmConstrucao";

export function Perfil() {
  return (
    <div className="flex flex-col gap-6">
      <TelaEmConstrucao titulo="Perfil" />
      <ModoDemonstracao />
    </div>
  );
}
