var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-4Y8lBK/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-4Y8lBK/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// workers/index.js
var workers_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("img");
    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *
Allow: /

# SNS\u30AF\u30ED\u30FC\u30E9\u30FC\u5411\u3051\u306E\u7279\u5225\u306A\u8A31\u53EF
User-agent: Twitterbot
Allow: /

User-agent: LinkedInbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: LINE-BOT
Allow: /`, {
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
    if (!imageUrl) {
      return new Response("\u753B\u50CFURL\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002", {
        status: 400,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        }
      });
    }
    const html = `<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u5B66\u751F\u8A3C\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\uFF01</title>
  
  <!-- OGP\u57FA\u672C\u30BF\u30B0 -->
  <meta property="og:title" content="\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u5B66\u751F\u8A3C\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\uFF01">
  <meta property="og:description" content="#\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u3067\u4F5C\u3063\u305F\u79C1\u306E\u5B66\u751F\u8A3C\u3067\u3059\uFF01">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${url.href}">
  <meta property="og:site_name" content="\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u5B66\u751F\u8A3C\u30B8\u30A7\u30CD\u30EC\u30FC\u30BF\u30FC">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@houkago_chronicle">
  <meta name="twitter:title" content="\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u5B66\u751F\u8A3C\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\uFF01">
  <meta name="twitter:description" content="#\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u3067\u4F5C\u3063\u305F\u79C1\u306E\u5B66\u751F\u8A3C\u3067\u3059\uFF01">
  <meta name="twitter:image" content="${imageUrl}">
  
  <link rel="stylesheet" href="https://yukimarugit.github.io/student-id-generator/assets/css/style.css">
  <style>
    body {
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6b46c1 0%, #3182ce 100%);
      color: white;
      font-family: 'Noto Sans JP', sans-serif;
    }
    .share-container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    .student-card {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin: 20px 0;
    }
    .share-message {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }
    .back-link {
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border: 2px solid white;
      border-radius: 6px;
      margin-top: 20px;
      display: inline-block;
      transition: all 0.3s ease;
    }
    .back-link:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <div class="share-container">
    <h1 class="share-message">\u653E\u8AB2\u5F8C\u30AF\u30ED\u30CB\u30AF\u30EB \u5B66\u751F\u8A3C\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\uFF01</h1>
    <img src="${imageUrl}" class="student-card" alt="\u5B66\u751F\u8A3C">
    <a href="https://yukimarugit.github.io/student-id-generator/" class="back-link">\u30C8\u30C3\u30D7\u306B\u623B\u308B</a>
  </div>
</body>
</html>`;
    const headers = new Headers({
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    return new Response(html, { headers });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-4Y8lBK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = workers_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-4Y8lBK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
