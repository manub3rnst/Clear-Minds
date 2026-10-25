# Navegação entre Login e Cadastro (Paciente e Profissional)

## Objetivo
Permitir ir do login ao cadastro (e vice-versa) sem misturar os fluxos de paciente e profissional.

## Alterações
| Página | Novo elemento | Destino |
|---|---|---|
| `login.html` | Link azul "Cadastre-se" (canto superior direito) | `cadastro-estudante.html` |
| `login-profissional.html` | Link azul "Cadastre-se" (canto superior direito) | `cadastro-profissional.html` |
| `cadastro-estudante.html` | "Já tem conta? Entrar" (canto superior direito) | `login.html` |
| `cadastro-profissional.html` | "Já tem conta? Entrar" (canto superior direito) | `login-profissional.html` |

## Decisões
- Reutiliza a classe `.top-link` já existente em `style.css` (alinhada à direita, cor `--primary`, que segue o tema claro/escuro). Nenhum CSS novo.
- Nenhum JS, ID ou classe existente foi alterado.
