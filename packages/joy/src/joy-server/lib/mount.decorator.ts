const MOUNT_METADATA = "__joy_mount";

export function Mount(mountPath: string): ClassDecorator {
  return (target) => {
    const old = getMount(target);
    if (old) {
      console.debug(`Mount override, component:${target.name}, new:${mountPath}, old: ${old}`);
    }

    Reflect.defineMetadata(MOUNT_METADATA, mountPath, target);
  };
}

export function getMount(target: Object): string | undefined {
  return Reflect.getMetadata(MOUNT_METADATA, target);
}
