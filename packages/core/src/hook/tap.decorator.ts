import { Type } from "../interfaces";

export interface ITapDecoMeta {
  id: string;
  stage?: number;
  before?: string | string[];
  hookId: string;
  propKey: string;
}

export function Tap(hookOptions?: Partial<ITapDecoMeta>): PropertyDecorator {
  return (target, propertyKey) => {
    const existTaps = getTapsMetadata(target) || [];
    const exist = existTaps.find((it) => it.propKey === propertyKey);
    if (exist) {
      return;
    }
    const hook: ITapDecoMeta = Object.assign(
      {},
      {
        id: `${target.constructor.name}.${propertyKey as string}`,
        hookId: propertyKey as string,
        propKey: propertyKey as string,
      },
      hookOptions
    );
    existTaps.push(hook);

    Reflect.defineMetadata("__joy_taps", existTaps, target);
  };
}

export function getTapsMetadata(targetType: Object | Type): ITapDecoMeta[] {
  return Reflect.getMetadata("__joy_taps", typeof targetType === "function" ? targetType.prototype : targetType) as ITapDecoMeta[];
}
