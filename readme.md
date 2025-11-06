# Kanban - Desafio Veritas

Este projeto é um mini-kanban para gerenciamento de tarefas, desenvolvido em React (frontend) e Go (backend), realizado como desafio para recrutamento da Veritas Consultoria.

## Funcionalidades

- Criar, editar, excluir e mover tarefas entre colunas (A Fazer, Em Progresso, Concluída)
- Interface simples e responsiva


## Tecnologias Utilizadas

- **Frontend:** React 18, CSS puro
- **Backend:** Go 1.21, API REST


## Como rodar localmente

### 1. Backend

```bash
cd backend
go run main.go
```

O backend sobe em http://localhost:8080

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Acesse http://localhost:3000 para usar o kanban.


## Observações

- O backend usa armazenamento em memória (as tarefas somem se reiniciar o servidor).
- Projeto realizado apenas como teste técnico.

***
© 2025 Josivan Oliveira — Projeto feito como desafio de recrutamento para Veritas Consultoria.

