import { assert, assertEquals, assertStrictEq } from "../test_deps.ts";

import snowlight, { Request, Response, Next } from "../mod.ts";

import App from "../lib/app.ts";

Deno.test("should be able create a Application", () => {
  const app = snowlight();

  assert(app instanceof App);
});

Deno.test("should be receive 404 status code without routes", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.listen(":3000", signal);

  const { status } = await fetch("http://localhost:3000", {
    method: "get",
  });

  assertStrictEq(status, 404);

  controller.abort();
});

Deno.test("should be able register middleware", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  let calls = 0;
  app.use(async (req: Request, res: Response) => {
    calls++;
  });

  app.listen(":3000", signal);

  await fetch("http://localhost:3000");

  assertStrictEq(calls, 1);

  controller.abort();
});

Deno.test(
  "should be not able execute next middleware without call next function",
  async () => {
    const controller = new AbortController();
    const { signal } = controller;

    const app = snowlight();

    let itsMeMario;
    app.use(async (req: Request, res: Response) => {
      itsMeMario = false;
    });

    app.use(async (req: Request, res: Response) => {
      itsMeMario = true;
    });

    app.listen(":3000", signal);

    await fetch("http://localhost:3000");

    assertStrictEq(itsMeMario, false);

    controller.abort();
  },
);

Deno.test(
  "should be able to run the next middleware when the next function is called",
  async () => {
    const controller = new AbortController();
    const { signal } = controller;

    const app = snowlight();

    let itsMeMario;
    app.use(async (req: Request, res: Response, next: Next) => {
      itsMeMario = false;

      return next();
    });

    app.use(async (req: Request, res: Response) => {
      itsMeMario = true;
    });

    app.listen(":3000", signal);

    await fetch("http://localhost:3000");

    assertStrictEq(itsMeMario, true);

    controller.abort();
  },
);

Deno.test("should be run the next middleware and then run", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  const stack: number[] = [];

  app.use(async (req: Request, res: Response, next: Next) => {
    stack.push(1);
    next();
    stack.push(2);
  });

  app.use(async (req: Request, res: Response) => {
    stack.push(3);
    await Promise.resolve();
    stack.push(4);
  });

  app.listen(":3000", signal);

  await fetch("http://localhost:3000");

  assertEquals(stack, [1, 3, 2, 4]);

  controller.abort();
});

Deno.test(
  "should be run the next middleware and wait finish, then run",
  async () => {
    const controller = new AbortController();
    const { signal } = controller;

    const app = snowlight();

    const stack: number[] = [];

    app.use(async (req: Request, res: Response, next: Next) => {
      stack.push(1);
      await next();
      stack.push(2);
    });

    app.use(async (req: Request, res: Response) => {
      stack.push(3);
      await Promise.resolve();
      stack.push(4);
    });

    app.listen(":3000", signal);

    await fetch("http://localhost:3000");

    assertEquals(stack, [1, 3, 4, 2]);

    controller.abort();
  },
);

Deno.test("should be handling error if throw exceptions", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  let receiveError = false;
  app.use((err: any, req: Request, res: Response, next: Next) => {
    receiveError = true;
  });

  app.get(async (req: Request, res: Response) => {
    throw new Error();
  });

  app.listen(":3000", signal);

  await fetch("http://localhost:3000");

  assertStrictEq(receiveError, true);

  controller.abort();
});

Deno.test(
  "should be return status code 500 if there no exception middleware treatment",
  async () => {
    const controller = new AbortController();
    const { signal } = controller;

    const app = snowlight();

    app.get(async (req: Request, res: Response) => {
      throw new Error();
    });

    app.listen(":3000", signal);

    const { status } = await fetch("http://localhost:3000");

    assertStrictEq(status, 500);

    controller.abort();
  },
);

Deno.test(
  "should be return status code 404 if the called route has a different method",
  async () => {
    const controller = new AbortController();
    const { signal } = controller;

    const app = snowlight();

    const fn = async (req: Request, res: Response) => {};

    app.get("/get", fn);
    app.post("/post", fn);
    app.put("/update", fn);
    app.patch("/patch", fn);
    app.delete("/delete", fn);

    app.listen(":3000", signal);

    const method = (method: string) => {
      return {
        method: method.toUpperCase(),
      };
    };

    let response = await fetch("http://localhost:3000/post");

    assertStrictEq(response.status, 404);

    response = await fetch("http://localhost:3000/get", method("post"));

    assertStrictEq(response.status, 404);

    response = await fetch("http://localhost:3000/patch", method("put"));

    assertStrictEq(response.status, 404);

    response = await fetch("http://localhost:3000/put", method("patch"));

    assertStrictEq(response.status, 404);

    response = await fetch("http://localhost:3000/delete", method("get"));

    assertStrictEq(response.status, 404);

    controller.abort();
  },
);

Deno.test("should be able to receive expected body", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  const expectedJson = {
    message: "Ok",
  };

  const reqFn = async (req: Request, res: Response) => {
    return res.json(expectedJson);
  };

  app.get("/get", reqFn);
  app.post("/post", reqFn);
  app.patch("/patch", reqFn);
  app.put("/put", reqFn);
  app.delete("/delete", reqFn);

  app.listen(":3000", signal);

  const method = (method: string) => {
    return {
      method: method.toUpperCase(),
    };
  };

  let response = await fetch("http://localhost:3000/get");
  let body = await response.json();

  assertEquals(body, expectedJson);

  response = await fetch("http://localhost:3000/post", method("post"));
  body = await response.json();

  assertEquals(body, expectedJson);

  response = await fetch("http://localhost:3000/patch", method("patch"));
  body = await response.json();

  assertEquals(body, expectedJson);

  response = await fetch("http://localhost:3000/put", method("put"));
  body = await response.json();

  assertEquals(body, expectedJson);

  response = await fetch("http://localhost:3000/delete", method("delete"));
  body = await response.json();

  assertEquals(body, expectedJson);

  controller.abort();
});

Deno.test("should be able receive parameters", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.post("/post/:number", async (req: Request, res: Response) => {
    return res.json({
      message: req.params.number,
    });
  });

  app.listen(":3000", signal);

  const response = await fetch("http://localhost:3000/post/10", {
    method: "POST",
  });

  const body = await response.json();

  assertEquals(body, { message: "10" });

  controller.abort();
});

Deno.test("should be able receive query parameters", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.get("/search", async (req: Request, res: Response) => {
    const { user_id } = req.query;

    return res.json({
      user_id,
    });
  });

  app.listen(":3000", signal);

  const response = await fetch("http://localhost:3000/search?user_id=10", {
    method: "GET",
  });

  const body = await response.json();

  assertEquals(body, { user_id: "10" });

  controller.abort();
});

Deno.test("should be able parse body json content", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.use(app.json());

  app.post("/register", async (req: Request, res: Response) => {
    return res.json(req.body);
  });

  app.listen(":3000", signal);

  const expectedJson = { name: "Yoda", email: "yoda@email.com" };

  const response = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expectedJson),
  });

  const body = await response.json();

  assertEquals(body, expectedJson);

  controller.abort();
});

Deno.test("should be able parse body text content", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.use(app.text());

  app.post("/register", async (req: Request, res: Response) => {
    return res.send(req.body);
  });

  app.listen(":3000", signal);

  const response = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: "Hello world",
  });

  const body = await response.text();

  assertEquals(body, "Hello world");

  controller.abort();
});

Deno.test("should be able parse body form content", async () => {
  const controller = new AbortController();
  const { signal } = controller;

  const app = snowlight();

  app.use(app.urlencoded());

  app.post("/register", async (req: Request, res: Response) => {
    return res.json(req.body);
  });

  app.listen(":3000", signal);

  const response = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "name=test&bio=I+am+batman",
  });

  const body = await response.json();

  assertEquals(body, { "name": "test", "bio": "I am batman" });

  controller.abort();
});
