"use strict";

const http = require("http");
const request = http.get({
    host: "127.0.0.1",
    port: 1880,
    path: "/healthz",
    timeout: 3000
}, (response) => {
    response.resume();
    process.exit(response.statusCode === 200 ? 0 : 1);
});

request.on("timeout", () => request.destroy());
request.on("error", () => process.exit(1));

