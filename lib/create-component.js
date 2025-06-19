import path from "path";
import fs from "fs";
import chalk from "chalk";

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
  let framework = null;
  let isTS = false;
  let extension = null;

  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (dependencies.react) {
      framework = "react";
    } else if (dependencies.vue) {
      framework = "vue";
    } else if (dependencies["@angular/core"]) {
      framework = "angular";
    }
  } catch (error) {
    console.log(
      chalk.yellow("⚠️ Could not read package.json to detect framework.")
    );
  }

  // Check for tsconfig.json to determine if it's a TypeScript project
  try {
    const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
    fs.accessSync(tsconfigPath);
    isTS = true;
  } catch (error) {
    isTS = false;
  }

  // Determine extension based on framework and TS usage
  if (framework === "react") {
    extension = isTS ? "tsx" : "jsx";
  } else if (framework === "vue") {
    extension = "vue";
  } else if (framework === "angular") {
    extension = "ts";
  }

  return { framework, extension };
}
