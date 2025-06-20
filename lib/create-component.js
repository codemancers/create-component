import path from "path";
import fs from "fs";
import chalk from "chalk";

import { detectFramework } from "./converters/converterRegistry.js";

import FigmaToCodeService from "./services/FigmaToCodeService.js";

export async function createComponent(figmaLink, rawName = false) {
  // Detect project configuration if not provided via arguments
  const { framework, extension } = await detectProjectConfig();

  const { fileId, nodeId } = parseFigmaUrl(figmaLink);

  const figmaToCodeService = new FigmaToCodeService();

  await figmaToCodeService.createComponent(
    fileId,
    nodeId,
    framework,
    extension,
    rawName
  );
}

function parseFigmaUrl(figmaUrl) {
  try {
    const url = new URL(figmaUrl);
    const [, , fileId] = url.pathname.split("/");
    const nodeId = url.searchParams.get("node-id");

    if (!fileId || !nodeId) {
      throw new Error("Invalid Figma URL");
    }

    return { fileId, nodeId };
  } catch (err) {
    console.error("❌ Failed to parse Figma URL:", figmaUrl);
    return { fileId: null, nodeId: null };
  }
}

async function detectProjectConfig() {
  let isTS = false;

  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for tsconfig.json to determine if it's a TypeScript project
    try {
      const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
      fs.accessSync(tsconfigPath);
      isTS = true;
    } catch (error) {
      isTS = false;
    }

    const { framework, extension } = detectFramework(dependencies, isTS);
    return { framework, extension };
  } catch (error) {
    console.log(
      chalk.yellow("⚠️ Could not read package.json to detect framework.")
    );
  }
}
