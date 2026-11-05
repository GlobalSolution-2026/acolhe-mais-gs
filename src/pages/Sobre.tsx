import { Pagina } from "./Pagina";

export function Sobre() {
  return (
    <Pagina titulo="Sobre o Acolhe+" subtitulo="Por que criamos esta plataforma.">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-borda bg-branco p-6 shadow-leve">
          <h2 className="mb-2 text-xl font-bold text-primaria">O problema</h2>
          <p className="mb-3">
            Nas UPAs, boa parte dos atendimentos é de baixa gravidade (classificados como verde ou azul). Isso aumenta a espera de quem está grave.
          </p>
          <p>
            Ao mesmo tempo, nas UBS, muitas consultas marcadas terminam em falta. O horário fica vazio e ninguém aproveita.
          </p>
        </section>
        <section className="rounded-[12px] bg-mentaSuave p-6">
          <h2 className="mb-2 text-xl font-bold text-primaria">Para quem é</h2>
          <p>
            Moradores de grandes cidades que não têm equipe de Saúde da Família acompanhando e, por isso, não sabem a qual serviço recorrer quando passam mal.
          </p>
        </section>
      </div>
    </Pagina>
  );
}
