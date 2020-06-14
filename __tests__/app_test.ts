import snowlight, { IRequest, IResponse, MockAgent } from "../mod.ts";

import App from "../lib/app.ts";
import { Route } from "../lib/types.ts";

import { assert, assertEquals, assertStrictEq } from "./deps.ts";

Deno.test("should be able create a Application", () => {
  const app = snowlight();

  assert(app instanceof App);
});

Deno.test("should be able to create http server", async () => {
  const app = snowlight();

  app.get("/", async (req, res) => {
    return res.sendStatus(200);
  });

  app.listen(3000);

  const response = await fetch("http://localhost:3000/");

  assertEquals(response.status, 200);

  app.close();
});

Deno.test("should be able to add a middleware", async () => {
  const app = new App();

  app.use(async (req: any, res: any, next: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  assertEquals(assertOne, true);
});

Deno.test("should be able to add a GET route", async () => {
  const app = new App();

  app.get("/", async (req: any, res: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  const assertTwo = app
    .router()
    .middlewares()
    .filter((element) => (element as Route).methods.includes("GET")).length > 0;

  assertEquals(assertOne && assertTwo, true);
});

Deno.test("should be able to add a POST route", async () => {
  const app = new App();

  app.post("/", async (req: any, res: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  const assertTwo = app
    .router()
    .middlewares()
    .filter((element) => (element as Route).methods.includes("POST")).length > 0;

  assertEquals(assertOne && assertTwo, true);
});

Deno.test("should be able to add a PUT route", async () => {
  const app = new App();

  app.put("/", async (req: any, res: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  const assertTwo = app
    .router()
    .middlewares()
    .filter((element) => (element as Route).methods.includes("PUT")).length > 0;

  assertEquals(assertOne && assertTwo, true);
});

Deno.test("should be able to add a PATCH route", async () => {
  const app = new App();

  app.patch("/", async (req: any, res: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  const assertTwo = app
    .router()
    .middlewares()
    .filter((element) => (element as Route).methods.includes("PATCH")).length > 0;

  assertEquals(assertOne && assertTwo, true);
});

Deno.test("should be able to add a DELETE route", async () => {
  const app = new App();

  app.delete("/", async (req: any, res: any) => {});

  const assertOne = app.router().middlewares().length > 0;

  const assertTwo = app
    .router()
    .middlewares()
    .filter((element) => (element as Route).methods.includes("DELETE")).length > 0;

  assertEquals(assertOne && assertTwo, true);
});

Deno.test("should be receive 404 status code without routes", async () => {
  const app = snowlight();

  const { status } = await MockAgent(app).test({ url: "/" });

  assertStrictEq(status, 404);
});

Deno.test("should be able register middleware", async () => {
  const app = snowlight();

  let calls = 0;
  app.use(async (req, res) => {
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
    app.use(async (req, res) => {
      itsMeMario = false;
    });

    app.use(async (req, res) => {
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
    app.use(async (req, res, next) => {
      itsMeMario = false;

      return next();
    });

    app.use(async (req, res) => {
      itsMeMario = true;
    });

    await MockAgent(app).test({ url: "/" });

    assertStrictEq(itsMeMario, true);
  }
);

Deno.test("should be run the next middleware and then run", async () => {
  const app = snowlight();

  const stack: number[] = [];

  app.use(async (req, res, next) => {
    stack.push(1);
    next();
    stack.push(2);
  });

  app.use(async (req, res) => {
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

    app.use(async (req, res, next) => {
      stack.push(1);
      await next();
      stack.push(2);
    });

    app.use(async (req, res) => {
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
  app.error((err, req, res, next) => {
    receiveError = true;
  });

  app.get(async (req, res) => {
    throw new Error();
  });

  await MockAgent(app).test({ url: "/" });

  assertStrictEq(receiveError, true);
});

Deno.test(
  "should be return status code 500 if there no exception middleware treatment",
  async () => {
    const app = snowlight();

    app.get(async (req, res) => {
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

    const fn = async (req: IRequest, res: IResponse) => {};

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

    const [resGet, resPost, resPatch, resPut, resDelete] = await Promise.all([
      MockAgent(app).test({ url: "/get", method: "delete" }),
      MockAgent(app).test({ url: "/post", method: "patch" }),
      MockAgent(app).test({ url: "/patch", method: "put" }),
      MockAgent(app).test({ url: "/put", method: "post" }),
      MockAgent(app).test({ url: "/delete", method: "get" }),
    ]);

    assertStrictEq(resGet.status, 404);
    assertStrictEq(resPost.status, 404);
    assertStrictEq(resPatch.status, 404);
    assertStrictEq(resPut.status, 404);
    assertStrictEq(resDelete.status, 404);
  }
);

Deno.test("should be able to receive expected body", async () => {
  const app = snowlight();

  const expectedJson = {
    message: "Ok",
  };

  const reqFn = async (req: IRequest, res: IResponse) => {
    return res.json(expectedJson);
  };

  app.get("/get", reqFn);
  app.post("/post", reqFn);
  app.patch("/patch", reqFn);
  app.put("/put", reqFn);
  app.delete("/delete", reqFn);

  const [resGet, resPost, resPatch, resPut, resDelete] = await Promise.all([
    MockAgent(app).test({ url: "/get" }),
    MockAgent(app).test({ url: "/post", method: "post" }),
    MockAgent(app).test({ url: "/patch", method: "patch" }),
    MockAgent(app).test({ url: "/put", method: "put" }),
    MockAgent(app).test({ url: "/delete", method: "delete" }),
  ]);

  assertEquals(resGet.body, expectedJson);
  assertEquals(resPost.body, expectedJson);
  assertEquals(resPatch.body, expectedJson);
  assertEquals(resPut.body, expectedJson);
  assertEquals(resDelete.body, expectedJson);
});

Deno.test("should be able receive parameters", async () => {
  const app = snowlight();

  app.post("/post/:number", async (req, res) => {
    return res.json({
      message: req.params.number,
    });
  });

  const response = await MockAgent(app).test({
    url: "/post/10",
    method: "post",
  });
  assertEquals(response.body, { message: "10" });
});

Deno.test("should be able receive query parameters", async () => {
  const app = snowlight();

  app.get("/search", async (req, res) => {
    const { user_id } = req.query;

    return res.json({
      user_id,
    });
  });

  const response = await MockAgent(app).test({
    url: "/search?user_id=10",
    method: "get",
  });
  assertEquals(response.body, { user_id: "10" });
});

Deno.test("should be able parse body json content", async () => {
  const app = snowlight();

  app.use(app.json());

  app.post("/register", async (req, res) => {
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

Deno.test("should be able handle requests with json array body", async () => {
  const app = snowlight();

  app.use(app.json());

  app.get("/", async (req, res) => {
    return res.json(req.body);
  });

  const expectedJson = { name: "Yoda", email: "yoda@email.com" };

  const response = await MockAgent(app).test({
    url: "/",
    method: "get",
    headerValues: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([expectedJson]),
  });

  assertEquals(response.body, [expectedJson]);
});

Deno.test(
  "should be able handle requests with json body containing whitespace",
  async () => {
    const app = snowlight();

    app.use(app.json());

    app.get("/", async (req, res) => {
      return res.json(req.body);
    });

    const expectedJson = { name: "Yoda", email: "yoda@email.com" };

    const response = await MockAgent(app).test({
      url: "/",
      method: "get",
      headerValues: {
        "Content-Type": "application/json",
      },
      body: ` \r\n\t\n${JSON.stringify(expectedJson)}\n\t\r\n `,
    });

    assertEquals(response.body, expectedJson);
  }
);

Deno.test("should be able parse body text content", async () => {
  const app = snowlight();

  app.use(app.text());

  app.post("/register", async (req, res) => {
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

  app.post("/register", async (req, res) => {
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
});

Deno.test("should be able create group routes", async () => {
  const app = snowlight();

  app.use(app.text());

  app.group("/group", [], (route) => {
    route.get(async (req, res) => {
      res.send(req.query.id);
    });

    route.post("/path/:id", async (req, res) => {
      res.send(req.params.id);
    });
  });

  const [resGet, resPost] = await Promise.all([
    MockAgent(app).test({
      url: "/group?id=10",
      method: "get",
    }),

    MockAgent(app).test({
      url: "/group/path/10",
      method: "post",
    }),
  ]);

  assertEquals(resGet.body, "10");
  assertEquals(resPost.body, "10");
});
