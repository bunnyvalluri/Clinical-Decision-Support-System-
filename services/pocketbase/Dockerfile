FROM alpine:3.20

ARG PB_VERSION=0.25.9

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl \
    tzdata

# Download official pinned release binary
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

WORKDIR /pb

# Copy reproducible JavaScript migrations
COPY pb_migrations /pb/pb_migrations

# Expose default PocketBase port
EXPOSE 8090

# Health check against PocketBase health endpoint
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1:8090/api/health || exit 1

# Start PocketBase with persistent data directory
VOLUME ["/pb/pb_data"]
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]
