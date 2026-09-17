#!/usr/bin/env node
/**
 * Ruflo Model Context Protocol (MCP) Server for Healthcare Clinical Decision Support
 * Version: 3.42.0
 * Standard: JSON-RPC 2.0 over stdio
 * Boundaries: Strict Allowlist, Role Enforcement, Deny-by-Default
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../.ruflo/tools.json");

let TOOLS_MANIFEST = [];
try {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  TOOLS_MANIFEST = JSON.parse(raw).tools || [];
} catch (err) {
  console.error("Warning: Could not load .ruflo/tools.json", err.message);
}

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

function handleToolsList(id) {
  const allowedTools = TOOLS_MANIFEST
    .filter((t) => t.category !== "FORBIDDEN")
    .map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        type: "object",
        properties: {
          caller_role: { type: "string", description: "Role of the requesting user" },
          parameters: { type: "object", description: "Tool invocation parameters" },
        },
        required: ["caller_role"],
      },
    }));

  sendResponse({
    jsonrpc: "2.0",
    id,
    result: {
      tools: allowedTools,
    },
  });
}

function handleToolsCall(id, params) {
  const { name, arguments: args } = params || {};
  const tool = TOOLS_MANIFEST.find((t) => t.name === name);

  if (!tool) {
    return sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Tool '${name}' not found in registry.`,
      },
    });
  }

  if (tool.category === "FORBIDDEN") {
    return sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: `Tool '${name}' is permanently FORBIDDEN in this healthcare environment.`,
      },
    });
  }

  const callerRole = (args?.caller_role || "").toUpperCase();
  if (callerRole !== "ADMIN" && callerRole !== "DOCTOR" && callerRole !== "CLINICIAN" && callerRole !== "INFORMATICIST" && callerRole !== "NURSE") {
    return sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32003,
        message: `Unauthorized: Role '${callerRole}' cannot execute tool '${name}'.`,
      },
    });
  }

  // Simulated controlled MCP receipt
  sendResponse({
    jsonrpc: "2.0",
    id,
    result: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "SUCCESS",
            tool_name: name,
            category: tool.category,
            data_classification: tool.dataClassification,
            executed_at: new Date().toISOString(),
          }),
        },
      ],
    },
  });
}

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      if (method === "tools/list") {
        handleToolsList(id);
      } else if (method === "tools/call") {
        handleToolsCall(id, params);
      } else if (method === "initialize") {
        sendResponse({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "ruflo-cds-mcp", version: "3.42.0" },
          },
        });
      } else {
        sendResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method '${method}' not supported.` },
        });
      }
    } catch (err) {
      sendResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error in JSON-RPC request." },
      });
    }
  });
}

if (process.argv[1] && process.argv[1].endsWith("ruflo_mcp_server.mjs")) {
  main();
}
