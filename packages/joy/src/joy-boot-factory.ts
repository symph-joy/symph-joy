import { EntryType } from "@symph/core";
import { HttpServer, NestApplicationOptions, ServerApplication } from "@symph/server";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyBoot } from "./joy-boot";
import { ServerFactoryImplement } from "@symph/server/dist/server-factory";
import { MESSAGES } from "@symph/core/dist/constants";
import { JoyBootConfiguration } from "./joy-boot.configuration";

export class JoyBootFactoryImplement extends ServerFactoryImplement<JoyBoot> {
  create(entry: EntryType, options?: NestApplicationOptions): Promise<JoyBoot> {
    return this.createServer(entry, undefined, options);
  }

  createServer(entry: EntryType, configurationClass: typeof ServerConfiguration = JoyBootConfiguration, options?: NestApplicationOptions): Promise<JoyBoot> {
    return super.createServer(entry, configurationClass, options);
  }
}

export const JoyBootFactory = new JoyBootFactoryImplement(JoyBoot);
