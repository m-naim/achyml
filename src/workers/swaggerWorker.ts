self.onmessage = async function (e) {
  try {
    let routes: any[] = [];
    let url = e.data;
    console.log("[worker] Received URL:", url);
    const jsonUrl = await resolveSwaggerJsonUrl(url);
    console.log("[worker] Resolved Swagger JSON URL:", jsonUrl);
    let swagger= await fetchJson(jsonUrl);
    routes = extractRoutes(swagger);
    self.postMessage({ ok: true, routes });
  } catch (err) {
    console.log("[worker] Error:", err);
    self.postMessage({ ok: false, error: err.message || String(err) });
  }
};

async function fetchText(url: string) {
  const res = await fetch(url);
  return res.ok ? await res.text() : null;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.ok ? await res.json() : null;
}

function extractJsUrl(
  html: string,
  base: string,
  pageUrl: string
): string | null {
  const scriptMatch = html.match(
    /<script\s+src=["']([^"']*swagger-initializer\.js)["']/i
  );
  if (!scriptMatch) return null;
  let jsPath = scriptMatch[1];
  console.log("[worker] Extracted JS path:", jsPath);
  if (jsPath.startsWith("/")) return base + jsPath;
  if (jsPath.startsWith(".")) return pageUrl + jsPath.replace(/^\./, "");
  return base + "/" + jsPath;
}

// Utility: Try to extract config from JS by parsing, fallback to regex
function extractConfigFromJs(jsText: string, base: string) {
  // Try to execute the JS in a sandboxed Function to get window.ui
  try {
    let config = {};
    // Create a fake window and SwaggerUIBundle
    const logs: string[] = [];
    const sandbox = {
      SwaggerUIStandalonePreset: {},
      SwaggerUIBundle: function (opts: any) {
        sandbox.window.ui = opts;
        return opts;
      },
      window: {
        onload: null,
        ui: null,
        location: { href: base,
            host: base
         },
      },
      console: {
        log: (...args: any[]) => logs.push("[sandbox] " + args.join(" ")),
      },
        
    };
    sandbox.SwaggerUIBundle.presets = { apis: [] };
    sandbox.SwaggerUIBundle.plugins = { DownloadUrl: {} };


    // Run the script in the sandbox
    new Function(
      "sandbox",
      `
      with(sandbox) {
        ${jsText}
      }
    `
    )(sandbox);
    sandbox.window.onload();
    logs.forEach((l) => console.log(l));

    console.log("window.ui:", sandbox.window);

    if (sandbox.window.ui) {
      config = sandbox.window.ui;
      return {
        foundJsonUrl: config.url,
        configUrl: config.configUrl,
      };
    }
  } catch (err) {
    console.log("[worker] Error executing JS in sandbox:", err);
  }
}

async function resolveSwaggerJsonUrl(pageUrl: string): Promise<string[]> {
  const base = pageUrl.replace(/\/swagger(-ui)?\/index\.html$/, "");
  const htmlText = await fetchText(pageUrl);
  if (!htmlText) throw new Error("Could not fetch Swagger HTML");
  const jsUrl = extractJsUrl(htmlText, base, pageUrl);
  console.log("jsurl", jsUrl);

  let foundJsonUrl: string[] = [];
  let configUrl = null;

  if (jsUrl) {
    const jsText = await fetchText(jsUrl);
    console.log("[worker] Fetched JS text:", jsText);

    if (jsText) {
      const config = extractConfigFromJs(jsText,base);
      console.log("[worker] Extracted config from JS:", config);

      foundJsonUrl = config.foundJsonUrl;
      configUrl = config.configUrl;
    }
  }

  // If configUrl found, fetch it and get first service url
  if (configUrl) {
    const configRes = await fetch(configUrl);
    if (configRes.ok) {
      const configJson = await configRes.json();
      if (Array.isArray(configJson.urls) && configJson.urls.length > 0) {
        for (const urlObj of configJson.urls) {
          foundJsonUrl.push(base + urlObj.url);
        }
      }
    }

    return foundJsonUrl;
  }

  if (foundJsonUrl) {
    return foundJsonUrl
  }
  // Fallback
  return [base + "/swagger/v1/swagger.json"];
}

function extractRoutes(swagger: any) {
  const routes: any[] = [];
  if (swagger.paths) {
    for (const path in swagger.paths) {
      for (const method in swagger.paths[path]) {
        const op = swagger.paths[path][method];
        routes.push({
          path,
          method: method.toUpperCase(),
          summary: op.summary || "",
          operationId: op.operationId || "",
        });
      }
    }
  }
  return routes;
}
