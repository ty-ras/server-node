# Typesafe REST API Specification - Node HTTP Server Related Libraries

[![CI Pipeline](https://github.com/ty-ras/server-node/actions/workflows/ci.yml/badge.svg)](https://github.com/ty-ras/server-node/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ty-ras/server-node/actions/workflows/cd.yml/badge.svg)](https://github.com/ty-ras/server-node/actions/workflows/cd.yml)

The Typesafe REST API Specification is a family of libraries used to enable seamless development of Backend and/or Frontend which communicate via HTTP protocol.
The protocol specification is checked both at compile-time and run-time to verify that communication indeed adhers to the protocol.
This all is done in such way that it does not make development tedious or boring, but instead robust and fun!

This particular repository contains [Node HTTP server](https://nodejs.org/api/http.html) related library, which is designed to be consumed by users of TyRAS:
- [server](./server) library exposes `createServer` overloaded function to create Node server which will serve given TyRAS `AppEndpoint`s.
  All variations of Node HTTP servers are supported: [HTTP](https://nodejs.org/api/http.html), [HTTPS](https://nodejs.org/api/https.html), and [HTTP2](https://nodejs.org/api/http2.html), both secure and plain.
