#!/usr/bin/env node

import minimist from "minimist";
import chalk from "chalk";
import { createReactComponent } from "../lib/create-react-component.js";

const args = minimist(process.argv.slice(2));
const isReact = args.react || false;
const figmaLink = args["figma-link"];
const isTs = args.ts || false;

if (isReact) {
  if (!figmaLink) {
    console.log(chalk.red("❌ Please provide a figma-link argument."));
    process.exit(1);
  }

  console.log(
    chalk.green(`✨ Creating React component from Figma link: ${figmaLink}`)
  );
  createReactComponent(figmaLink, args.name, isTs);
} else {
  console.log(chalk.yellow("⚠️ No framework specified. Use --react flag."));
}
