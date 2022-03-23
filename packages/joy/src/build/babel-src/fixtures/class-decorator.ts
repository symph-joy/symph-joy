import "reflect-metadata";

// @joy-scan
export function ClassDecorator(value = "aValue"): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata("META_KEY_CLASS", value, target);
  };
}

// @joy-scan
// aaaa
function PropDecorator(value = "aPropValue"): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata("META_KEY_PROP", value, target, propertyKey);
  };
}

ClassDecorator.PropDecorator = PropDecorator;
