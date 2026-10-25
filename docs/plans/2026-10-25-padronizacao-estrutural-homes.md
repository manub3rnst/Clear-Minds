# Padronização estrutural das Homes (Paciente e Profissional)

## Objetivo
Mesma estrutura visual nas duas Homes, tendo a do Paciente como referência. Cada uma mantém seus próprios dados e funcionalidades.

## Alterações
- `home-comum.css` (novo): casca, grade de 3 colunas, cartão de perfil, cabeçalho, painéis, tema escuro e responsividade (regras movidas de `home-layout.css`, escopo `.cm-home`).
- `home-layout.css`: mantém apenas o específico do Paciente (+ compositor que cresce com a altura mínima).
- `home-profissional-layout.css`: mantém apenas o específico do Profissional (gráfico, notificações, atividade recente, demais seções).
- `home-profissional.html`: barra superior removida (igual ao Paciente); Início reorganizado com as mesmas classes (`home-grid`, `home-left-rail`, `home-center-column`, `home-right-rail`). Todos os IDs preservados.
- `home-profissional.js`: proteção para campos do topo que não existem mais.
- `home.html`: carrega `home-comum.css`.

## Primeira seção
Título, avatar (96px), indicadores, espaçamentos e altura mínima (`--home-first-min`, 440–580px conforme a janela; zerada em tablet/celular).

## Verificação
Seções do Paciente fora do Início idênticas ao original (1440/900/390px); sem erros de JS.
