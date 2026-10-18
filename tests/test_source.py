#!/usr/bin/env python3
import json
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
NODE_RED = ROOT / "node-red"


class PublicSourceContract(unittest.TestCase):
    def read(self, relative):
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_json_files_parse(self):
        for relative in ("telemetry.schema.json", "node-red/package.json", "node-red/package-lock.json", "node-red/flows.json"):
            with self.subTest(relative=relative):
                json.loads(self.read(relative))

    def test_locked_versions(self):
        package = json.loads(self.read("node-red/package.json"))
        lock = json.loads(self.read("node-red/package-lock.json"))
        self.assertEqual(package["dependencies"]["node-red"], "5.0.8")
        self.assertEqual(package["dependencies"]["@flowfuse/node-red-dashboard"], "1.33.0")
        self.assertEqual(lock["packages"][""]["name"], "node-lab-runtime")
        self.assertEqual(lock["packages"][""]["version"], "2.0.0-base.1")

    def test_live_generator_and_request_scoped_scenarios(self):
        flows = json.loads(self.read("node-red/flows.json"))
        by_id = {node["id"]: node for node in flows}
        self.assertEqual(by_id["live-tick"]["repeat"], "1.5")
        generator = by_id["generate-workshop-tick"]["func"]
        response = by_id["build-live-response"]["func"]
        self.assertIn("const stations = [", generator)
        self.assertEqual(generator.count("id:'"), 3)
        self.assertIn("flow.set('latestTick', tick)", generator)
        self.assertIn("msg.req?.query?.scenario", response)
        self.assertIn("scope:'this-response-only'", response)
        self.assertIn("live-generated-emulation", response)
        self.assertIn("messagesProcessed", response)
        self.assertNotIn("flow.set('scenario'", response)
        self.assertEqual(by_id["live-http"]["url"], "/api/live")
        self.assertEqual(by_id["health-http"]["url"], "/healthz")

    def test_reserved_change_is_functionally_absent(self):
        executing = "\n".join((self.read("node-red/flows.json"), self.read("node-red/public/app.js"), self.read("telemetry.schema.json")))
        self.assertNotIn("comfort_margin_c", executing)
        self.assertNotIn("comfortMarginC", executing)
        page = self.read("node-red/public/index.html")
        self.assertIn("reserved Comfort margin extension is deliberately absent", page)
        self.assertNotIn('data-field="comfort-margin"', page)

    def test_public_page_contract(self):
        page = self.read("node-red/public/index.html")
        self.assertIn("<title>Node Lab | Teach the Company</title>", page)
        self.assertIn('rel="canonical" href="https://teachthecompany.com/node-lab/"', page)
        self.assertIn("LIVE-GENERATED SIMULATION", page)
        self.assertIn("REAL APPLICATION TELEMETRY", page)
        for station in ("CNC Cell", "Curing Oven", "Packing Line"):
            self.assertIn(station, page)
        self.assertNotRegex(page, re.compile(r"<script(?![^>]*\bsrc=)", re.I))
        self.assertNotRegex(page, re.compile(r"<style\b", re.I))

    def test_schema_is_packaged_from_single_source(self):
        dockerfile = self.read("node-red/Dockerfile")
        self.assertIn("COPY telemetry.schema.json ./seed/public/source/telemetry.schema.json", dockerfile)
        schema = json.loads(self.read("telemetry.schema.json"))
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], "2.0.0-base")

    def test_default_compose_is_loopback_and_restricted(self):
        compose = self.read("compose.yaml")
        self.assertIn('"127.0.0.1:1880:1880"', compose)
        self.assertIn('NODE_LAB_EDITOR_ENABLED: "0"', compose)
        self.assertIn("read_only: true", compose)
        self.assertIn("no-new-privileges:true", compose)
        self.assertIn("cap_drop:", compose)
        self.assertNotIn("network_mode: host", compose)

    def test_production_admin_root_is_disabled(self):
        settings = self.read("node-red/settings.js")
        self.assertIn('httpAdminRoot: editorEnabled ? "/admin" : false', settings)

    def test_no_private_topology_in_public_tree(self):
        forbidden = (
            re.compile(r"\b10\.(?:\d{1,3}\.){2}\d{1,3}\b"),
            re.compile(r"/(?:srv|home|root)/[A-Za-z0-9_.-]+/"),
            re.compile(r"\breceipt_id\b", re.I),
            re.compile(r"\breceiver_station", re.I),
            re.compile(r"\bprivate_address\b", re.I),
            re.compile(r"\boperator_route\b", re.I),
        )
        for path in ROOT.rglob("*"):
            if not path.is_file() or ".git" in path.parts:
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
