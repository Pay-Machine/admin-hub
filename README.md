# Vending Machine Admin App 🥤

Painel administrativo para o gerenciamento de produtos de uma máquina de vendas automática de bebidas. A aplicação permite cadastrar, visualizar, editar e deletar os itens que serão utilizados no sistema de automação e é totalmente containerizada com Docker.

-----

## ✨ Funcionalidades

  * **Gestão de Produtos (CRUD):** Interface completa para Criar, Ler, Atualizar e Deletar produtos.
  * **Formulário Intuitivo:** Adicione novos produtos facilmente, incluindo nome, preço, quantidade em estoque e imagem.
  * **Listagem Dinâmica:** Visualize todos os produtos cadastrados em uma tabela moderna e funcional.
  * **Design Responsivo:** A interface se adapta perfeitamente a diferentes tamanhos de tela, do desktop ao mobile.

-----

## 🛠️ Tecnologias Utilizadas

  * **[React](https://react.dev/):** Biblioteca para a construção de interfaces de usuário.
  * **[Vite](https://vitejs.dev/):** Ferramenta de build extremamente rápida para o desenvolvimento front-end.
  * **[TypeScript](https://www.typescriptlang.org/):** Superset do JavaScript que adiciona tipagem estática ao código.
  * **[Tailwind CSS](https://tailwindcss.com/):** Framework CSS utility-first para estilização rápida e customizável.
  * **[shadcn/ui](https://ui.shadcn.com/):** Coleção de componentes de UI reutilizáveis e acessíveis.
  * **[Docker](https://www.docker.com/):** Plataforma para desenvolvimento, deploy e execução de aplicações em contêineres.

-----

## ⚙️ Configuração do Ambiente

Antes de iniciar a aplicação, é necessário configurar as variáveis de ambiente para a conexão com o banco de dados Supabase.

1.  **Crie uma cópia do arquivo de exemplo:**

    ```sh
    cp .env.example .env
    ```

2.  **Preencha as variáveis no arquivo `.env`** com as suas credenciais do Supabase:

    ```env
    VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_ID
    VITE_SUPABASE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY
    VITE_SUPABASE_URL=SUA_URL_DO_PROJETO
    ```

-----

## 🚀 Como Executar o Projeto

Existem duas maneiras de executar o projeto: utilizando Docker (recomendado para um ambiente padronizado) ou localmente.

### 🐳 Com Docker (Recomendado)

Este método garante que a aplicação rode em um ambiente isolado e consistente.

**Pré-requisitos:**

  * [Docker](https://docs.docker.com/get-docker/)
  * [Docker Compose](https://docs.docker.com/compose/install/)

<!-- end list -->

1.  **Clone o repositório e configure o arquivo `.env`** conforme as instruções na seção de configuração.

2.  **Construa a imagem e inicie o contêiner:**

    ```sh
    docker-compose up --build -d
    ```

      * O comando irá construir a imagem Docker e iniciar o serviço em segundo plano (`-d`).

3.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:8080`.

**Para parar a aplicação:**

```sh
docker-compose down
```

### 💻 Localmente (Sem Docker)

Este método é útil para desenvolvimento e debug direto na sua máquina.

**Pré-requisitos:**

  * [Node.js](https://nodejs.org/) (versão LTS recomendada)
  * [npm](https://www.npmjs.com/) ou outro gerenciador de pacotes

<!-- end list -->

1.  **Clone o repositório:**

    ```sh
    git clone <URL_DO_SEU_REPOSITORIO_GIT>
    ```

2.  **Navegue até o diretório e configure o arquivo `.env`** conforme as instruções na seção de configuração.

    ```sh
    cd nome-do-diretorio
    ```

3.  **Instale as dependências:**

    ```sh
    npm install
    ```

4.  **Inicie o servidor de desenvolvimento:**

    ```sh
    npm run dev
    ```

5.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:5173` (ou a porta indicada no terminal).