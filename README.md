# AvivaDash — Sistema de Gestão Eclesiástica

O **AvivaDash** é uma plataforma moderna e completa desenvolvida especificamente para a gestão de igrejas, como a Igreja Evangélica Avivamento Bíblico (IEAB). Ele foi projetado para ser responsivo, rápido e seguro, oferecendo painéis dinâmicos e métricas cruciais em tempo real.

## 🚀 Funcionalidades

- **Dashboard Interativo:** Visão geral da igreja (membros vivos, células, aniversariantes do dia etc).
- **Gestão de Pessoas (Membros/Visitantes):** Criação, edição, filtros avançados (status, célula, faixa etária) e deleção.
- **Gestão de Células (Grupos de Crescimento):** Mapeamento, listagem de componentes da célula (líderes vs participantes).
- **Relatórios Semanais:** Submissão de estatísticas e métricas de engajamento culto a culto/célula a célula.
- **Agenda:** Gerenciamento de eventos, serviços, e cultos programados por faixa de tempo.
- **Sistema de Notificações em Tempo Real:** Alertas acionáveis de visitantes recentes, próximos eventos e aniversariantes.
- **Autenticação e Permissões:** Perfis com escopos limitados para Administradores, Pastores e Líderes de célula.

## 🛠️ Tecnologias Utilizadas

- **[Next.js 16](https://nextjs.org/)**: App Router, Server Actions, Server Components.
- **[React](https://react.dev/)**: Componentização e reatividade (Client Components pontuais).
- **[Prisma ORM](https://www.prisma.io/)**: Mapeamento de Banco de Dados de fácil manuseio.
- **[Tailwind CSS](https://tailwindcss.com/)**: Motor principal de estilização baseada em classes utilitárias.
- **[Lucide React](https://lucide.dev/)**: Iconografia flexível e consistente.
- **[Zod](https://zod.dev/)**: Validação ponta a ponta dos esquemas de dados.
- **Auth (JWT + JOSE)**: Proteção de middlewares/proxies e sessões salvas em cookies http-only.

## 📦 Como rodar localmente (Desenvolvimento)

1. Clone o repositório (`git clone https://github.com/yurizinlala/avivadash.git` e `cd avivadash`)
2. Instale as dependências usando `--legacy-peer-deps` caso haja conflitos:
   ```bash
   npm install --legacy-peer-deps
   ```
3. O banco de dados SQLite (`dev.db`) não é versionado. Você deve criar as tabelas pela primeira vez rodando as migrations e a seed para construir a base:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
4. Inicie o servidor Next.js:
   ```bash
   npm run dev
   ```
*Acesse `http://localhost:3000`. O login padrão de administrador deve aparecer no console ou estar no arquivo seed.*

## 🚀 Como fazer o Deploy e Produção (Supabase/Vercel)

Para uso em produção, o SQLite não é recomendado pois provedores Serverless apagam arquivos estáticos a cada reboot. É recomendada a migração para o **PostgreSQL**.

### Passos de Configuração com PostgreSQL:
1. Altere o `provider` no seu `prisma/schema.prisma` de `"sqlite"` para `"postgresql"`.
2. Adicione no arquivo `.env` as variáveis de conexão com o seu banco Postgres (como o fornecido pelo **Supabase**):
   ```env
   DATABASE_URL="postgresql://usuario:senha@xyz.supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://usuario:senha@xyz.supabase.co:5432/postgres"
   JWT_SECRET="<Sua-Secreta-Forte>"
   ```
3. Exclua a pasta antiga `prisma/migrations`, e rode:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
4. Hospede o front-end via Vercel e insira essas variáveis no painel da Vercel!
