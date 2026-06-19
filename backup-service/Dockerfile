FROM postgres:17-alpine

ARG SUPERCRONIC_VERSION=v0.2.46
ARG TARGETARCH=arm64

RUN apk add --no-cache curl

ENV SUPERCRONIC=supercronic-linux-${TARGETARCH}
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.46/supercronic-linux-${TARGETARCH}

RUN case "${TARGETARCH}" in \
      amd64) SHA=5bcefed628e32adc08e32634db2d10e9230dbca0 ;; \
      arm64) SHA=639ab81a72771990790df7ee87d9acfe88e5fa83 ;; \
    esac && \
    curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SHA}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

COPY entrypoint.sh /entrypoint.sh
COPY backup.sh /backup.sh
RUN chmod +x /entrypoint.sh /backup.sh

VOLUME ["/backups"]

ENTRYPOINT ["/entrypoint.sh"]
