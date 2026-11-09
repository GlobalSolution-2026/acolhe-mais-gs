import type { EnderecoCep, LocalOrientacao } from "@/types/orientacao";

interface RespostaViaCep {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

/** Consulta o ViaCEP. null = CEP não encontrado; lança erro em falha de rede ou HTTP. */
export async function buscarEndereco(cep: string, signal?: AbortSignal): Promise<EnderecoCep | null> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: signal ?? null });
  if (!res.ok) throw new Error("Não foi possível consultar o CEP.");
  const dados = (await res.json()) as RespostaViaCep;
  if (dados.erro) return null; // o ViaCEP responde erro: true ou "true"
  return { dsLogradouro: dados.logradouro ?? "", dsBairro: dados.bairro ?? "", nmCidade: dados.localidade ?? "", sgUf: dados.uf ?? "" };
}

/** "Rua X, 123, apto 4 – Bairro, Cidade/UF · CEP 00000-000" (partes vazias são omitidas). */
export function formatarEndereco(
  e: EnderecoCep,
  extra: { nrEndereco?: string | undefined; dsComplemento?: string | undefined; nrCep?: string | undefined } = {},
): string {
  const rua = [e.dsLogradouro, extra.nrEndereco, extra.dsComplemento].filter(Boolean).join(", ");
  const cidadeUf = [e.nmCidade, e.sgUf].filter(Boolean).join("/");
  const local = [e.dsBairro, cidadeUf].filter(Boolean).join(", ");
  const texto = [rua, local].filter(Boolean).join(" – ");
  if (!extra.nrCep) return texto;
  return texto ? `${texto} · CEP ${extra.nrCep}` : `CEP ${extra.nrCep}`;
}

/** Endereço para a ligação ao SAMU: completo com ViaCEP; sem ele, CEP com número/complemento digitados. */
export function enderecoParaLigacao(nrCep: string, local: LocalOrientacao): string {
  const { endereco, nrEndereco, dsComplemento } = local;
  if (endereco) return formatarEndereco(endereco, { nrEndereco, dsComplemento, nrCep });
  return [`CEP ${nrCep}`, nrEndereco ? `nº ${nrEndereco}` : "", dsComplemento].filter(Boolean).join(", ");
}
