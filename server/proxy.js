/**
 * WebSocket 代理服务器
 * 用于连接 OpenAI Realtime API
 *
 * 运行方式: node server/proxy.js
 * 默认端口: 8768
 */

const WebSocket = require("ws");
const http = require("http");

// 配置 - Railway 使用 PORT 环境变量
const PORT = process.env.PORT || process.env.PROXY_PORT || 8768;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-z4a6qvhXCbfboOyBwL33BR66mJdHTKj5NO4pfIUSkLBm2jGF";
const OPENAI_WS_URL = "wss://api.bltcy.ai/v1/realtime?model=gpt-4o-mini-realtime-preview";

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // CORS 处理
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 健康检查
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

console.log(`WebSocket proxy server starting on port ${PORT}...`);

wss.on("connection", (clientWs, req) => {
  console.log("Client connected from:", req.socket.remoteAddress);

  // 连接到 OpenAI
  const openaiWs = new WebSocket(OPENAI_WS_URL, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  let isOpenAIConnected = false;
  const messageQueue = [];

  openaiWs.on("open", () => {
    console.log("Connected to OpenAI Realtime API");
    isOpenAIConnected = true;

    // 发送队列中的消息
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      openaiWs.send(msg);
    }
  });

  openaiWs.on("message", (data) => {
    // 转发 OpenAI 消息到客户端
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  openaiWs.on("error", (error) => {
    console.error("OpenAI WebSocket error:", error.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: { message: "OpenAI connection error: " + error.message },
        })
      );
    }
  });

  openaiWs.on("close", (code, reason) => {
    console.log("OpenAI connection closed:", code, reason?.toString());
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  // 处理客户端消息
  clientWs.on("message", (data) => {
    const message = data.toString();

    if (isOpenAIConnected && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(message);
    } else {
      // 队列消息直到连接建立
      messageQueue.push(message);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected");
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  clientWs.on("error", (error) => {
    console.error("Client WebSocket error:", error.message);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket proxy server running on ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
