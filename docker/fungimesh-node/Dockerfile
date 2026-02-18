FROM ubuntu:24.04

LABEL maintainer="Omar Mohammad Abunadi"
LABEL description="QuranChain™ FungiMesh Node"
LABEL org.opencontainers.image.title="FungiMesh Node"

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_NAME=fungimesh-node
ENV NODE_ROLE=relay
ENV MESH_UPSTREAM=https://mesh.darcloud.host

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wireguard-tools \
    iproute2 \
    iptables \
    python3 \
    python3-pip \
    nodejs \
    npm \
    net-tools \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create mesh directories
RUN mkdir -p /etc/fungimesh /opt/fungimesh /var/log/fungimesh

# Copy the FungiMesh bootstrap script
COPY bootstrap.sh /opt/fungimesh/bootstrap.sh
RUN chmod +x /opt/fungimesh/bootstrap.sh

# Copy the health check server
COPY health-server.py /opt/fungimesh/health-server.py

# Copy the node config template
COPY node.conf /etc/fungimesh/node.conf

EXPOSE 8080 51820/udp

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

CMD ["/opt/fungimesh/bootstrap.sh"]
