import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="mt-16 bg-primariaEscura text-branco">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-center sm:flex-row sm:text-left">
        <Logo className="text-xl" />
        <p className="text-sm opacity-80">
          Protótipo acadêmico. Em emergência, ligue 192 (SAMU).
        </p>
      </div>
    </footer>
  );
}
