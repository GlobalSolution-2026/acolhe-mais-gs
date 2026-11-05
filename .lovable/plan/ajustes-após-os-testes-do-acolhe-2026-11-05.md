# Ajustes após os testes do Acolhe+

- Usar os próximos três dias que possuem horários na UBS selecionada como alcance da simulação, mantendo o alcance adicional do cidadão atual.
- Garantir exemplos de confirmação com e sem contato em pelo menos duas UBS, inclusive nos fins de semana. Quando necessário para garantir esses exemplos, incluir horários de demonstração no próximo dia de fim de semana, preservando as horas de atendimento existentes.
- Mostrar em Pendentes e no sino somente consultas na janela de confirmação, com risco alto primeiro e prazo como desempate.
- Ampliar a semente para 80 cidadãos, impedir consultas ativas duplicadas por pessoa/dia, ajustar horários de entrada e deixar somente quatro das seis vagas liberadas reocupadas.
- Corrigir o indicador de comparecimento após orientação, plurais, datas dentro de frases e telefones.

## Detalhes técnicos
Preservar Context/localStorage, serviços em api.ts, páginas separadas das rotas e restrições de bibliotecas. Reutilizar funções puras para seleção de pendentes e dias de atendimento. Manter a chave de armazenamento atual e invalidar sementes antigas sem apagar cadastros manualmente.

## Verificação
Ampliar os testes Vitest com todos os dias da semana e horários extremos, executar a suíte completa e conferir Pendentes, sino, indicadores e resumo no navegador. Informar arquivos alterados e total de testes aprovados.