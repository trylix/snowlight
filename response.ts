const { stat, open, readFile } = Deno;

import { Response as HttpResponse, ServerRequest } from "https://deno.land/std/http/server.ts";
import { extname as pathExtname } from "https://deno.land/std/path/mod.ts";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

export class Response {
  private statusCode = 200;

  headers = new Headers();
  body?: string | Uint8Array | Deno.Reader;
  resources: Deno.Closer[] = [];

  constructor(private request: ServerRequest) {

  }

  status(statusCode: number): this {
    this.statusCode = statusCode;
    return this;
  }

  async sendStatus(statusCode: number): Promise<void> {
    this.statusCode = statusCode;

    await this.respond();
  }

  async send(body: any): Promise<void> {
    this.body = body;

    await this.respond();
  }

  async html(content: any): Promise<void> {
    this.headers.append("Content-Type", "text/html; charset=utf-8");
    this.body = content;

    await this.respond();
  }

  async json(json: any): Promise<void> {
    this.headers.append("Content-Type", "application/json");
    this.body = JSON.stringify(json);

    await this.respond();
  }

  async file(
    filePath: string,
    transform?: (src: string) => string,
  ): Promise<void> {
    const notModified = false;
    if (notModified) {
      this.statusCode = 304;
      return;
    }
    
    const extname: string = pathExtname(filePath);
    const contentType: any = lookup(extname.slice(1)) || "";
    const fileInfo = await stat(filePath);
    
    if (!fileInfo.isFile) {
      return;
    }
    
    this.headers.append("Content-Type", contentType);
    
    if (transform) {
      const bytes = await readFile(filePath);
      let str = new TextDecoder().decode(bytes);
      str = transform(str);
      this.body = new TextEncoder().encode(str);
    } else {
      const file = await open(filePath);
      this.resources.push(file);
      this.body = file;
    }

    await this.respond();
  }

  close() {
    for (let resource of this.resources) {
      resource.close();
    }
  }

  private async respond() {
    try {
      await this.request.respond(this.makeResponse());
    } finally {
      this.close();
    }
  }
  
  private makeResponse(): HttpResponse {
    let { statusCode = 200, headers, body = new Uint8Array(0) } = this;
    if (typeof body === "string") {
      body = new TextEncoder().encode(body);
      if (!headers.has("Content-Type")) {
        headers.append("Content-Type", "text/plain; charset=utf-8");
      }
    }

    return { status: statusCode, headers, body };
  }
}

export {
  Response as default,
}