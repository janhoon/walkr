import WebSocket from "ws";

interface CDPResponse {
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface CDPEvent {
  method: string;
  params?: unknown;
}

export class CDPClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private listeners = new Map<string, Set<(params: unknown) => void>>();

  private constructor(ws: WebSocket) {
    this.ws = ws;

    ws.on("message", (raw: WebSocket.Data) => {
      const msg = JSON.parse(raw.toString()) as CDPResponse | CDPEvent;

      if ("id" in msg && msg.id != null) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) {
            entry.reject(new Error(`CDP error: ${msg.error.message}`));
          } else {
            entry.resolve(msg.result);
          }
        }
        return;
      }

      if ("method" in msg) {
        const handlers = this.listeners.get(msg.method);
        if (handlers) {
          for (const handler of handlers) {
            handler(msg.params);
          }
        }
      }
    });
  }

  static async connect(wsUrl: string): Promise<CDPClient> {
    const ws = new WebSocket(wsUrl, { perMessageDeflate: false });

    await new Promise<void>((resolve, reject) => {
      ws.once("open", resolve);
      ws.once("error", reject);
    });

    return new CDPClient(ws);
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params });

    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message, (err) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  on(event: string, handler: (params: unknown) => void): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);
  }

  off(event: string, handler: (params: unknown) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  once(event: string): Promise<unknown> {
    return new Promise((resolve) => {
      const handler = (params: unknown): void => {
        this.off(event, handler);
        resolve(params);
      };
      this.on(event, handler);
    });
  }

  close(): void {
    this.ws.close();
    for (const { reject } of this.pending.values()) {
      reject(new Error("CDP connection closed"));
    }
    this.pending.clear();
  }
}
