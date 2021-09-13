import { EntryType } from "@symph/core";
import { NestApplicationOptions } from "@symph/server";
import { JoyBoot } from "./joy-boot";
import { ServerFactoryImplement } from "@symph/server/dist/server-factory";
import { MESSAGES } from "@symph/core/dist/constants";
import { JoyBootConfiguration } from "./joy-boot.configuration";

export class JoyBootFactoryImplement extends ServerFactoryImplement<JoyBoot> {
  create(entry: EntryType, options?: NestApplicationOptions): Promise<JoyBoot> {
    return this.createServer(entry, JoyBootConfiguration, options);
  }

  createServer(entry: EntryType, configurationClass: typeof JoyBootConfiguration = JoyBootConfiguration, options?: NestApplicationOptions): Promise<JoyBoot> {
    return super.createServer(entry, configurationClass, options);
  }

  protected async init(context: JoyBoot): Promise<JoyBoot> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.startBoot();
    } catch (e) {
      this.logger.error("start errorf d", e.stack);
      if (this.abortOnError) {
        process.abort();
      }
      throw e;
    }
    return context;
  }
}

export const JoyBootFactory = new JoyBootFactoryImplement(JoyBoot);
