import { Link } from "@tanstack/react-router";

export function NaoEncontrada() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-6xl font-extrabold text-primaria">404</p>
      <h1 className="mt-2 text-xl font-bold">Tela não encontrada</h1>
      <Link to="/cidadao/inicio" className="btn mt-6 bg-primaria text-branco hover:bg-primariaEscura">Voltar ao início</Link>
    </div>
  );
}
