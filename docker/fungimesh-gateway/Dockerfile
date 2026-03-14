FROM ubuntu:24.04

LABEL maintainer="Omar Mohammad Abunadi"
LABEL description="DarCloud FungiMesh WiFi Gateway Node"
LABEL org.opencontainers.image.title="FungiMesh WiFi Gateway"

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_NAME=fungimesh-gateway
ENV NODE_ROLE=gateway
ENV BATMAN_GW_MODE=server
ENV MESH_SSID=FungiMesh-Backhaul
ENV AP_SSID=DarCloud-WiFi
ENV AP_PASS=DarCloud2026
ENV MESH_CHANNEL=6
ENV HEALTH_PORT=8080
ENV PORTAL_PORT=8888
ENV HEARTBEAT_SEC=30
ENV DARCLOUD_API=https://darcloud.host

# Install all gateway dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wireguard-tools \
    iproute2 \
    iptables \
    nftables \
    python3 \
    python3-pip \
    python3-requests \
    nodejs \
    npm \
    net-tools \
    jq \
    bridge-utils \
    dnsmasq \
    hostapd \
    iw \
    wireless-tools \
    batctl \
    tcpdump \
    iperf3 \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /etc/fungimesh /opt/fungimesh /var/log/fungimesh /var/lib/misc

# Copy gateway server
COPY gateway-server.py /opt/fungimesh/gateway-server.py
COPY bootstrap-gateway.sh /opt/fungimesh/bootstrap-gateway.sh
RUN chmod +x /opt/fungimesh/bootstrap-gateway.sh /opt/fungimesh/gateway-server.py

# Expose: health, captive portal, WireGuard
EXPOSE 8080 8888 51820/udp

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

CMD ["/opt/fungimesh/bootstrap-gateway.sh"]
