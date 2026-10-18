#!/bin/sh
set -eu

release="2.0.0-1"
marker="/data/.node-lab-release"
current=""
if [ -f "$marker" ]; then
    current="$(head -n 1 "$marker")"
fi

if [ "$current" != "$release" ]; then
    cp /opt/node-lab/seed/flows.json /data/flows.json
    cp /opt/node-lab/seed/settings.js /data/settings.js
    for existing in /data/public /data/public.next; do
        if [ -d "$existing" ]; then
            chmod -R u+w "$existing"
        fi
    done
    rm -rf /data/public.next
    cp -R /opt/node-lab/seed/public /data/public.next
    find /data/public.next -type f -exec chmod 0444 {} +
    find /data/public.next -type d -exec chmod 0555 {} +
    rm -rf /data/public
    mv /data/public.next /data/public
    printf '%s\n' "$release" > "$marker"
fi

exec node /opt/node-lab/node_modules/node-red/red.js \
    --userDir /data \
    --settings /data/settings.js
