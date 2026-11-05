import { Link } from "@tanstack/react-router";

export function NaoEncontrada() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-primaria">404</p>
      <h1 className="mt-2 text-xl font-bold">Página não encontrada</h1>
      <Link to="/" className="btn mt-6 bg-primaria text-branco hover:bg-primariaEscura">Voltar ao início</Link>
    </div>
  );
}
