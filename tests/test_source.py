#!/usr/bin/env python3
import json
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
NODE_RED = ROOT / "node-red"


class PublicSourceContract(unittest.TestCase):
    def test_json_files_parse(self):
        for relative in (
            "telemetry.schema.json",
            "node-red/package.json",
            "node-red/package-lock.json",
            "node-red/flows.json",
        ):
            with self.subTest(relative=relative):
                json.loads((ROOT / relative).read_text(encoding="utf-8"))

    def test_locked_versions(self):
        package = json.loads((NODE_RED / "package.json").read_text(encoding="utf-8"))
        lock = json.loads((NODE_RED / "package-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(package["dependencies"]["node-red"], "5.0.8")
        self.assertEqual(package["dependencies"]["@flowfuse/node-red-dashboard"], "1.33.0")
        self.assertEqual(lock["packages"][""]["name"], "node-lab-runtime")
        self.assertEqual(lock["packages"][""]["version"], "1.0.0")

    def test_flow_contract(self):
        flows = json.loads((NODE_RED / "flows.json").read_text(encoding="utf-8"))
        by_id = {node["id"]: node for node in flows}
        self.assertEqual(by_id["sample-http"]["url"], "/api/sample")
        self.assertEqual(by_id["sample-http"]["method"], "post")
        validator = by_id["validate-sample"]["func"]
        threshold = by_id["threshold-rule"]["func"]
        self.assertIn("[22,34]", validator)
        self.assertIn("NODE_LAB_ALLOWED_ORIGIN", validator)
        self.assertIn("statusCode = 400", validator)
        self.assertIn("temperature >= 30", threshold)
        self.assertIn("synthetic-demo", threshold)
        self.assertEqual(by_id["health-http"]["url"], "/healthz")

    def test_public_page_contract(self):
        page = (NODE_RED / "public" / "index.html").read_text(encoding="utf-8")
        self.assertIn("<title>Node Lab | Teach the Company</title>", page)
        self.assertIn('rel="canonical" href="https://teachthecompany.com/node-lab/"', page)
        self.assertIn("SYNTHETIC · NO HARDWARE", page)
        self.assertIn("No live AI inference", page)
        self.assertNotRegex(page, re.compile(r"<script(?![^>]*\bsrc=)", re.I))
        self.assertNotRegex(page, re.compile(r"<style\b", re.I))

    def test_default_compose_is_loopback_and_restricted(self):
        compose = (ROOT / "compose.yaml").read_text(encoding="utf-8")
        self.assertIn('"127.0.0.1:1880:1880"', compose)
        self.assertIn('NODE_LAB_EDITOR_ENABLED: "0"', compose)
        self.assertIn("read_only: true", compose)
        self.assertIn("no-new-privileges:true", compose)
        self.assertIn("cap_drop:", compose)
        self.assertIn("internal: true", compose)

    def test_no_private_topology_in_public_tree(self):
        forbidden = (
            re.compile(r"\b10\.(?:\d{1,3}\.){2}\d{1,3}\b"),
            re.compile(r"/(?:srv|home|root)/[A-Za-z0-9_.-]+/"),
            re.compile(r"\breceipt_id\b", re.I),
            re.compile(r"\breceiver_station", re.I),
            re.compile(r"\bprivate_address\b", re.I),
            re.compile(r"\boperator_route\b", re.I),
        )
        ignored = {".git"}
        for path in ROOT.rglob("*"):
            if not path.is_file() or any(part in ignored for part in path.parts):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            for address in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text):
                with self.subTest(path=path.relative_to(ROOT), address=address):
                    self.assertIn(address, {"127.0.0.1", "0.0.0.0"})
            for pattern in forbidden:
                with self.subTest(path=path.relative_to(ROOT), pattern=pattern.pattern):
                    self.assertIsNone(pattern.search(text))


if __name__ == "__main__":
    unittest.main()
