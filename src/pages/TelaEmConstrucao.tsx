export function TelaEmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primaria">{titulo}</h1>
      <p className="mt-2 text-textoSuave">Em construção.</p>
    </div>
  );
}
