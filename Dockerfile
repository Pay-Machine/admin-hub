# Estágio 1: Build da Aplicação
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências (usando a flag que funcionou para você)
RUN npm install --legacy-peer-deps

# Copia o restante do código da aplicação
COPY . .

# Executa o build de produção
RUN npm run build

# Estágio 2: Servidor de Produção
FROM nginx:stable-alpine

# Copia os arquivos de build do estágio anterior para a pasta do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nova configuração do Nginx (que criaremos a seguir)
COPY nginx.conf /etc/nginx/conf.d

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]