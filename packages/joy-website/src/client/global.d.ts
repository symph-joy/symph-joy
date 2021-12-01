import "react";

type CustomProp = { [key in `--${string}`]: string | number };

declare module "react" {
  export interface CSSProperties extends CustomProp {}
}
