# Acolhe Mais Gs

Crie o site do "Acolhe+", uma plataforma que orienta o cidadão sobre onde buscar atendimento no SUS (SAMU, pronto-socorro, UPA ou UBS) e, nos casos de baixa gravidade, agenda uma consulta na UBS aproveitando vagas que seriam perdidas por falta. Este projeto é um protótipo que depois será migrado para um front oficial, então siga estas regras de tecnologia à risca.

TECNOLOGIAS (obrigatório)
- React + Vite + TypeScript + Tailwind CSS.
- Rotas com createBrowserRouter e Outlet (react-router-dom). Abas e navegação com NavLink + Outlet.
- Estado global com Context API, com hook próprio (ex.: useSimulador) e funções em useCallback.
- Formulários com react-hook-form (validação nativa dele, com useWatch quando precisar observar campos).
- Ícones com react-icons.
- Requisições com fetch nativo.
- NÃO use: shadcn/ui, Radix, lucide-react, TanStack Router, TanStack Query, Axios, zod nem qualquer biblioteca de componentes. Componentes feitos à mão com Tailwind.
- NÃO use Lovable Cloud, Supabase nem banco de dados. Não há back-end neste protótipo.

DADOS E SERVIÇOS
- Toda a comunicação com dados passa por src/services/api.ts. Cada função tem o nome e o formato de um endpoint REST da API Java que existirá depois. Neste protótipo, as funções leem e alteram dados de mock (src/data/) guardados no estado do Context e esperam 400 ms (setTimeout com Promise) para simular a rede.
- O estado da demonstração é salvo no localStorage (leitura e escrita dentro de try/catch), para não se perder ao recarregar a página. Coloque um botão "Reiniciar demonstração" no topo do simulador, que volta tudo aos dados iniciais.
- Deixe pronta a constante const API_URL = import.meta.env.VITE_API_URL, com um comentário em cada função mostrando como ela ficará com fetch real.
- Quando der erro, o serviço lança new Error(erro.erro), no formato de um ErroResponse { status: number; erro: string }.
- Tipos em src/types/ com os mesmos nomes de campo dos DTOs Java:
  - Unidade { cdUnidade, nmUnidade, tpUnidade ('UBS' | 'UPA'), dsEndereco, nrCep, nrTelefone }
  - Horario { cdHorario, cdUnidade, dtHorario (ISO), nrDuracaoMin, flOcupado }
  - Cidadao { cdCidadao, nmCidadao, nrCns, dtNascimento, dsSexo ('F' | 'M'), nrCelular, nmContatoRecado, nrContatoRecado, nrCep }
  - Consulta { cdConsulta, cdHorario, cdCidadao, cdOrientacao, dtAgendamento, dtConfirmacao, dsStatus ('AGENDADA'|'CONFIRMADA'|'LIBERADA'|'REALIZADA'|'FALTA'), vlProbFalta, dsRiscoFalta ('BAIXO'|'ALTO'), nmUnidade, dtHorario }
  - ErroResponse { status, erro }
  Use Omit<Cidadao, "cdCidadao"> para os dados de entrada.
- Mock em src/data/: 3 UBS e 2 UPA em bairros de São Paulo, com endereço e CEP; horários nos próximos 5 dias úteis para cada UBS (alguns já ocupados).

ESTRUTURA DE PASTAS
src/components (Header, Footer, MenuMobile, CardUnidade, CardHorario, Carregando, MensagemErro, EstadoVazio, CampoFormulario), src/pages, src/services, src/types, src/data, src/context, src/routes/router.tsx.

ROTAS
- / (Início), /sobre, /faq, /contato, /integrantes, /integrantes/:rm (página própria de cada integrante), /solucao, /simulador.
- /simulador tem rotas filhas: /simulador/cidadao, /simulador/recepcao e /simulador/status-api. /simulador redireciona para /simulador/cidadao.
- /simulador/cidadao tem rotas filhas para as abas do celular: inicio, consultas, emergencia, avisos e perfil (redireciona para inicio).
- Página 404 simples.

PÁGINAS DESTA ETAPA
- Header com logo "Acolhe+", links das páginas e menu hambúrguer (MenuMobile) em telas pequenas. Footer simples.
- Início: chamada principal ("A pessoa certa, no lugar certo, na vaga que ia sobrar"), resumo do problema e botões para /solucao e /simulador.
- Sobre: o problema (casos de baixa gravidade nas UPAs e faltas nas consultas da UBS) e o público (moradores de grandes cidades sem equipe de Saúde da Família).
- Solução (/solucao): problema, fluxo da solução em etapas (orientação → agendamento → confirmação → liberação de vagas) e indicadores (proporção de casos verdes e azuis nas UPAs, taxa de absenteísmo, reaproveitamento de horários, tempo até a consulta).
- FAQ com 5 perguntas em sanfona feita à mão, incluindo "A plataforma faz diagnóstico?" (resposta: não; ela orienta e não substitui a classificação de risco feita por profissionais).
- Contato: formulário com react-hook-form usando CampoFormulario (nome, e-mail, mensagem), com erro embaixo de cada campo e mensagem de sucesso.
- Integrantes: 5 cards com nome, RM e GitHub de exemplo; cada card leva a /integrantes/:rm.
- Simulador (/simulador): layout com abas Cidadão, Recepção UBS e Status da API (NavLink + Outlet) e o botão "Reiniciar demonstração".
  - Aba Cidadão: moldura de celular no centro. Dentro dela, um topo (botão voltar, logo Acolhe+ e sino de avisos com contador) e uma barra inferior fixa com 4 abas (Início, Consultas, Avisos, Perfil) e, no centro, um botão redondo vermelho flutuante "Emergência", maior que as abas e levemente acima da barra. Nesta etapa, cada aba do celular mostra só o título e "em construção".
  - Aba Recepção UBS: painel largo, por enquanto com "em construção".
  - Aba Status da API: por enquanto com "em construção".

VISUAL (padrão de cores e tipografia)
- Defina estas cores como tokens no tailwind.config (theme.extend.colors), e use só os tokens nas classes:
  - primaria: #1E3A5F (azul-marinho, cor da marca), primariaEscura: #152A45, menta: #A7F3D0 (destaque), mentaSuave: #DDF7EC (fundos de caixas), fundo: #F8FAFC, texto: #1E293B, textoSuave: #64748B, borda: #E2E8F0.
  - gravidade: vermelho #D32F2F, laranja #F57C00, amarelo #FBC02D (texto escuro em cima), verde #388E3C, azul #1976D2. Essas cinco cores são usadas SÓ para gravidade (selos de resultado, lista do dia) e o vermelho também para o botão de Emergência. Nunca como cor da marca ou de botões comuns. O selo de gravidade sempre mostra o nome escrito além da cor (ex.: "Amarelo – UPA").
- Fonte Nunito (Google Fonts). Texto-base de 16 px no site e 18 px dentro do celular.
- Botões grandes (altura mínima de 48 px), cantos arredondados de 12 px, sombras leves. Fundo claro, textos curtos em linguagem simples, bom contraste e layout responsivo.
- Toda página que chamar a API deve tratar carregando (Carregando), erro (MensagemErro) e lista vazia (EstadoVazio).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://acolhe-mais-gs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d744af7b-05c8-4853-a0fd-c426b19327de).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
