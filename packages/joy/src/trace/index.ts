import { trace, flushAllTraces, Span, SpanStatus } from "./trace";
import { SpanId, setGlobal } from "./shared";
export type { SpanId };
export { trace, flushAllTraces, Span, SpanStatus, setGlobal };
