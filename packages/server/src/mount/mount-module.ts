import { EntryType } from "@symph/core";

export class MountModule {
  constructor(public mount: string, public module: EntryType) {}
}
