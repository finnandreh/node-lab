#!/bin/sh
set -eu

release="1.0.0-public-1"
marker="/data/.node-lab-release"
current=""
if [ -f "$marker" ]; then
    current="$(head -n 1 "$marker")"
fi

if [ "$current" != "$release" ]; then
    cp /opt/node-lab/seed/flows.json /data/flows.json
    cp /opt/node-lab/seed/settings.js /data/settings.js
    rm -rf /data/public.next
    cp -R /opt/node-lab/seed/public /data/public.next
    rm -rf /data/public
    mv /data/public.next /data/public
    printf '%s\n' "$release" > "$marker"
fi

exec node /opt/node-lab/node_modules/node-red/red.js \
    --userDir /data \
    --settings /data/settings.js
