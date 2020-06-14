<p  align="center"><img  src=".github/snowlight.png"  width="400"></p>

<p  align="center">
<a  href="/LICENSE"><img  src="https://img.shields.io/github/license/trylix/snowlight"  alt="License"></a>
</p>

## Overview

Snowlight is a web application server framework for [Deno](https://deno.land/) 🦕. This project is currently under development and may be unstable, use in production applications is not recommended.

This middleware framework is inspired by [Express](http://expressjs.com/).

## Quick Start

Create the ``server.ts`` file:

``mkdir ./my-application && cd ./my-application && touch server.ts``

Copy and paste this code in the ``server.ts`` file:

```typescript
import snowlight from "https://deno.land/x/snowlight/mod.ts";

const app = snowlight();

app.get("/", async (req, res) => {
	res.send('Hello world!');
});

app.listen({
	port: 3000
}, () => console.log("Server started! 🔥"));
```

Start the server:

``deno run --allow-net --allow-read server.ts``

View the website at: http://localhost:3000

## API reference ``0.1.x``

## snowlight()

The `snowlight()` function creates a Snowlight application. It's a top-level function exported by the snowlight module.

```typescript
import snowlight from "https://deno.land/x/snowlight/mod.ts";

const app = snowlight();
```

## Router()

The  `Router()`  function creates a new router object which can be used with an `app` to enable routing based on the pathname of the request. It's exported by the snowlight module.

```typescript
import snowlight, { Router } from  "https://deno.land/x/snowlight/mod.ts";

const app =  snowlight();
const routes =  Router();

app.use(routes);
```

## Application

### app.json()

Returns middleware that only parses JSON and only looks at requests where the Content-Type header matches the type option.

A new `body` object containing the parsed data is populated on the `request` object after the middleware (i.e. `req.body`), or an empty object (`{}`) if there was no body to parse, the `Content-Type` was not matched, or an error occurred.

```typescript
import snowlight from "https://deno.land/x/snowlight/mod.ts";

const app = snowlight();

app.use(app.json());
```

### app.static_content(root `[, options]`)

It serves static files. The `root` argument specifies the root directory from which to serve static assets. The function determines the file to serve by combining `req.url` with the provided `root` directory. When a file is not found, instead of sending a 404 response, it instead calls `next()` to move on to the next middleware, allowing for stacking and fall-backs.

```typescript
app.use(app.static_content(${Deno.cwd()}/my-public-directory));
```

```typescript
app.use("/myroute", app.static_content(${Deno.cwd()}/my-public-directory));
```

The following table describes the properties of the `options` object.

<table>
<thead>
<tr>
<th>Property</th>
<th>Description</th>
<th>Type</th>
<th>Default</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>index</code></td>
<td>Sends the specified directory index file. Set to <code>false</code> to disable directory indexing.</td>
<td><code>string</code>/<code>undefined</code></td>
<td>“index.html”</td>
</tr>
<tr>
<td><code>fallthrough</code></td>
<td>Let client errors fall-through as unhandled requests, otherwise forward a client error. </td>
<td><code>boolean</code>/<code>undefined</code></td>
<td><code>true</code></td>
</tr>
<tr>
<td><code>maxAge</code></td>
<td>Set the max-age property of the Cache-Control header.</td>
<td><code>number</code>/<code>undefined</code></td>
<td>0</td>
</tr>
<tr>
<td><code>immutable</code></td>
<td>Enable or disable the <code>immutable</code> directive in the <code>Cache-Control</code> response header. If enabled, the <code>maxAge</code> option should also be specified to enable caching. </td>
<td><code>boolean</code>/<code>undefined</code></td>
<td><code>false</code></td>
</tr>
<tr>
<td><code>lastModified</code></td>
<td>Set the <code>Last-Modified</code> header to the last modified date of the file on the OS.</td>
<td><code>boolean</code>/<code>undefined</code></td>
<td><code>true</code></td>
</tr>
<tr>
<td><code>redirect</code></td>
<td>Redirect to trailing “/” when the pathname is a directory.</td>
<td><code>boolean</code>/<code>undefined</code></td>
<td><code>true</code></td>
</tr>
</tbody>
</table>

### app.urlencoded()

It parses incoming requests with urlencoded payloads. A new `body` object containing the parsed data is populated on the `request` object after the middleware (i.e. `req.body`), or an empty object (`{}`) if there was no body to parse, the `Content-Type` was not matched, or an error occurred.

```typescript
app.use(app.urlencoded());
```

### app.`METHOD`(path, callback `[, callback ...]`)
>### [routes](#routes).`METHOD`(path, callback `[, callback ...]`)

Routes an HTTP request, where METHOD is the HTTP method of the request, such as GET, PUT, POST, and so on, in lowercase. Thus, the actual methods are  `app.get()`,  `app.post()`,  `app.put()`, and so on.

Snowlight supports the following routing methods corresponding to the HTTP methods of the same names:

-   `delete`
-   `get`
-   `patch`
-   `post`
-   `put`

<table>
<tbody><tr>
<th>Argument </th>
<th>Description</th>
<th style="width: 100px;"> Default </th>
</tr>
<tr>
<td><code>path</code></td>
<td>
The path for which the middleware function is invoked.
</td>
<td><code>/</code><br><small>(root path)</smal></td>
</tr>
<tr>
<td> <code>callback</code></td>
<td>
Callback functions; can be:
<ul>
<li>A middleware function.</li>
<li>A series of middleware functions (separated by commas).</li>
<li>An array of middleware functions.</li>
<li>A combination of all of the above.</li>
</ul>
<p>
You can provide multiple callback functions that behave just like middleware.
</p>
</td>
<td><code>none</code></td>
</tr></tbody></table>

### app.use(`[path,]` callback `[, callback...]`)
>### [routes](#routes).use(`[path,]` callback `[, callback...]`)

Mounts the specified middleware function or functions at the specified path: the middleware function is executed when the base of the requested path matches `path`.

<table>
<tbody><tr>
<th>Argument </th>
<th>Description</th>
<th style="width: 100px;"> Default </th>
</tr>
<tr>
<td><code>path</code></td>
<td>
The path for which the middleware function is invoked.
</td>
<td><code>/</code><br><small>(root path)</smal></td>
</tr>
<tr>
<td> <code>callback</code></td>
<td>
Callback functions; can be:
<ul>
<li>A middleware function.</li>
<li>A series of middleware functions (separated by commas).</li>
<li>An array of middleware functions.</li>
<li>A combination of all of the above.</li>
</ul>
<p>
You can provide multiple callback functions that behave just like middleware.
</p>
</td>
<td><code>none</code></td>
</tr></tbody></table>

### app.group(path, attributes`[]`, callback)
>### [routes](#routes).group(path, attributes`[]`, callback)

Mounts a group with shared middleware function or functions at the specified path.

```typescript
app.group("/route", [middlewareOne, middlewareTwo /*, ...*/], (route) => {
	// "/route/:id" equivalent
	route.put("/:id", controller.update);

	// "/route" equivalent
	route.delete(controller.delete)
});
```

```typescript
app.group("/route/:id", middlewareOne, (route) => {
	// "/route/:id/user" equivalent
	route.get("/user", middlewareTwo, middlewareThree, controller.index);

	// "/route/:id" equivalent
	route.put(middlewareTwo, controller.update);

	// "/route/:id" equivalent
	route.delete(controller.delete)
});
```

<table>
<tbody><tr>
<th>Argument </th>
<th>Description</th>
<th style="width: 100px;"> Default </th>
</tr>
<tr>
<td><code>path</code></td>
<td>
The path for which the middleware function is invoked.
</td>
<td><code>/</code><br><small>(root path)</smal></td>
</tr>
<tr>
<td> <code>attributes</code></td>
<td>
Attributes functions; can be:
<ul>
<li>A middleware function.</li>
<li>An array of middleware functions.</li>
</ul>
<p>
You can provide multiple attributes functions that behave just like middleware for all routes in group.
</p>
</td>
<td><code>none</code></td>
<tr>
<td> <code>callback</code></td>
<td>
<p>
It is a function that receives a parameter of type <code>IRoute</code>, responsible for manipulating the routes of the group.
<code>IRoute</code> is exported from the snowlight module.
</p>
</td>
<td><code>none</code></td>
</tr></tbody></table>

### app.listen(addr `[, callback]`)

Create a HTTP server

```typescript
app.listen({
	port:  3333, // 0.0.0.0:3333
}, () =>  console.log("Server started! 🔥"));
```

<table>
<tbody><tr>
<th>Argument </th>
<th>Description</th>
<th style="width: 100px;"> Default </th>
</tr>
<tr>
<td><code>addr</code></td>
<td>
Settings for creating an HTTP server; Can be:
<ul>
<li>A string like <code>127.0.0.1:3000</code>.</li>
<li>A <code>HTTPOptions</code> object.</li>
</ul>
</td>
<td><code>none</code></td>
</tr>
<tr>
<td> <code>callback</code></td>
<td>
A callback function
</td>
<td><code>none</code></td>
</tbody></table>

## Contributing

Thank you for being interested on making this package better. Any contribution you make will be greatly appreciated.

Any change to resources in this repository must be through pull requests. This applies to all changes to documentation, code, binary files, etc.

Log an issue for any question or problem you might have. When in doubt, log an issue, and any additional policies about what to include will be provided in the responses. The only exception is security disclosures which should be sent privately.

Please be courteous and respectful.

## License

[MIT](LICENSE)
