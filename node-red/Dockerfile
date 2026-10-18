FROM nodered/node-red:5.0.4@sha256:10f40d0a83e7e5852b13d4d472b2006b05b1cca6d55e2f29a55a12c25a630cb6

USER root
WORKDIR /opt/node-lab

COPY node-red/package.json node-red/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --no-update-notifier \
    && npm cache clean --force

COPY node-red/settings.js node-red/flows.json node-red/runtime-entrypoint.sh node-red/healthcheck.js ./seed/
COPY node-red/public/ ./seed/public/
COPY node-red/flows.json ./seed/public/source/flows.json
COPY telemetry.schema.json ./seed/public/source/telemetry.schema.json

RUN chmod 0555 /opt/node-lab/seed/runtime-entrypoint.sh \
    && chmod 0444 /opt/node-lab/seed/settings.js /opt/node-lab/seed/flows.json /opt/node-lab/seed/healthcheck.js \
    && chmod -R a=rX /opt/node-lab/seed/public \
    && mkdir -p /data \
    && chown node-red:node-red /data

USER node-red
WORKDIR /data
ENTRYPOINT ["/opt/node-lab/seed/runtime-entrypoint.sh"]
