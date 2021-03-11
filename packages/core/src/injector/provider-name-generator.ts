// eslint-disable-next-line @typescript-eslint/ban-types

import { isFunction } from "../utils/shared.utils";

export function providerNameGenerate(clazz: unknown): string {
  if (isFunction(clazz)) {
    let name = clazz.name;
    name = name.replace(name[0], name[0].toLowerCase());
    return name;
  } else {
    return "" + clazz;
  }
}
