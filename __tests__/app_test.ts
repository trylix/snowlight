import { assert, assertEquals, assertStrictEq } from "../test_deps.ts";

import snowlight, { Request, Response, Next, MockAgent } from "../mod.ts";

import App from "../lib/app.ts";

Deno.test("should be able create a Application", () => {
  const app = snowlight();

  assert(app instanceof App);
});

Deno.test("should be receive 404 status code without routes", async () => {
  const app = snowlight();

  const { status } = await MockAgent(app).test({ url: "/" });

  assertStrictEq(status, 404);
});

Deno.test("should be able register middleware", async () => {
  const app = snowlight();

  let calls = 0;
  app.use(async (req: Request, res: Response) => {
    calls++;
  });

  await MockAgent(app).test({ url: "/" });

  assertStrictEq(calls, 1);
});

Deno.test(
  "should be not able execute next middleware without call next function",
  async () => {
    const app = snowlight();

    let itsMeMario;
    app.use(async (req: Request, res: Response) => {
      itsMeMario = false;
    });

    app.use(async (req: Request, res: Response) => {
      itsMeMario = true;
    });

    await MockAgent(app).test({ url: "/" });

    assertStrictEq(itsMeMario, false);
  }
);

Deno.test(
  "should be able to run the next middleware when the next function is called",
  async () => {
    const app = snowlight();

    let itsMeMario;
    app.use(async (req: Request, res: Response, next: Next) => {
      itsMeMario = false;

      return next();
    });

    app.use(async (req: Request, res: Response) => {
      itsMeMario = true;
    });

    await MockAgent(app).test({ url: "/" });

    assertStrictEq(itsMeMario, true);
  }
);

Deno.test("should be run the next middleware and then run", async () => {
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

  await MockAgent(app).test({ url: "/" });

  assertEquals(stack, [1, 3, 2, 4]);
});

Deno.test(
  "should be run the next middleware and wait finish, then run",
  async () => {
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

    await MockAgent(app).test({ url: "/" });

    assertEquals(stack, [1, 3, 4, 2]);
  }
);

Deno.test("should be handling error if throw exceptions", async () => {
  const app = snowlight();

  let receiveError = false;
  app.use((err: any, req: Request, res: Response, next: Next) => {
    receiveError = true;
  });

  app.get(async (req: Request, res: Response) => {
    throw new Error();
  });

  await MockAgent(app).test({ url: "/" });

  assertStrictEq(receiveError, true);
});

Deno.test(
  "should be return status code 500 if there no exception middleware treatment",
  async () => {
    const app = snowlight();

    app.get(async (req: Request, res: Response) => {
      throw new Error();
    });

    const response = await MockAgent(app).test({ url: "/" });

    assertStrictEq(response.status, 500);
  }
);

Deno.test(
  "should be return status code 404 if the called route has a different method",
  async () => {
    const app = snowlight();

    const fn = async (req: Request, res: Response) => {};

    app.get("/get", fn);
    app.post("/post", fn);
    app.put("/update", fn);
    app.patch("/patch", fn);
    app.delete("/delete", fn);

    const method = (method: string) => {
      return {
        method: method.toUpperCase(),
      };
    };

    let response = await MockAgent(app).test({ url: "/post" });

    assertStrictEq(response.status, 404);

    response = await MockAgent(app).test({ url: "/get", method: "post" });

    assertStrictEq(response.status, 404);

    response = await MockAgent(app).test({ url: "/patch", method: "put" });

    assertStrictEq(response.status, 404);

    response = await MockAgent(app).test({ url: "/put", method: "patch" });

    assertStrictEq(response.status, 404);

    response = await MockAgent(app).test({ url: "/delete", method: "post" });

    assertStrictEq(response.status, 404);
  }
);

Deno.test("should be able to receive expected body", async () => {
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

  let response = await MockAgent(app).test({ url: "/get" });
  assertEquals(response.body, expectedJson);

  response = await MockAgent(app).test({ url: "/post", method: "post" });
  assertEquals(response.body, expectedJson);

  response = await MockAgent(app).test({ url: "/patch", method: "patch" });
  assertEquals(response.body, expectedJson);

  response = await MockAgent(app).test({ url: "/put", method: "put" });
  assertEquals(response.body, expectedJson);

  response = await MockAgent(app).test({ url: "/delete", method: "delete" });
  assertEquals(response.body, expectedJson);
});

Deno.test("should be able receive parameters", async () => {
  const app = snowlight();

  app.post("/post/:number", async (req: Request, res: Response) => {
    return res.json({
      message: req.params.number,
    });
  });

  const response = await MockAgent(app).test({ url: "/post/10", method: "post" });
  assertEquals(response.body, { message: "10" });
});

Deno.test("should be able receive query parameters", async () => {
  const app = snowlight();

  app.get("/search", async (req: Request, res: Response) => {
    const { user_id } = req.query;

    return res.json({
      user_id,
    });
  });

  const response = await MockAgent(app).test({ url: "/search?user_id=10", method: "get" });
  assertEquals(response.body, { user_id: "10" });
});

Deno.test("should be able parse body json content", async () => {
  const app = snowlight();

  app.use(app.json());

  app.post("/register", async (req: Request, res: Response) => {
    return res.json(req.body);
  });

  const expectedJson = { name: "Yoda", email: "yoda@email.com" };

  const response = await MockAgent(app).test({
    url: "/register",
    method: "post",
    headerValues: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expectedJson),
  });

  assertEquals(response.body, expectedJson);
});

Deno.test("should be able parse body text content", async () => {
  const app = snowlight();

  app.use(app.text());

  app.post("/register", async (req: Request, res: Response) => {
    return res.send(req.body);
  });

  const expectedText = "Hello world";
  const response = await MockAgent(app).test({
    url: "/register",
    method: "post",
    headerValues: {
      "Content-Type": "text/plain",
    },
    body: expectedText,
  });

  assertEquals(response.body, expectedText);
});

Deno.test("should be able parse body form content", async () => {
  const app = snowlight();

  app.use(app.urlencoded());

  app.post("/register", async (req: Request, res: Response) => {
    return res.json(req.body);
  });

  const response = await MockAgent(app).test({
    url: "/register",
    method: "post",
    headerValues: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "name=test&bio=I+am+batman",
  });

  assertEquals(response.body, { name: "test", bio: "I am batman" });

  app.close();
});
