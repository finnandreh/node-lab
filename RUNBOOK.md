# Node Lab runbook

Run commands from this repository root. The reusable example is loopback-only,
rests stopped when unused and retains only its named Node-RED data volume.

## Start, status and acceptance

    docker compose -p node-lab-example up --detach --build
    docker compose -p node-lab-example ps
    curl --fail http://127.0.0.1:1880/healthz
    python3 tests/test_contract.py --base http://127.0.0.1:1880 --origin http://127.0.0.1:1880

The contract waits for two backend ticks and verifies normal, heating, fault,
stale, recovery and invalid paths without writing a shared scenario.

## Logs

    docker compose -p node-lab-example logs --tail 150 node-red

The included flow does not log request bodies, visitor identifiers or headers.

## Stop and resume

    docker compose -p node-lab-example stop
    docker compose -p node-lab-example start

After resume, repeat health and functional acceptance. The named volume must
remain present.

## Update

1. Back up the named volume.
2. Review changed source, base-image and dependency pins.
3. Run python3 -m unittest tests/test_source.py.
4. Run docker compose -p node-lab-example build --pull=false.
5. Recreate only this Compose project and repeat health, contract and browser
   checks.
6. Keep the previous image and backup until the new release is accepted.

## Backup

    mkdir -p backups
    docker run --rm --network none \
      -v node_lab_example_data:/source:ro \
      -v "$PWD/backups:/backup" \
      alpine:3.22.1 \
      tar -C /source -czf /backup/node-lab-data.tar.gz .
    sha256sum backups/node-lab-data.tar.gz > backups/node-lab-data.tar.gz.sha256

Pin or mirror the helper image before controlled production use.

## Restore

    docker compose -p node-lab-example stop
    sha256sum --check backups/node-lab-data.tar.gz.sha256
    docker run --rm --network none \
      -v node_lab_example_data:/target \
      -v "$PWD/backups:/backup:ro" \
      alpine:3.22.1 \
      sh -eu -c 'find /target -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar -C /target -xzf /backup/node-lab-data.tar.gz'
    docker compose -p node-lab-example start

Resolve and inspect the exact volume first. Never point the command at a
different volume.

## Private editor profile

    docker compose -p node-lab-editor -f compose.editor.yaml up --detach --build

Open http://127.0.0.1:1882/admin. It uses a separate volume. Stop it after
authoring and never proxy it:

    docker compose -p node-lab-editor -f compose.editor.yaml down

## Explicit destructive reset

This is not an ordinary stop:

    docker compose -p node-lab-example down
    docker volume inspect node_lab_example_data
    docker volume rm node_lab_example_data

Back up first unless the data is intentionally disposable.
