# Navegação por perfil e alinhamento dos serviços

- Separar todas as telas em `/cidadao/...` e `/recepcao/...`, com um layout próprio para cada perfil e partes do topo compartilhadas. A raiz manterá apenas o Provider e a saída das rotas.
- Remover o perfil do estado salvo, inclusive de demonstrações antigas. O endereço da tela determinará o selo, os avisos e a barra inferior.
- Atualizar todos os destinos e os controles de demonstração. A edição do perfil abrirá sua própria tela.
- Substituir o voltar pelo destino fixo de cada tela; no agendamento, usar a UBS do horário selecionado.
- Alinhar os comentários e dados dos serviços à API Java: unidades sem filtro na URL, orientação apenas local, remover status e enviar consultas completas nas atualizações. Manter Java e Flask separados.
- Atualizar os testes de rotas e destinos; executar os testes existentes e conferir as abas dos dois perfis no navegador.

## Detalhes técnicos
Manter TanStack Start obrigatório desta base, telas reutilizáveis em `src/pages`, formulários e componentes atuais. Os layouts terão `Outlet`; os arquivos de edição e horários usarão rotas desaninhadas para não renderizar a tela mãe.
