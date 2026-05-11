/**
 * Next.js instrumentation hook — loaded once per server process start.
 * See: https://nextjs.org/docs/app/guides/open-telemetry
 *
 * All OTel imports are dynamic so the heavy SDK is only bundled for the
 * Node.js runtime and never included in Edge runtime bundles.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { NodeSDK } = await import("@opentelemetry/sdk-node")
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-http"
  )
  const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
    "@opentelemetry/semantic-conventions"
  )

  // @opentelemetry/resources v2.x uses resourceFromAttributes instead of new Resource()
  const resourcesModule = await import("@opentelemetry/resources")
  const resourceFromAttributes =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (resourcesModule as Record<string, any>).resourceFromAttributes ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (resourcesModule as Record<string, any>).Resource

  const resource =
    typeof resourceFromAttributes === "function"
      ? resourceFromAttributes({
          [ATTR_SERVICE_NAME]:
            process.env.OTEL_SERVICE_NAME ?? "config-manager",
          [ATTR_SERVICE_VERSION]:
            process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
        })
      : new resourceFromAttributes({
          [ATTR_SERVICE_NAME]:
            process.env.OTEL_SERVICE_NAME ?? "config-manager",
          [ATTR_SERVICE_VERSION]:
            process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
        })

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      // Append /v1/traces so callers only need to set the base URL
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
        : "http://localhost:4318/v1/traces",
    }),
  })

  sdk.start()
}
