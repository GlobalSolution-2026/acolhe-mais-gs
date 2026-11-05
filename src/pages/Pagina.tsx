import type { ReactNode } from "react";

export function Pagina({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-primaria md:text-4xl">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-lg text-textoSuave">{subtitulo}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}
