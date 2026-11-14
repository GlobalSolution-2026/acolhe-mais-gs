/**
 * Feriados nacionais (BrasilAPI, gratuita e sem chave), com cache por ano.
 * A consulta é síncrona (ehFeriado): o cache começa com a lista fixa de 2026 e é
 * substituído pela resposta da API quando ela chega. Se a API falhar, a lista fixa continua valendo.
 */

const URL_FERIADOS = "https://brasilapi.com.br/api/feriados/v1";
const CHAVE_STORAGE = (ano: number) => `acolhe-plus:feriados:${ano}`;

/** Feriados nacionais de 2026 (Leis 662/1949, 6.802/1980 e 14.759/2023), usados se a API falhar. */
export const FERIADOS_FIXOS_2026 = [
  "2026-01-01", // Confraternização Universal
  "2026-04-03", // Sexta-feira Santa
  "2026-04-21", // Tiradentes
  "2026-05-01", // Dia do Trabalho
  "2026-09-07", // Independência do Brasil
  "2026-10-12", // Nossa Senhora Aparecida
  "2026-11-02", // Finados
  "2026-11-15", // Proclamação da República
  "2026-11-20", // Dia Nacional de Zumbi e da Consciência Negra
  "2026-12-25", // Natal
];

const cache = new Map<number, Set<string>>([[2026, new Set(FERIADOS_FIXOS_2026)]]);
/** Anos já carregados da API (ou do localStorage com dados da API). */
const daApi = new Set<number>();
const emAndamento = new Map<number, Promise<void>>();

/** "aaaa-mm-dd" em horário local (sem depender de datas.ts, que importa este módulo). */
function chaveLocal(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function lerDoStorage(ano: number): boolean {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE(ano));
    if (!bruto) return false;
    const datas = JSON.parse(bruto) as unknown;
    if (!Array.isArray(datas) || !datas.every((d) => typeof d === "string")) return false;
    cache.set(ano, new Set(datas));
    daApi.add(ano);
    return true;
  } catch {
    return false;
  }
}

/** Feriado nacional na data (horário local). */
export function ehFeriado(data: Date): boolean {
  const ano = data.getFullYear();
  if (!daApi.has(ano)) lerDoStorage(ano);
  return cache.get(ano)?.has(chaveLocal(data)) ?? false;
}

/**
 * Busca os feriados do ano na BrasilAPI uma única vez por ano (memória + localStorage).
 * Nunca rejeita: em falha, mantém a lista fixa e o app segue.
 */
export function carregarFeriados(ano: number, buscar: typeof fetch = (...a) => fetch(...a)): Promise<void> {
  if (daApi.has(ano) || lerDoStorage(ano)) return Promise.resolve();
  const pendente = emAndamento.get(ano);
  if (pendente) return pendente;
  const tarefa = (async () => {
    try {
      const res = await buscar(`${URL_FERIADOS}/${ano}`);
      if (!res.ok) throw new Error(`BrasilAPI respondeu ${res.status}`);
      const lista = (await res.json()) as { date?: unknown }[];
      const datas = lista.map((f) => f.date).filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
      if (datas.length === 0) throw new Error("BrasilAPI sem feriados");
      cache.set(ano, new Set(datas));
      daApi.add(ano);
      try { localStorage.setItem(CHAVE_STORAGE(ano), JSON.stringify(datas)); } catch { /* armazenamento indisponível */ }
    } catch {
      // Sem rede ou API fora do ar: segue com a lista fixa (só 2026) e fins de semana.
    } finally {
      emAndamento.delete(ano);
    }
  })();
  emAndamento.set(ano, tarefa);
  return tarefa;
}

/** Só para testes: volta ao estado inicial (lista fixa de 2026). */
export function reiniciarCacheFeriados(): void {
  cache.clear();
  cache.set(2026, new Set(FERIADOS_FIXOS_2026));
  daApi.clear();
  emAndamento.clear();
}
