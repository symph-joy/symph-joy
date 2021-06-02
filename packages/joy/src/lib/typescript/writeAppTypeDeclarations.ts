import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileExists } from "../file-exists";

export async function writeAppTypeDeclarations(baseDir: string): Promise<void> {
  // Reference `joy` types
  const appTypeDeclarations = path.join(baseDir, "joy-env.d.ts");
  const hasAppTypeDeclarations = await fileExists(appTypeDeclarations);
  if (!hasAppTypeDeclarations) {
    await fs.writeFile(
      appTypeDeclarations,
      '/// <reference types="joy" />' +
        os.EOL +
        '/// <reference types="joy/types/global" />' +
        os.EOL
    );
  }
}
