import { Configuration } from "@symph/core";
import { JoyPresetCommandsConfig } from "./command/preset/joy-preset-commands.config";

@Configuration({ imports: { JoyPresetCommandsConfig } })
export class PresetJoyCore {}
