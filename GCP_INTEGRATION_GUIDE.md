# ☁️ GOOGLE CLOUD PLATFORM (GCP) INTEGRATION GUIDE — LEXIUS PAY
> **Documento de Arquitectura de Infraestructura Cloud, Seguridad de Claves y Despliegue**
> **Proyecto:** Lexius Pay (`lexius-pay`) — ETH Lima Hackathon 2026  
> **Servicios GCP:** Google Cloud Run, Secret Manager, Cloud Storage (GCS), Cloud Build  

---

## 📌 1. RESUMEN DE ARQUITECTURA GCP

Lexius Pay utiliza **Google Cloud Platform (GCP)** para alojar la infraestructura backend del **Agente de IA Resolutor** (`ai-oracle`) con seguridad de nivel empresarial, escalabilidad serverless y costo cero en reposo.

```text
               ┌─────────────────────────────────────────────────────────┐
               │                  GOOGLE CLOUD PLATFORM                  │
               │                                                         │
┌───────────┐  │  ┌────────────────────┐      ┌───────────────────────┐  │
│  Telegram │  │  │   GCP Cloud Run    │      │  GCP Secret Manager   │  │
│ Mini App  │ ─┼─►│  (ai-oracle Node)  │ ◄─── │  • ORACLE_PRIVATE_KEY │  │
│ / Next.js │  │  │  • GPT-4o Vision   │      │  • OPENAI_API_KEY     │  │
└───────────┘  │  │  • ECDSA Signer    │      │  • STYLUS_RPC_URL     │  │
               │  └──────────┬─────────┘      └───────────────────────┘  │
               │             │                                           │
               │  ┌──────────▼─────────┐                                 │
               │  │ Cloud Storage GCS  │                                 │
               │  │ (Recibos y Fotos   │                                 │
               │  │  de Disputas)      │                                 │
               │  └────────────────────┘                                 │
               └─────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │ Arbitrum Stylus     │
                          │ Smart Contract      │
                          └─────────────────────┘
```

---

## 🛡️ 2. SEGURIDAD DE CLAVES PRIVADAS: GCP SECRET MANAGER

Para cumplir con el requerimiento crítico: **"TODAS LAS PRIVATE KEYS no deben ser expuestas al GitHub"**, utilizamos **GCP Secret Manager**.

### Pasos de Configuración en GCP CLI (`gcloud`):

1. **Habilitar API de Secret Manager:**
   ```bash
   gcloud services enable secretmanager.googleapis.com cloudrun.googleapis.com
   ```

2. **Crear los Secretos en GCP:**
   ```bash
   # Clave Privada del Oráculo (Firma ECDSA secp256k1)
   gcloud secrets create ORACLE_PRIVATE_KEY --replication-policy="automatic"
   echo -n "0xYOUR_ORACLE_PRIVATE_KEY_HERE" | gcloud secrets versions add ORACLE_PRIVATE_KEY --data-file=-

   # API Key de OpenAI (GPT-4o Vision)
   gcloud secrets create OPENAI_API_KEY --replication-policy="automatic"
   echo -n "sk-proj-YOUR_OPENAI_KEY_HERE" | gcloud secrets versions add OPENAI_API_KEY --data-file=-

   # URL del RPC de Arbitrum Sepolia
   gcloud secrets create STYLUS_RPC_URL --replication-policy="automatic"
   echo -n "https://sepolia-rollup.arbitrum.io/rpc" | gcloud secrets versions add STYLUS_RPC_URL --data-file=-
   ```

---

## 🚀 3. DESPLIEGUE SERVERLESS: GOOGLE CLOUD RUN

El servicio `ai-oracle` está empaquetado en una imagen Docker ultra-liviana y se despliega en **Google Cloud Run**.

### Dockerfile para `ai-oracle/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Comando de Despliegue a Cloud Run (Staging / Production):

```bash
gcloud run deploy lexius-ai-oracle \
  --source ./ai-oracle \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="ORACLE_PRIVATE_KEY=ORACLE_PRIVATE_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,STYLUS_RPC_URL=STYLUS_RPC_URL:latest" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1
```

---

## 🖼️ 4. ALMACENAMIENTO DE EVIDENCIAS: GOOGLE CLOUD STORAGE (GCS)

Las capturas de pantalla de chats y recibos de pago presentados en las disputas se almacenan de forma segura en un Bucket de GCS.

### Configuración del Bucket:

```bash
# Crear Bucket en GCP
gcloud storage buckets create gs://lexius-dispute-evidence --location=us-central1

# Configurar Política CORS para cargas directas desde el Frontend
cat <<EOF > cors.json
[
  {
    "origin": ["http://localhost:3000", "https://lexiuspay.app", "https://*.vercel.app"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://lexius-dispute-evidence --cors-file=cors.json
```

---

## 🐳 5. REPLICA LOCAL CON DOCKER COMPOSE

Para probar todo el sistema de forma idéntica a GCP en tu máquina local:

### Archivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ai-oracle:
    build:
      context: ./ai-oracle
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    env_file:
      - ./ai-oracle/.env.local
    environment:
      - PORT=8080
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.local
    environment:
      - NEXT_PUBLIC_AI_ORACLE_URL=http://localhost:8080
    depends_on:
      - ai-oracle
```
