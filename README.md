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
3. Crie um arquivo `.env` na raiz do projeto com suas credenciais do **PostgreSQL** para desenvolvimento. (Você também deverá criá-las no Vercel no deploy produtivo).
   ```env
   DATABASE_URL="postgresql://usuario:senha@xyz.supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://usuario:senha@xyz.supabase.co:5432/postgres"
   JWT_SECRET="<Sua-Secreta-Forte>"
   ```
4. Atualize e popule o banco de dados via Prisma 7 (que agora utiliza o pg driver):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. Para gerar o Super Administrador do sistema, execute este seed extra:
   ```bash
   npx tsx prisma/seed-user.ts
   ```
   *O Email/Senha será gerado como log no terminal para fazer seu 1º login.*
6. Inicie o servidor Next.js:
   ```bash
   npm run dev
   ```
*Acesse `http://localhost:3000`.*

## 🚀 Como fazer o Deploy e Produção (Supabase/Vercel)

Para uso em produção, o **PostgreSQL** hospedado no Supabase já está acoplado usando os drivers adequados de pool (`pg` + `Prisma 7`).

### Passos de Configuração (Vercel):
1. Hospede o projeto conectando seu repositório GitHub através do portal da Vercel.
2. Na aba de `Environment Variables` insira suas 3 chaves recém criadas:
   - `DATABASE_URL` 
   - `DIRECT_URL`
   - `JWT_SECRET` (não use valores literais como "dev", crie uma random string forte)
3. Na área *Build Command* no setup da Vercel, preencha:
   ```bash
   npx prisma generate && next build
   ```
4. Finalize o Deploy. Ao término, você já pode acessar a página gerada com o login do Administrador que você rodou no passo anterior!
