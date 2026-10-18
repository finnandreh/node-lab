#!/usr/bin/env python3
import argparse
import json
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:1880/")
    parser.add_argument("--origin", default="http://127.0.0.1:1880")
    args = parser.parse_args()

    status, _, body = request(args.base, "healthz")
    health = json.loads(body)
    expect(status == 200 and health == {
        "status": "ok",
        "service": "node-lab",
        "runtime": "node-red",
        "version": "1.0.0",
    }, "health contract failed")

    status, headers, page = request(args.base, "")
    expect(status == 200, "public page is not HTTP 200")
    expect(b"Node Lab | Teach the Company" in page, "page title missing")
    expect(b"SYNTHETIC" in page and b"NO HARDWARE" in page, "truth labels missing")
    expect("text/html" in headers.get("Content-Type", ""), "page MIME type incorrect")

    sequence = ((22, "NORMAL OPERATION"), (34, "HIGH TEMPERATURE"), (22, "NORMAL OPERATION"))
    for temperature, expected in sequence:
        status, _, body = request(
            args.base,
            "api/sample",
            method="POST",
            origin=args.origin,
            payload={"temperature": temperature},
        )
        result = json.loads(body)
        expect(status == 200, f"sample {temperature} returned {status}")
        expect(result["temperature"] == temperature, "temperature mismatch")
        expect(result["threshold"] == 30, "threshold mismatch")
        expect(result["status"] == expected, "status mismatch")
        expect(result["source"] == "synthetic-demo", "source label mismatch")

    status, _, body = request(
        args.base,
        "api/sample",
        method="POST",
        origin=args.origin,
        payload={"temperature": 99},
    )
    invalid = json.loads(body)
    expect(status == 400 and invalid.get("accepted") is False, "invalid 99 was not rejected")

    status, _, _ = request(
        args.base,
        "api/sample",
        method="POST",
        origin="https://example.invalid",
        payload={"temperature": 22},
    )
    expect(status == 403, "cross-origin sample was not denied")

    status, _, body = request(args.base, "api/info")
    info = json.loads(body)
    expect(status == 200 and info["synthetic"] is True, "truth endpoint failed")
    expect(info["physicalDevice"] is False and info["liveAiInference"] is False, "truth boundary failed")

    status, _, _ = request(args.base, "admin/")
    expect(status in (403, 404), f"editor/admin unexpectedly reachable: {status}")

    print("NODE_LAB_CONTRACT_OK normal=22 alert=34 recovery=22 invalid=400 cross_origin=403 editor=denied")


if __name__ == "__main__":
    main()

