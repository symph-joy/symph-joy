// import { MessageEvent } from '@nestjs/common/interfaces';
import { IncomingMessage, OutgoingHttpHeaders } from "http";
import { Transform } from "stream";

function toDataString(data: string | object): string {
  if (typeof data === "object") {
    return toDataString(JSON.stringify(data));
  }

  return data
    .split(/\r\n|\r|\n/)
    .map((line) => `data: ${line}\n`)
    .join("");
}

interface WriteHeaders {
  writeHead?(
    statusCode: number,
    reasonPhrase?: string,
    headers?: OutgoingHttpHeaders
  ): void;
  writeHead?(statusCode: number, headers?: OutgoingHttpHeaders): void;
  flushHeaders?(): void;
}

export type HeaderStream = NodeJS.WritableStream & WriteHeaders;

/**
 * Adapted from https://raw.githubusercontent.com/EventSource/node-ssestream
 * Transforms "messages" to W3C event stream content.
 * See https://html.spec.whatwg.org/multipage/server-sent-events.html
 * A message is an object with one or more of the following properties:
 * - data (String or object, which gets turned into JSON)
 * - type
 * - id
 * - retry
 *
 * If constructed with a HTTP Request, it will optimise the socket for streaming.
 * If this stream is piped to an HTTP Response, it will set appropriate headers.
 */
export class SseStream extends Transform {
  private lastEventId = 0;

  constructor(req?: IncomingMessage) {
    super({ objectMode: true });
    if (req && req.socket) {
      req.socket.setKeepAlive(true);
      req.socket.setNoDelay(true);
      req.socket.setTimeout(0);
    }
  }

  pipe<T extends HeaderStream>(destination: T, options?: { end?: boolean }): T {
    if (destination.writeHead) {
      destination.writeHead(200, {
        // See https://github.com/dunglas/mercure/blob/master/hub/subscribe.go#L124-L130
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        // Disable cache, even for old browsers and proxies
        "Cache-Control":
          "private, no-cache, no-store, must-revalidate, max-age=0, no-transform",
        "Transfer-Encoding": "identity",
        Pragma: "no-cache",
        Expire: "0",
        // NGINX support https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/#x-accel-buffering
        "X-Accel-Buffering": "no",
      });
      destination.flushHeaders && destination.flushHeaders();
    }

    destination.write(":\n");
    return super.pipe(destination, options);
  }

  _transform(
    message: MessageEvent,
    encoding: string,
    callback: (error?: Error | null, data?: any) => void
  ) {
    let data = message.type ? `event: ${message.type}\n` : "";
    data += (message as any).id ? `id: ${(message as any).id}\n` : "";
    data += (message as any).retry ? `retry: ${(message as any).retry}\n` : "";
    data += message.data ? toDataString(message.data) : "";
    data += "\n";
    this.push(data);
    callback();
  }

  /**
   * Calls `.write` but handles the drain if needed
   */
  writeMessage(
    message: MessageEvent,
    cb: (error: Error | null | undefined) => void
  ) {
    if (!(message as any).id) {
      this.lastEventId++;
      (message as any).id = this.lastEventId.toString();
    }

    if (!this.write(message, "utf-8", cb)) {
      this.once("drain", cb);
    } else {
      process.nextTick(cb);
    }
  }
}
