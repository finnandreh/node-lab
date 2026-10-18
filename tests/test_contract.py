#!/usr/bin/env python3
import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request


def request(base, path, method="GET", origin=None, payload=None):
    url = urllib.parse.urljoin(base.rstrip("/") + "/", path.lstrip("/"))
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if origin:
        headers["Origin"] = origin
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, response.headers, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.headers, error.read()


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def get_json(base, path):
    status, _, body = request(base, path)
    return status, json.loads(body)


def validate_snapshot(snapshot, scenario):
    expect(snapshot["schemaVersion"] == "2.0.0-base", "schema version mismatch")
    expect(snapshot["scenario"]["id"] == scenario and snapshot["scenario"]["scope"] == "this-response-only", "scenario is not request-scoped")
    expect(snapshot["source"] == {
        "kind": "live-generated-emulation", "hardwareConnected": False,
        "physicalSensors": False, "customerData": False,
    }, "source truth mismatch")
    expect([station["id"] for station in snapshot["stations"]] == ["cnc-cell", "curing-oven", "packing-line"], "station contract mismatch")
    for field in ("ticksGenerated", "apiResponses", "messagesProcessed", "uptimeSeconds", "generationLatencyMs", "responseBuildMs", "tickAgeMs", "generatorIntervalMs"):
        expect(isinstance(snapshot["runtime"][field], (int, float)), f"runtime metric missing: {field}")
    encoded = json.dumps(snapshot)
    expect("comfort_margin_c" not in encoded and "comfortMarginC" not in encoded, "reserved field leaked")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:1880/")
    parser.add_argument("--origin", default="http://127.0.0.1:1880")
    args = parser.parse_args()

    status, health = get_json(args.base, "healthz")
    expect(status == 200 and health["status"] == "ok", "health contract failed")
    expect(health["version"] == "2.0.0-base", "health version mismatch")
    expect(health["generator"]["intervalMs"] == 1500 and health["generator"]["lastTickAgeMs"] <= 5000, "generator health failed")

    status, headers, page = request(args.base, "")
    expect(status == 200 and b"Node Lab | Teach the Company" in page, "public page failed")
    expect(b"LIVE-GENERATED SIMULATION" in page, "simulation disclosure missing")
    expect("text/html" in headers.get("Content-Type", ""), "page MIME type incorrect")

    status, normal_one = get_json(args.base, "api/live?scenario=normal")
    expect(status == 200, "normal snapshot failed")
    validate_snapshot(normal_one, "normal")
    time.sleep(1.7)
    status, normal_two = get_json(args.base, "api/live?scenario=normal")
    validate_snapshot(normal_two, "normal")
    expect(status == 200 and normal_two["sampleId"] > normal_one["sampleId"], "backend ticks did not advance")
    expect(normal_two["generatedAt"] != normal_one["generatedAt"], "generated timestamp did not advance")

    status, heating = get_json(args.base, "api/live?scenario=heating")
    validate_snapshot(heating, "heating")
    expect(status == 200 and any(s["health"] == "WATCH" for s in heating["stations"]), "heating state absent")

    status, fault = get_json(args.base, "api/live?scenario=fault")
    validate_snapshot(fault, "fault")
    by_id = {station["id"]: station for station in fault["stations"]}
    expect(by_id["cnc-cell"]["health"] == "ALERT", "fault alert absent")
    expect(by_id["packing-line"]["quality"] == "missing" and by_id["packing-line"]["ageMs"] >= 10000, "missing/stale state absent")

    status, recovered = get_json(args.base, "api/live?scenario=recover")
    validate_snapshot(recovered, "recover")
    expect(status == 200 and all(s["quality"] == "good" for s in recovered["stations"]), "recovery not fresh")
    expect(any(s["health"] == "RECOVERING" for s in recovered["stations"]), "recovery state absent")

    status, isolated = get_json(args.base, "api/live?scenario=normal")
    validate_snapshot(isolated, "normal")
    expect(status == 200 and all(s["quality"] == "good" for s in isolated["stations"]), "fault leaked into normal visitor")
    status, rejected = get_json(args.base, "api/live?scenario=invalid")
    expect(status == 400 and rejected.get("accepted") is False, "invalid scenario was not rejected")

    for temperature, expected in ((22, "NORMAL OPERATION"), (34, "HIGH TEMPERATURE"), (22, "NORMAL OPERATION")):
        status, _, body = request(args.base, "api/sample", method="POST", origin=args.origin, payload={"temperature": temperature})
        expect(status == 200 and json.loads(body)["status"] == expected, f"legacy sample failed: {temperature}")
    for payload in ({"temperature": 99}, {"temperature": "22"}):
        status, _, body = request(args.base, "api/sample", method="POST", origin=args.origin, payload=payload)
        expect(status == 400 and json.loads(body).get("accepted") is False, "malformed legacy sample accepted")
    status, _, _ = request(args.base, "api/sample", method="POST", origin="https://example.invalid", payload={"temperature": 22})
    expect(status == 403, "cross-origin sample was not denied")

    status, capture = get_json(args.base, "api/capture")
    expect(status == 200 and capture["reservedChange"]["performed"] is False, "recording baseline is not intact")
    for admin_path in ("admin/", "admin/flows", "admin/nodes", "admin/auth/login"):
        status, _, _ = request(args.base, admin_path)
        expect(status in (403, 404), f"editor/admin unexpectedly reachable at {admin_path}: {status}")

    print("NODE_LAB_V2_BASE_CONTRACT_OK ticks=advanced scenarios=isolated fault=stale recovery=fresh invalid=400 legacy=bounded editor_api=denied reserved_change=absent")


if __name__ == "__main__":
    main()
