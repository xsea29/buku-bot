import http from "node:http";

/**
 * Minimal HTTP endpoint for hosts that require a listening port (Render web
 * services) and for uptime pingers that keep a free instance awake.
 */
export function startHealthServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(port, () => console.log(`Health endpoint listening on :${port}`));
  return server;
}
