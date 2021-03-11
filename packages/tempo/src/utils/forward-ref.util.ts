import { ForwardReference } from "../interfaces/context/forward-reference.interface";

export const forwardRef = (fn: () => any): ForwardReference => ({
  forwardRef: fn,
});
