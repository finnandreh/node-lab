const editorEnabled = process.env.NODE_LAB_EDITOR_ENABLED === "1";

module.exports = {
    uiPort: 1880,
    uiHost: "0.0.0.0",
    flowFile: "flows.json",
    flowFilePretty: true,
    credentialSecret: false,
    disableEditor: !editorEnabled,
    httpAdminRoot: "/admin",
    httpNodeRoot: "/",
    httpStatic: "/data/public",
    httpStaticRoot: "/",
    telemetry: { enabled: false },
    diagnostics: { enabled: false, ui: false },
    runtimeState: { enabled: false, ui: false },
    functionExternalModules: false,
    externalModules: {
        autoInstall: false,
        autoInstallRetry: 0,
        palette: { allowInstall: false, allowUpload: false, allowList: [] },
        modules: { allowInstall: false, allowList: [] }
    },
    editorTheme: {
        page: { title: "Node Lab | private editor" },
        projects: { enabled: false },
        tours: false,
        palette: { editable: false }
    },
    logging: {
        console: { level: "info", metrics: false, audit: false }
    },
    httpNodeMiddleware: function (request, response, next) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        next();
    }
};

