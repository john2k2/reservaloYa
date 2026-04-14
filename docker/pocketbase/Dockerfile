FROM debian:bookworm-slim

ARG PB_VERSION=0.36.6

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /pb

RUN curl -fsSL -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && unzip pocketbase.zip \
  && rm pocketbase.zip \
  && chmod +x /pb/pocketbase

# Copiar hooks y migrations al crear la imagen.
# pb_data (base de datos) se monta como volumen externo para persistencia.
COPY pocketbase/pb_hooks /pb/pb_hooks
COPY pocketbase/pb_migrations /pb/pb_migrations

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
