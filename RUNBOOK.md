# Node Lab runbook

Run commands from this repository root. The default service is local-only,
stateless for visitors, and persistent only for Node-RED runtime files.

The reusable example has no automatic restart policy and ordinarily rests
stopped with its named volume retained. The listener remains loopback-only.
The editor Compose file also has no restart policy and uses a different named
volume. A real hosted deployment may add a documented restart policy in its
private operational override.

## Start

```bash
docker compose -p node-lab-example up --detach --build
```

## Status and health

```bash
docker compose -p node-lab-example ps
curl --fail http://127.0.0.1:1880/healthz
```

## Functional acceptance

```bash
python3 tests/test_contract.py --origin http://127.0.0.1:1880 --base http://127.0.0.1:1880
```

## Logs

```bash
docker compose -p node-lab-example logs --tail 150 node-red
```

Do not post logs containing material added by downstream custom flows. This
repository's included flow logs no request body or visitor identifier.

## Stop and resume

Stop without deleting the volume:

```bash
docker compose -p node-lab-example stop
```

Resume:

```bash
docker compose -p node-lab-example start
```

## Update

1. Run the backup procedure below.
2. Review changed image/dependency pins.
3. Run `docker compose -p node-lab-example build --pull=false`.
4. Run `docker compose -p node-lab-example up --detach`.
5. Repeat health, contract and browser checks.

## Backup

```bash
mkdir -p backups
docker run --rm --network none \
  -v node_lab_example_data:/source:ro \
  -v "$PWD/backups:/backup" \
  alpine:3.22.1 \
  tar -C /source -czf /backup/node-lab-data.tar.gz .
sha256sum backups/node-lab-data.tar.gz > backups/node-lab-data.tar.gz.sha256
```

Pin or mirror the helper image before using this procedure in a controlled
production environment.

## Restore

Stop the service and restore only into the resolved Node Lab volume:

```bash
docker compose -p node-lab-example stop
sha256sum --check backups/node-lab-data.tar.gz.sha256
docker run --rm --network none \
  -v node_lab_example_data:/target \
  -v "$PWD/backups:/backup:ro" \
  alpine:3.22.1 \
  sh -eu -c 'find /target -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar -C /target -xzf /backup/node-lab-data.tar.gz'
docker compose -p node-lab-example start
```

Never point this command at a different or unresolved volume name.

## Private editor profile

The optional editor is for local authoring only, is bound to
`127.0.0.1:1882`, and uses its own volume:

```bash
docker compose -p node-lab-editor -f compose.editor.yaml up --detach --build
```

Open <http://127.0.0.1:1882/admin>. Stop it after authoring:

```bash
docker compose -p node-lab-editor -f compose.editor.yaml down
```

Do not proxy the editor or reuse the public runtime volume.

## Explicit destructive reset

This deletes only the example runtime volume and is not an ordinary stop:

```bash
docker compose -p node-lab-example down
docker volume inspect node_lab_example_data
docker volume rm node_lab_example_data
```

Take and verify a backup first unless the data is intentionally disposable.
