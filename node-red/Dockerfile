FROM nodered/node-red:5.0.4@sha256:10f40d0a83e7e5852b13d4d472b2006b05b1cca6d55e2f29a55a12c25a630cb6

USER root
WORKDIR /opt/node-lab

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --no-update-notifier \
    && npm cache clean --force

COPY settings.js flows.json runtime-entrypoint.sh healthcheck.js ./seed/
COPY public/ ./seed/public/
COPY flows.json ./seed/public/source/flows.json

RUN chmod 0555 /opt/node-lab/seed/runtime-entrypoint.sh \
    && chmod 0444 /opt/node-lab/seed/settings.js /opt/node-lab/seed/flows.json /opt/node-lab/seed/healthcheck.js \
    && chmod -R a=rX /opt/node-lab/seed/public \
    && mkdir -p /data \
    && chown node-red:node-red /data

USER node-red
WORKDIR /data
ENTRYPOINT ["/opt/node-lab/seed/runtime-entrypoint.sh"]
