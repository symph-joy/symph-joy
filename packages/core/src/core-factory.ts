import { Logger } from "./services/logger.service";
import { IJoyContext, Type } from "./interfaces";
import { isNil } from "./utils/shared.utils";
import { JoyContainer } from "./injector";
import { MESSAGES } from "./constants";
import { JoyContextOptions } from "./interfaces/joy-context-options.interface";
import { CoreContext } from "./core-context";

export class CoreFactoryImplement {
  private readonly logger = new Logger("JoyFactory", true);

  public async createApplicationContext(
    entry: Record<string, unknown> | Type = {},
    options?: JoyContextOptions
  ): Promise<IJoyContext> {
    this.applyLogger(options);
    const container = new JoyContainer();
    const applicationContext = new CoreContext(entry, container);
    return this.initContext(applicationContext);
  }

  protected async initContext<T extends IJoyContext>(context: T): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.init();
    } catch (e) {
      this.logger.error("start error", e.stack);
      process.abort();
    }
    return context;
  }

  protected applyLogger(options: JoyContextOptions | undefined): void {
    if (!options) {
      return;
    }
    !isNil(options.logger) && Logger.overrideLogger(options.logger);
  }
}

export const CoreFactory = new CoreFactoryImplement();
