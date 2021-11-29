import { Logger } from "./services/logger.service";
import { EntryType, IApplicationContext, Type } from "./interfaces";
import { isNil } from "./utils/shared.utils";
import { ApplicationContainer } from "./injector";
import { MESSAGES } from "./constants";
import { JoyContextOptions } from "./interfaces/joy-context-options.interface";
import { ApplicationContext } from "./application-context";

export class CoreFactoryImplement {
  private readonly logger = new Logger("JoyFactory", true);

  public async createApplicationContext(
    entry: EntryType | EntryType[],
    parent?: IApplicationContext,
    options?: JoyContextOptions
  ): Promise<IApplicationContext> {
    this.applyLogger(options);
    const applicationContext = new ApplicationContext(entry, parent);
    return this.initContext(applicationContext);
  }

  protected async initContext<T extends IApplicationContext>(context: T): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.init();
    } catch (e) {
      this.logger.error("Init context error:", e.message);
      // process.abort();
      throw e;
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

export const ApplicationContextFactory = new CoreFactoryImplement();
