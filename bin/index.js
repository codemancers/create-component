#!/usr/bin/env node

import minimist from "minimist";
import chalk from "chalk";
import { createComponent } from "../lib/create-component.js";

const args = minimist(process.argv.slice(2));
const figmaLink = args["figma-link"];

(async () => {
  if (!figmaLink) {
    console.log(chalk.red("❌ Please provide a figma-link argument."));
    process.exit(1);
  }

  console.log(
    chalk.green(`✨ Creating component from Figma link: ${figmaLink}`)
  );

  await createComponent(figmaLink, args.name);
})();
