# NextSaude - Sistema de Regulacao de Saude Municipal

Sistema completo para gestao de regulacoes, agendamentos e acompanhamento de pacientes
para secretarias municipais de saude.

---

## Indice

1. [O que e o NextSaude?](#o-que-e-o-nextsaude)
2. [Tecnologias Usadas](#tecnologias-usadas)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Como Rodar o Projeto](#como-rodar-o-projeto)
5. [Banco de Dados](#banco-de-dados)
6. [Perfis de Usuario](#perfis-de-usuario)
7. [Credenciais de Teste](#credenciais-de-teste)
8. [Telas do Sistema](#telas-do-sistema)
9. [Fluxos de Teste por Perfil](#fluxos-de-teste-por-perfil)
10. [Rotas da API](#rotas-da-api)
11. [Arquivos Importantes](#arquivos-importantes)
12. [Comandos Uteis](#comandos-uteis)

---

## O que e o NextSaude?

O NextSaude e um sistema web que ajuda secretarias de saude de cidades a gerenciar:

- **Regulacoes**: Pedidos de exames, consultas e cirurgias para cidadaos
- **Cidadaos**: Cadastro completo de pacientes com documentos
- **Agendamentos**: Marcacao de consultas e procedimentos
- **Unidades de Saude**: Hospitais, UBS, clinicas
- **Fornecedores**: Laboratorios e clinicas que prestam servicos
- **Procedimentos (Cuidados)**: Exames, consultas, cirurgias disponiveis
- **WhatsApp**: Notificacoes automaticas para pacientes
- **Relatorios**: Exportacao de dados em PDF
- **Suporte**: Sistema de tickets para ajuda tecnica

O sistema e **multi-tenant**, ou seja, cada cidade (assinante) tem seus proprios dados
isolados. Um usuario de Orlando nao ve os dados de Londres.

---

## Tecnologias Usadas

| Tecnologia | Para que serve |
|---|---|
| **Next.js 16** | Framework web (frontend + backend juntos) |
| **React 18** | Biblioteca para construir as telas/interfaces |
| **TypeScript** | JavaScript com tipos (evita erros) |
| **TailwindCSS 4** | Estilizacao das telas (CSS utilitario) |
| **PostgreSQL** | Banco de dados relacional |
| **Prisma ORM** | Ferramenta para acessar o banco de dados |
| **NextAuth v5** | Autenticacao (login/sessao) |
| **Zustand** | Gerenciamento de estado no frontend |
| **Radix UI** | Componentes de interface acessiveis |
| **AWS S3** | Armazenamento de arquivos (uploads) |
| **Evolution API** | Integracao com WhatsApp |
| **jsPDF / Puppeteer** | Geracao de documentos PDF |
| **Zod** | Validacao de dados (formularios e API) |
| **bcryptjs** | Hash de senhas (seguranca) |

---

## Estrutura do Projeto

### Frontend (usuario)
- `app/(dashboard)/` - Paginas autenticadas (com menu lateral)
- `app/(auth)/` - Login, recuperacao de senha
- `app/(public)/` - Paginas publicas (politica de privacidade, termos)
- `components/` - Componentes React reutilizaveis
- `stores/` - Estado global (Zustand)
- `hooks/` - Hooks React customizados

### Backend (servidor)
- `app/api/` - Rotas da API REST
- `lib/services/` - Logica de negocio (documentos, imagens, upload, CEP, WhatsApp, etc.)
- `lib/routines/` - Tarefas agendadas (backup, limpeza)
- `lib/templates/` - Geracao de PDF
- `lib/auth/` - Autenticacao e autorizacao
- `lib/permissions/` - Sistema de permissoes RBAC
- `lib/api/` - Middlewares e fabrica CRUD

### Compartilhado
- `lib/validators.ts` - Schemas Zod (validacao)
- `lib/constants.ts` - Constantes e enums
- `lib/format.ts` - Formatacao (CPF, data, moeda)
- `types/` - Tipos TypeScript globais
- `prisma/` - Schema do banco e migracoes

### Infraestrutura
- `middleware.ts` - Protecao de rotas (Next.js)
- `auth.ts` - Configuracao NextAuth
- `scripts/` - Scripts administrativos

## Estrutura de Pastas (detalhada)

```
nextsaude/
|
|-- app/                          # TODAS AS PAGINAS E ROTAS DA API
|   |-- (auth)/                   # Paginas de login (sem menu lateral)
|   |   |-- login/                #   Tela de login
|   |   |-- forgot-password/      #   Esqueci minha senha
|   |   |-- reset-password/       #   Redefinir senha
|   |   +-- change-password/      #   Trocar senha
|   |
|   |-- (dashboard)/              # Paginas do sistema (com menu lateral)
|   |   |-- regulations/          #   Regulacoes (criar, listar, editar)
|   |   |-- citizens/             #   Cidadaos (cadastro de pacientes)
|   |   |-- schedules/            #   Agendamentos
|   |   |-- care/                 #   Procedimentos/Cuidados
|   |   |-- units/                #   Unidades de saude
|   |   |-- suppliers/            #   Fornecedores
|   |   |-- folders/              #   Pastas de organizacao
|   |   |-- users/                #   Gestao de usuarios
|   |   |-- reports/              #   Relatorios
|   |   |-- whatsapp-programmed/  #   WhatsApp automatico
|   |   |-- settings/             #   Configuracoes pessoais
|   |   |-- tenant-settings/      #   Configuracoes da prefeitura
|   |   |-- support/              #   Tickets de suporte
|   |   |-- notifications/        #   Notificacoes
|   |   |-- audit/                #   Logs de auditoria
|   |   |-- admin/                #   PAINEL DO ADMINISTRADOR GLOBAL
|   |   |   |-- dashboard/        #     Dashboard geral
|   |   |   |-- subscribers/      #     Gerenciar assinantes (cidades)
|   |   |   |-- users/            #     Gerenciar todos os usuarios
|   |   |   |-- backups/          #     Backups do banco
|   |   |   |-- audit-logs/       #     Logs de auditoria global
|   |   |   |-- support/          #     Tickets de suporte (admin)
|   |   |   |-- routines/         #     Tarefas automaticas
|   |   |   |-- settings/         #     Configuracoes do sistema
|   |   |   +-- whatsapp/         #     Provedores WhatsApp
|   |   +-- municipal-dashboard/  #   Dashboard da prefeitura
|   |
|   |-- (public)/                 # Paginas publicas (sem login)
|   |   |-- privacy/              #   Politica de privacidade
|   |   +-- terms/                #   Termos de uso
|   |
|   +-- api/                      # BACKEND - Rotas da API
|       |-- auth/                 #   Autenticacao (login, 2FA, senha)
|       |-- citizens/             #   CRUD de cidadaos
|       |-- regulations/          #   CRUD de regulacoes
|       |-- schedules/            #   CRUD de agendamentos
|       |-- care/                 #   CRUD de procedimentos
|       |-- units/                #   CRUD de unidades
|       |-- suppliers/            #   CRUD de fornecedores
|       |-- folders/              #   CRUD de pastas
|       |-- users/                #   CRUD de usuarios
|       |-- whatsapp/             #   Integracao WhatsApp
|       |-- upload/               #   Upload de arquivos
|       |-- admin/                #   Rotas administrativas
|       |-- support/              #   Sistema de suporte
|       +-- tenant/               #   Cargos e permissoes
|
|-- components/                   # COMPONENTES REUTILIZAVEIS
|   |-- ui/                       #   Botoes, inputs, modais, cards
|   |-- layout/                   #   Menu lateral, cabecalho, rodape
|   |-- admin/                    #   Componentes do painel admin
|   |-- auth/                     #   Formularios de login
|   |-- shared/                   #   Tabelas, filtros, paginacao
|   +-- settings/                 #   Telas de configuracao
|
|-- lib/                          # TODO BACKEND + UTILIDADES
|   |-- prisma.ts                 #   Conexao com o banco de dados
|   |-- auth-helpers.ts           #   Funcoes de autenticacao
|   |-- validators.ts             #   Validacoes com Zod
|   |-- format.ts                 #   Formatacao (CPF, data, moeda)
|   |-- helpers/index.ts          #   Funcoes utilitarias gerais
|   |-- file-validation.ts        #   Validacao de arquivos (seguranca)
|   |-- template-variables.ts     #   Variaveis para templates
|   |-- translations.ts           #   Traducoes do sistema
|   |-- s3.ts                     #   Upload para AWS S3
|   |-- api-helpers.ts            #   Respostas padrao da API
|   |-- api/crud-factory.ts       #   Fabrica de CRUD generico
|   |-- api/with-rate-limit.ts    #   Limite de requisicoes
|   |-- permissions/              #   Sistema de permissoes RBAC
|   |-- services/                 #   TODOS os servicos de negocio (consolidado)
|   |-- routines/                 #   Tarefas agendadas (backup, limpeza)
|   |-- templates/                #   Geracao de PDF
|   |-- tenant/                   #   Inicializacao de assinantes
|   +-- seeds/                    #   Dados iniciais do banco
|
|-- hooks/                        # HOOKS DO REACT (logica reutilizavel)
|   |-- usePermission.ts          #   Verificar permissao do usuario
|   |-- useDebounce.ts            #   Atrasar execucao (pesquisa)
|   +-- useLocalStorage.ts        #   Salvar dados no navegador
|
|-- stores/                       # ESTADO GLOBAL (Zustand)
|   |-- authStore.ts              #   Dados do usuario logado
|   |-- notificationsStore.ts     #   Notificacoes
|   +-- ...                       #   Outros estados
|
|-- types/                        # TIPOS TYPESCRIPT GLOBAIS
|
|-- prisma/                       # BANCO DE DADOS
|   |-- schema.prisma             #   Definicao de todas as tabelas
|   |-- seed.ts                   #   Script para popular o banco
|   |-- migrations/               #   Historico de alteracoes no banco
|   +-- credenciais.txt           #   Usuarios e senhas de teste
|
|-- scripts/                      # SCRIPTS ADMINISTRATIVOS
|-- auth.ts                       # Configuracao do NextAuth (login)
|-- middleware.ts                  # Protecao de rotas (redireciona se nao logado)
+-- package.json                  # Dependencias e scripts do projeto
```

---

## Como Rodar o Projeto

### Pre-requisitos
- Node.js 20+
- PostgreSQL rodando (local ou remoto)
- Arquivo `.env` configurado

### Passo a passo

```bash
# 1. Instalar dependencias
npm install

# 2. Gerar o cliente Prisma (acesso ao banco)
npx prisma generate

# 3. Rodar as migracoes (criar tabelas no banco)
npx prisma migrate deploy

# 4. Popular o banco com dados de teste
npx prisma db seed

# 5. Iniciar o servidor de desenvolvimento
npm run dev
```

O sistema vai abrir em `http://localhost:3000`

### Resetar o banco (apagar tudo e recriar)

```bash
# Apaga TUDO, recria tabelas e roda o seed
npx prisma migrate reset --force

# Se der erro de tabelas faltando, sincronize o schema:
npx prisma db push --accept-data-loss

# Depois rode o seed manualmente:
npx prisma db seed
```

---

## Banco de Dados

O banco tem **60+ tabelas**. As principais sao:

### Tabelas de Usuarios e Acesso

| Tabela | O que guarda |
|---|---|
| `user` | Usuarios do sistema (nome, email, senha, CPF) |
| `subscriber` | Assinantes/cidades (Orlando, Londres, Roma) |
| `user_employment` | Vinculo usuario-cidade (qual cargo em qual cidade) |
| `tenant_role` | Cargos (Admin, Medico, Digitador, etc.) |
| `permission` | Permissoes (regulations.create, citizens.read, etc.) |
| `tenant_role_permission` | Qual cargo tem qual permissao |

### Tabelas do Negocio Principal

| Tabela | O que guarda |
|---|---|
| `citizen` | Cidadaos/pacientes (nome, CPF, endereco, saude) |
| `regulation` | Regulacoes - pedidos de exame/consulta/cirurgia |
| `care` | Procedimentos disponiveis (Raio-X, Consulta, etc.) |
| `care_regulation` | Quais procedimentos estao em qual regulacao |
| `schedule` | Agendamentos de consultas/exames |
| `unit` | Unidades de saude (hospitais, UBS, clinicas) |
| `supplier` | Fornecedores (laboratorios, clinicas parceiras) |
| `folder` | Pastas para organizar regulacoes |
| `group` / `sub_group` | Classificacao de procedimentos (SIGTAP) |

### Tabelas de Documentos e Arquivos

| Tabela | O que guarda |
|---|---|
| `upload` | Arquivos enviados (PDFs, imagens) |
| `document_template` | Modelos de documento (Laudo, Encaminhamento) |
| `generated_document` | Documentos gerados a partir de templates |
| `citizen_document` | Documentos do cidadao (RG, cartao SUS) |

### Tabelas de Notificacao

| Tabela | O que guarda |
|---|---|
| `notification` | Notificacoes no sistema (sino) |
| `whatsapp_config` | Configuracao da conexao WhatsApp |
| `whatsapp_programmed` | Templates de mensagem WhatsApp |
| `notification_rule` | Regras automaticas (quando enviar) |
| `notification_config` | Config por tipo de evento |

### Tabelas Administrativas

| Tabela | O que guarda |
|---|---|
| `audit_log` | Log de tudo que acontece no sistema |
| `system_config` | Configuracoes globais do sistema |
| `system_routine` | Tarefas automaticas (backup, limpeza) |
| `backup_history` | Historico de backups |
| `support_ticket` | Tickets de suporte tecnico |
| `subscription_payment` | Pagamentos dos assinantes |

---

## Perfis de Usuario

O sistema tem **2 niveis de acesso**:

### Nivel 1: System Manager (Administrador Global)

Tem acesso a **TUDO**. Gerencia todas as cidades, todos os usuarios, backups, configuracoes.
So ele ve o menu `/admin`.

**Pode fazer:**
- Criar/editar/excluir assinantes (cidades)
- Gerenciar usuarios de qualquer cidade
- Ver logs de auditoria globais
- Fazer backups do banco
- Configurar provedores WhatsApp
- Gerenciar tickets de suporte
- Resetar sistema
- "Entrar" em qualquer cidade como se fosse usuario local

### Nivel 2: Usuarios de Tenant (por cidade)

Cada cidade tem seus proprios cargos. Os cargos padrao sao:

#### Admin Municipal (Administrador da Cidade)
**Permissao:** TUDO dentro da sua cidade

- Criar/editar/excluir regulacoes, cidadaos, agendamentos
- Gerenciar usuarios da cidade
- Configurar WhatsApp
- Ver relatorios
- Gerenciar unidades, fornecedores, procedimentos
- Configuracoes da prefeitura

#### Medico (Doctor)
**Permissao:** Foco em regulacoes e atendimento

- Criar e editar regulacoes
- **Aprovar/negar regulacoes** (so medicos podem!)
- Ver cidadaos e editar dados
- Ver e confirmar agendamentos
- Ver procedimentos disponiveis
- Ver relatorios

#### Auxiliar Administrativo (Assistant)
**Permissao:** Apoio administrativo

- Criar e editar regulacoes (nao aprova)
- Ver cidadaos e editar dados
- Criar e editar agendamentos
- Ver fornecedores e unidades
- Ver relatorios
- Ver estoque

#### Farmaceutico (Pharmaceutical)
**Permissao:** Foco em estoque e medicamentos

- Ver e editar regulacoes
- Ver cidadaos
- Ver agendamentos
- Ver e editar procedimentos
- **Gerenciar estoque completo**

#### Digitador (Typist)
**Permissao:** Entrada de dados basica

- Criar regulacoes (nao edita/aprova)
- Criar e editar cidadaos
- Criar agendamentos
- Ver procedimentos

---

## Credenciais de Teste

Apos rodar o seed (`npx prisma db seed`), um arquivo `prisma/credenciais.txt`
e gerado automaticamente com todas as senhas.

### Acesso Rapido

| Email | Senha | Perfil | Cidade |
|---|---|---|---|
| kauannjacome@gmail.com | 123456 | System Manager | Global |
| admin@nextsaude.com | senha123 | System Manager | Global |
| admin.orlando@nextsaude.test | senha123 | Admin Municipal | Orlando |
| medico1.orlando@nextsaude.test | senha123 | Medico | Orlando |
| medico2.orlando@nextsaude.test | senha123 | Medico | Orlando |
| digitador1.orlando@nextsaude.test | senha123 | Digitador | Orlando |
| digitador2.orlando@nextsaude.test | senha123 | Digitador | Orlando |
| admin.londres@nextsaude.test | senha123 | Admin Municipal | Londres |
| medico1.londres@nextsaude.test | senha123 | Medico | Londres |
| medico2.londres@nextsaude.test | senha123 | Medico | Londres |
| digitador1.londres@nextsaude.test | senha123 | Digitador | Londres |
| digitador2.londres@nextsaude.test | senha123 | Digitador | Londres |
| admin.roma@nextsaude.test | senha123 | Admin Municipal | Roma |
| medico1.roma@nextsaude.test | senha123 | Medico | Roma |
| medico2.roma@nextsaude.test | senha123 | Medico | Roma |
| digitador1.roma@nextsaude.test | senha123 | Digitador | Roma |
| digitador2.roma@nextsaude.test | senha123 | Digitador | Roma |

---

## Telas do Sistema

### Telas de Login (sem menu lateral)

| Tela | Caminho | O que faz |
|---|---|---|
| Login | `/login` | Entrar com email e senha |
| Esqueci Senha | `/forgot-password` | Solicitar recuperacao de senha |
| Redefinir Senha | `/reset-password` | Criar nova senha via link no email |
| Trocar Senha | `/change-password` | Trocar senha estando logado |
| Desbloquear Conta | `/unlock-account` | Desbloquear apos 5 tentativas erradas |

### Telas Principais (com menu lateral)

| Tela | Caminho | O que faz |
|---|---|---|
| Regulacoes | `/regulations` | Lista todas as regulacoes com filtros |
| Nova Regulacao | `/regulations/new` | Formulario em 4 etapas para criar regulacao |
| Detalhe Regulacao | `/regulations/[id]` | Ver todos os dados de uma regulacao |
| Editar Regulacao | `/regulations/[id]/edit` | Editar regulacao existente |
| Imprimir Regulacao | `/regulations/[id]/print` | Gerar PDF da regulacao |
| Cidadaos | `/citizens` | Lista de todos os pacientes cadastrados |
| Novo Cidadao | `/citizens/new` | Cadastrar novo paciente |
| Detalhe Cidadao | `/citizens/[id]` | Ver perfil completo do paciente |
| Editar Cidadao | `/citizens/[id]/edit` | Editar dados do paciente |
| Agendamentos | `/schedules` | Lista de consultas/exames agendados |
| Novo Agendamento | `/schedules/new` | Criar agendamento |
| Procedimentos | `/care` | Lista de exames/consultas disponiveis |
| Novo Procedimento | `/care/new` | Cadastrar novo procedimento |
| Unidades | `/units` | Lista de hospitais/UBS/clinicas |
| Nova Unidade | `/units/new` | Cadastrar nova unidade de saude |
| Fornecedores | `/suppliers` | Lista de laboratorios e clinicas parceiras |
| Novo Fornecedor | `/suppliers/new` | Cadastrar novo fornecedor |
| Pastas | `/folders` | Organizar regulacoes em pastas |
| Usuarios | `/users` | Gerenciar usuarios da cidade |
| Novo Usuario | `/users/new` | Cadastrar novo usuario |
| Relatorios | `/reports` | Gerar relatorios em PDF |
| WhatsApp | `/whatsapp-programmed` | Configurar mensagens automaticas |
| Configuracoes | `/settings` | Perfil, senha, 2FA, tema |
| Config. Prefeitura | `/tenant-settings` | Configuracoes da cidade |
| Notificacoes | `/notifications` | Ver alertas do sistema |
| Suporte | `/support` | Abrir/ver tickets de suporte |
| Auditoria | `/audit` | Ver log de acoes no sistema |

### Telas do Admin (System Manager)

| Tela | Caminho | O que faz |
|---|---|---|
| Dashboard Admin | `/admin/dashboard` | Visao geral do sistema inteiro |
| Assinantes | `/admin/subscribers` | Gerenciar cidades cadastradas |
| Editar Assinante | `/admin/subscribers/[id]/edit` | Editar dados da cidade |
| Usuarios da Cidade | `/admin/subscribers/[id]/users` | Ver usuarios de uma cidade |
| Cargos da Cidade | `/admin/subscribers/[id]/roles` | Gerenciar cargos/permissoes |
| Usuarios Globais | `/admin/users` | Todos os usuarios do sistema |
| Logs de Auditoria | `/admin/audit-logs` | Historico global de acoes |
| Backups | `/admin/backups` | Fazer/restaurar backups |
| Rotinas | `/admin/routines` | Tarefas automaticas do sistema |
| Suporte Admin | `/admin/support` | Gerenciar todos os tickets |
| Config. Sistema | `/admin/settings` | Configuracoes globais |
| WhatsApp Admin | `/admin/whatsapp` | Provedores de WhatsApp |

---

## Fluxos de Teste por Perfil

### Como testar o SYSTEM MANAGER

Login: `kauannjacome@gmail.com` / `123456`

#### Teste 1: Ver Dashboard Admin
1. Faca login
2. Voce sera redirecionado para `/admin/dashboard`
3. Verifique: total de assinantes (3), total de usuarios, regulacoes
4. Veja a tabela de assinantes recentes
5. Veja o log de atividades recentes

#### Teste 2: Gerenciar Assinantes
1. Va em **Assinantes** no menu lateral
2. Voce deve ver: Orlando, Londres, Roma
3. Clique em um assinante para ver detalhes
4. Clique em **Editar** para alterar dados
5. Veja a aba **Usuarios** para ver quem esta vinculado

#### Teste 3: Entrar em um Assinante
1. Na lista de assinantes, clique em **Entrar** ao lado de Orlando
2. O menu lateral deve mudar (sair do modo admin)
3. Agora voce ve o sistema como se fosse um usuario de Orlando
4. Verifique que os cidadaos mostrados sao de Orlando
5. Clique em **Sair do assinante** para voltar ao modo admin

#### Teste 4: Gerenciar Backups
1. Va em **Backups** no menu lateral
2. Veja o historico de backups (4 no seed)
3. Verifique as configuracoes de backup automatico

#### Teste 5: Ver Logs de Auditoria
1. Va em **Logs de Auditoria**
2. Filtre por tipo de acao (CREATE, UPDATE, LOGIN, etc.)
3. Filtre por assinante
4. Verifique que todas as acoes sao registradas

#### Teste 6: Gerenciar Suporte
1. Va em **Suporte**
2. Veja tickets de todas as cidades
3. Abra um ticket e veja as mensagens
4. Mude o status de um ticket

---

### Como testar o ADMIN MUNICIPAL

Login: `admin.orlando@nextsaude.test` / `senha123`

#### Teste 1: Dashboard Municipal
1. Faca login
2. Voce deve ver o dashboard da cidade de Orlando
3. Verifique os numeros: cidadaos, regulacoes, agendamentos

#### Teste 2: Fluxo Completo de Regulacao (o teste mais importante!)
1. Va em **Regulacoes** > **Nova Regulacao**
2. **Etapa 1 - Selecionar Cidadao:**
   - Digite o nome de um cidadao na busca
   - Selecione um cidadao da lista
   - Verifique que a cidade do cidadao e "Orlando"
   - Clique em **Proximo**
3. **Etapa 2 - Informacoes do Pedido:**
   - Selecione um procedimento (ex: Raio-X de Torax)
   - Preencha o profissional solicitante
   - Preencha a indicacao clinica
   - Preencha o CID (ex: J06)
   - Clique em **Proximo**
4. **Etapa 3 - Documentos e Atribuicao:**
   - Opcionalmente envie um anexo
   - Selecione o status (PENDENTE)
   - Selecione um fornecedor
   - Clique em **Proximo**
5. **Etapa 4 - Revisao:**
   - Confira todos os dados
   - Clique em **Salvar**
6. Verifique que a regulacao aparece na lista

#### Teste 3: Mudar Status de Regulacao
1. Na lista de regulacoes, clique no menu de acoes (3 pontinhos)
2. Clique em **Mudar Status**
3. Mude para APROVADO, NEGADO, EM ANDAMENTO, etc.
4. Verifique que o badge de status muda

#### Teste 4: Cadastrar Cidadao
1. Va em **Cidadaos** > **Novo Cidadao**
2. Preencha: Nome, CPF, Data de Nascimento, Sexo
3. Preencha o endereco (cidade deve ser Orlando)
4. Salve e verifique que aparece na lista

#### Teste 5: Criar Agendamento
1. Va em **Agendamentos** > **Novo Agendamento**
2. Selecione uma regulacao aprovada
3. Selecione um profissional
4. Escolha data e hora
5. Salve e verifique na lista

#### Teste 6: Gerenciar Usuarios
1. Va em **Usuarios**
2. Veja os 5 usuarios de Orlando
3. Tente editar um usuario
4. Verifique os cargos atribuidos

#### Teste 7: Configurar WhatsApp
1. Va em **WhatsApp Programado**
2. Veja os templates de mensagem (4 no seed)
3. Veja as preferencias de notificacao
4. Veja a configuracao de conexao

#### Teste 8: Gerar Relatorio
1. Va em **Relatorios**
2. Selecione o tipo de relatorio (regulacoes, cidadaos, etc.)
3. Aplique filtros desejados
4. Gere o PDF

---

### Como testar o MEDICO

Login: `medico1.orlando@nextsaude.test` / `senha123`

#### Teste 1: Verificar Menu Limitado
1. Faca login
2. O menu lateral deve mostrar MENOS opcoes que o admin
3. Voce NAO deve ver: Usuarios, Configuracoes da Prefeitura, WhatsApp

#### Teste 2: Criar Regulacao
1. Va em **Regulacoes** > **Nova Regulacao**
2. Siga o mesmo fluxo de 4 etapas
3. Verifique que consegue criar normalmente

#### Teste 3: Aprovar/Negar Regulacao (exclusivo do medico!)
1. Na lista de regulacoes, ache uma com status PENDENTE
2. Clique no menu de acoes > **Mudar Status**
3. Mude para **APROVADO** - so o medico tem essa permissao!
4. Tente mudar para **NEGADO** tambem
5. Verifique que o status atualiza

#### Teste 4: Ver Cidadaos
1. Va em **Cidadaos**
2. Voce deve conseguir VER cidadaos
3. Voce deve conseguir EDITAR cidadaos
4. Verifique se pode CRIAR novos (depende da permissao)

#### Teste 5: Ver Agendamentos
1. Va em **Agendamentos**
2. Voce deve ver os agendamentos
3. Tente confirmar presenca em um agendamento

---

### Como testar o DIGITADOR

Login: `digitador1.orlando@nextsaude.test` / `senha123`

#### Teste 1: Verificar Permissoes Limitadas
1. Faca login
2. O menu deve ser o mais reduzido de todos
3. Voce NAO deve poder: aprovar regulacoes, excluir registros, gerenciar usuarios

#### Teste 2: Cadastrar Cidadao
1. Va em **Cidadaos** > **Novo Cidadao**
2. Preencha todos os campos obrigatorios
3. Salve - o digitador pode CRIAR cidadaos

#### Teste 3: Criar Regulacao
1. Va em **Regulacoes** > **Nova Regulacao**
2. Crie uma regulacao seguindo os 4 passos
3. Verifique que o status e PENDENTE (digitador nao aprova)

#### Teste 4: Tentar Acao Proibida
1. Tente acessar `/admin/dashboard` direto na URL
2. Voce deve ser redirecionado ou ver erro de acesso
3. Tente editar uma regulacao que nao criou
4. Verifique que o botao "Aprovar" NAO aparece

---

### Testes de Fluxo Entre Telas

#### Fluxo 1: Regulacao Completa (Digitador -> Medico -> Admin)
1. Login como **Digitador** (`digitador1.orlando@nextsaude.test`)
2. Crie um novo cidadao
3. Crie uma regulacao para esse cidadao (status: PENDENTE)
4. Anote o numero do protocolo
5. Faca logout

6. Login como **Medico** (`medico1.orlando@nextsaude.test`)
7. Busque a regulacao pelo protocolo
8. Analise e mude o status para **APROVADO**
9. Faca logout

10. Login como **Admin** (`admin.orlando@nextsaude.test`)
11. Busque a regulacao aprovada
12. Crie um **Agendamento** para ela
13. Verifique que o agendamento aparece na lista
14. Gere um PDF da regulacao

#### Fluxo 2: Isolamento de Dados Entre Cidades
1. Login como **Admin Orlando** (`admin.orlando@nextsaude.test`)
2. Anote quantos cidadaos existem
3. Crie um novo cidadao chamado "Teste Orlando"
4. Faca logout

5. Login como **Admin Londres** (`admin.londres@nextsaude.test`)
6. Va em **Cidadaos**
7. Busque "Teste Orlando" - NAO deve encontrar!
8. Os cidadaos devem ser TODOS de Londres

#### Fluxo 3: System Manager Navegando Entre Cidades
1. Login como **System Manager** (`kauannjacome@gmail.com`)
2. Va em **Assinantes** > **Entrar** em Orlando
3. Verifique que ve os dados de Orlando
4. Crie uma regulacao em Orlando
5. **Saia** do assinante Orlando
6. **Entre** em Londres
7. Verifique que a regulacao criada NAO aparece em Londres

#### Fluxo 4: Suporte Tecnico
1. Login como **Digitador** (`digitador1.orlando@nextsaude.test`)
2. Va em **Suporte** > **Novo Ticket**
3. Preencha: categoria BUG, assunto "Tela travando"
4. Envie o ticket
5. Faca logout

6. Login como **System Manager** (`kauannjacome@gmail.com`)
7. Va em **Admin > Suporte**
8. Encontre o ticket criado
9. Responda o ticket
10. Mude o status para RESOLVIDO

---

## Rotas da API

Todas as rotas da API ficam em `app/api/`. O padrao e:

- `GET` = buscar dados
- `POST` = criar novo registro
- `PUT` = atualizar registro existente
- `DELETE` = excluir registro

### Principais Rotas

```
AUTENTICACAO
  POST /api/auth/[...nextauth]    Login/logout
  POST /api/auth/change-password  Trocar senha
  POST /api/auth/two-factor/*     Configurar 2FA

CIDADAOS
  GET    /api/citizens            Listar cidadaos (com filtros e paginacao)
  POST   /api/citizens            Criar cidadao
  GET    /api/citizens/[id]       Buscar cidadao por ID
  PUT    /api/citizens/[id]       Atualizar cidadao
  DELETE /api/citizens/[id]       Excluir cidadao

REGULACOES
  GET    /api/regulations         Listar regulacoes
  POST   /api/regulations         Criar regulacao
  GET    /api/regulations/[id]    Buscar regulacao
  PUT    /api/regulations/[id]    Atualizar regulacao
  DELETE /api/regulations/[id]    Excluir regulacao

AGENDAMENTOS
  GET    /api/schedules           Listar agendamentos
  POST   /api/schedules           Criar agendamento
  GET    /api/schedules/[id]      Buscar agendamento
  PUT    /api/schedules/[id]      Atualizar agendamento
  DELETE /api/schedules/[id]      Excluir agendamento

PROCEDIMENTOS
  GET    /api/care                Listar procedimentos
  POST   /api/care                Criar procedimento
  GET    /api/care/[id]           Buscar procedimento
  PUT    /api/care/[id]           Atualizar procedimento
  DELETE /api/care/[id]           Excluir procedimento

UNIDADES / FORNECEDORES / PASTAS
  GET/POST   /api/units           Unidades de saude
  GET/POST   /api/suppliers       Fornecedores
  GET/POST   /api/folders         Pastas

USUARIOS
  GET/POST   /api/users           Listar/criar usuarios
  GET/PUT/DELETE /api/users/[id]  CRUD por ID

WHATSAPP
  GET/PUT  /api/whatsapp/config   Configuracao WhatsApp
  POST     /api/whatsapp/send     Enviar mensagem
  POST     /api/whatsapp/test     Testar conexao

UPLOAD
  POST   /api/upload              Enviar arquivo
  POST   /api/upload/presign      Obter URL assinada para upload direto

ADMIN (somente System Manager)
  GET    /api/admin/subscribers     Listar assinantes
  POST   /api/admin/subscribers     Criar assinante
  GET    /api/admin/audit-logs      Logs de auditoria
  GET    /api/admin/backups         Historico de backups
  POST   /api/admin/reset           Resetar dados

SUPORTE
  GET/POST /api/support/tickets     Listar/criar tickets
  POST     /api/support/tickets/[id]/resolve  Resolver ticket

CARGOS E PERMISSOES
  GET/POST /api/tenant/roles        Listar/criar cargos
  GET      /api/tenant/permissions  Listar permissoes disponiveis
```

---

## Arquivos Importantes

### Configuracao

| Arquivo | O que faz |
|---|---|
| `auth.ts` | Configura login (provedores, JWT, sessao) |
| `middleware.ts` | Protege rotas (redireciona se nao logado) |
| `.env` | Variaveis de ambiente (banco, S3, segredos) |
| `prisma/schema.prisma` | Define TODAS as tabelas do banco |
| `prisma/seed.ts` | Popula o banco com dados de teste |
| `package.json` | Dependencias e scripts |

### Logica Principal

| Arquivo | O que faz |
|---|---|
| `lib/prisma.ts` | Cria conexao unica com o banco |
| `lib/auth-helpers.ts` | Funcoes para verificar se usuario esta logado |
| `lib/auth/tenant-authorization.ts` | Verifica permissoes do usuario |
| `lib/validators.ts` | Schemas Zod para validar dados |
| `lib/format.ts` | Formata CPF, CNPJ, telefone, data, moeda |
| `lib/helpers/index.ts` | Funcoes utilitarias diversas |
| `lib/api-helpers.ts` | Respostas padrao da API (sucesso, erro) |
| `lib/api/crud-factory.ts` | Cria CRUD automatico para qualquer tabela |
| `lib/file-validation.ts` | Valida tipo e tamanho de arquivos |
| `lib/s3.ts` | Envia/busca arquivos no AWS S3 |
| `lib/template-variables.ts` | Variaveis disponiveis nos templates PDF |
| `lib/translations.ts` | Traducoes de nomes de tabelas/campos |
| `lib/permissions/` | Sistema de permissoes (verificar acesso) |
| `lib/tenant/seed-tenant.ts` | Cria cargos e permissoes para nova cidade |

### Servicos (lib/services/)

| Arquivo | O que faz |
|---|---|
| `lib/services/evolution-api-service.ts` | Conecta com API do WhatsApp |
| `lib/services/whatsapp-notification-service.ts` | Envia notificacoes WhatsApp |
| `lib/services/report-service.ts` | Gera relatorios PDF |
| `lib/services/backup-history-service.ts` | Gerencia backups |
| `lib/services/protocol-counter-service.ts` | Gera numero de protocolo |
| `lib/services/system-config-service.ts` | Le/grava configuracoes |
| `lib/services/image-service.ts` | CRUD de imagens (upload, S3, signed URLs) |
| `lib/services/upload-service.ts` | Upload de arquivos (local e S3) |
| `lib/services/document-template-service.ts` | CRUD de templates de documentos |
| `lib/services/generated-document-service.ts` | Documentos gerados a partir de templates |
| `lib/services/cep-service.ts` | Busca de endereco por CEP (ViaCEP) |
| `lib/services/types.ts` | Tipos compartilhados do sistema de templates |

---

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev                    # Iniciar servidor local
npm run build                  # Compilar para producao
npm run start                  # Rodar versao compilada

# Banco de Dados
npx prisma generate            # Gerar cliente Prisma
npx prisma migrate deploy      # Aplicar migracoes
npx prisma db seed             # Popular banco com dados de teste
npx prisma migrate reset       # RESETAR banco (apaga tudo!)
npx prisma db push             # Sincronizar schema sem migracao
npx prisma studio              # Abrir interface visual do banco

# Testes (CLI customizado)
npm test                       # Rodar suites rapidas
npm test -- --all              # Rodar TODAS as suites
npm test -- list               # Listar suites disponiveis
npm test -- run validators     # Rodar suite especifica
npm test -- interactive        # Menu interativo
npm test -- report latest      # Ver ultimo relatorio

# Linting
npx eslint .                   # Verificar codigo
npx tsc --noEmit               # Verificar tipos TypeScript
```

---

## Glossario

| Termo | Significado |
|---|---|
| **Assinante (Subscriber)** | Cidade/prefeitura que assina o sistema |
| **Regulacao (Regulation)** | Pedido de exame, consulta ou cirurgia para um cidadao |
| **Cidadao (Citizen)** | Paciente/morador cadastrado no sistema |
| **Cuidado (Care)** | Procedimento medico (exame, consulta, cirurgia) |
| **Unidade (Unit)** | Hospital, UBS ou clinica da cidade |
| **Fornecedor (Supplier)** | Laboratorio ou clinica parceira que executa procedimentos |
| **Pasta (Folder)** | Organizacao de regulacoes por periodo ou tema |
| **Cargo (Role)** | Funcao do usuario (Admin, Medico, Digitador) |
| **Permissao (Permission)** | O que cada cargo pode fazer (criar, ler, editar, excluir) |
| **Tenant** | Inquilino - cada cidade e um tenant com dados isolados |
| **SIGTAP** | Tabela nacional de procedimentos do SUS |
| **CID** | Classificacao Internacional de Doencas |
| **CNS** | Cartao Nacional de Saude (numero do SUS) |
| **2FA** | Autenticacao em dois fatores (Google Authenticator) |
| **Seed** | Dados iniciais inseridos no banco para teste |
| **Migracao** | Alteracao na estrutura do banco de dados |
