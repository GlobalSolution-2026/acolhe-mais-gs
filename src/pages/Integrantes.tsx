import { Link } from "@tanstack/react-router";
import { FiGithub, FiUser } from "react-icons/fi";
import { integrantes } from "@/data/integrantes";
import { Pagina } from "./Pagina";

export function Integrantes() {
  return (
    <Pagina titulo="Integrantes" subtitulo="Quem está construindo o Acolhe+.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrantes.map((i) => (
          <Link key={i.rm} to="/integrantes/$rm" params={{ rm: i.rm }}
            className="rounded-[12px] border border-borda bg-branco p-5 shadow-leve transition hover:border-primaria">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mentaSuave text-primaria"><FiUser size={28} /></div>
            <h2 className="text-lg font-bold">{i.nome}</h2>
            <p className="text-textoSuave">RM {i.rm}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-primaria"><FiGithub /> github.com/{i.github}</p>
          </Link>
        ))}
      </div>
    </Pagina>
  );
}

export function IntegranteDetalhe({ rm }: { rm: string }) {
  const i = integrantes.find((x) => x.rm === rm);
  if (!i) {
    return (
      <Pagina titulo="Integrante não encontrado">
        <Link to="/integrantes" className="btn bg-primaria text-branco">Voltar</Link>
      </Pagina>
    );
  }
  return (
    <Pagina titulo={i.nome} subtitulo={`RM ${i.rm}`}>
      <div className="max-w-xl rounded-[12px] border border-borda bg-branco p-6 shadow-leve">
        <p className="mb-2"><strong>Papel no projeto:</strong> {i.papel}</p>
        <a href={`https://github.com/${i.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primaria underline">
          <FiGithub /> github.com/{i.github}
        </a>
        <Link to="/integrantes" className="btn mt-6 bg-primaria text-branco hover:bg-primariaEscura">Voltar aos integrantes</Link>
      </div>
    </Pagina>
  );
}
