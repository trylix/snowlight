import { ServerRequest, Response as HttpResponse } from "../deps.ts";

import App from "./app.ts";
import Pipeline from "./pipeline.ts";
import Request from "./request.ts";
import Response from "./response.ts";

interface RequestOptions {
  method?: string;
  url?: string;
  host?: string;
  body?: any;
  headerValues?: Record<string, string>;
  proto?: string;
}

export class Mock {
  constructor(private app: App) {}

  async test(options: RequestOptions): Promise<HttpResponse> {
    const fakerRequest: any = this.makeRequest(options);

    const request = new Request(fakerRequest);
    const response = new Response(request);

    const pipeline = new Pipeline(
      this.app.router().middlewares(),
      request,
      response
    );

    try {
      await pipeline.dispatch();
    } catch (err) {
      await pipeline.dispatch(err);
    }

    return fakerRequest.respond(response.makeResponse());
  }

  private makeRequest({
    method = "get",
    url = "/",
    host = "localhost",
    body = "",
    headerValues = {},
    proto = "HTTP/1.1",
  }: RequestOptions): ServerRequest {
    const headers = new Headers();

    headers.set("host", host);

    for (const [key, value] of Object.entries(headerValues)) {
      headers.set(key, value);
    }

    if (body.length && !headers.has("Content-Length")) {
      headers.set("Content-Length", String(body.length));
    }

    return {
      headers,
      method: method.toUpperCase(),
      url,
      proto,
      body: this.bodyReader(body),
      async respond(res: HttpResponse): Promise<HttpResponse> {
        const { status, headers, body } = res;

        // @ts-ignore
        let bodyText = new TextDecoder().decode(body);

        const header = headers?.get("Content-Type");

        if (header?.includes("application/json")) {
          bodyText = JSON.parse(bodyText);
        }

        return {
          status,
          headers,
          body: bodyText,
        } as HttpResponse;
      },
    } as any;
  }

  private bodyReader(body: string): Deno.Reader {
    const encoder = new TextEncoder();

    const buf = encoder.encode(body);
    let offset = 0;

    return {
      async read(p: Uint8Array): Promise<number | null> {
        if (offset >= buf.length) {
          return null;
        }
        const chunkSize = Math.min(p.length, buf.length - offset);
        p.set(buf);
        offset += chunkSize;
        return chunkSize;
      },
    };
  }
}

export { Mock as default };
