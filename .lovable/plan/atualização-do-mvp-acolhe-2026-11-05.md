# Atualização do MVP Acolhe+

## O que será atualizado
- Distribuição das ofertas sem devolver a vaga a quem a perdeu, com repasse após recusa ou vencimento e acompanhamento pela recepção.
- Prazo de cinco minutos reais, vencimento em qualquer tela e botão para vencer imediatamente.
- Simulação limitada ao alcance solicitado, com resumo das liberações, ofertas e pacientes sem contato.
- Nova demonstração diária com cidadãos, histórico, agenda futura e listas do dia coerentes.
- Dias compartilhados entre agenda e horários do cidadão, datas com maiúscula apenas no início e informações sobre confirmação.
- Quatro perguntas na forma positiva, sem alterar o significado clínico, e taxa de absenteísmo calculada sobre consultas encerradas.
- Folha de demonstração com rolagem em telas baixas.

## Detalhes técnicos
Preservar Context, serviços em api.ts, páginas separadas das rotas e as bibliotecas atuais utilizadas pelo app. Centralizar regras de oferta e simulação em funções puras e ampliar os testes Vitest.

Os horários livres de hoje também poderão ser oferecidos manualmente, conforme o novo pedido; vagas liberadas continuam excluindo o cidadão que perdeu a consulta. Se já não houver horário após agora + 60 minutos no dia, o gerador não inventará horários fora das horas especificadas.

## Verificação
Executar todos os testes, conferir oferta/recusa/aceitação na recepção e avisos do cidadão, comparar agendas e testar a folha em 360×640. Ao final, listar os arquivos alterados e o total de testes aprovados.