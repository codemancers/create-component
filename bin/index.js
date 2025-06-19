#!/usr/bin/env node

import minimist from "minimist";
import chalk from "chalk";
import os from "os";
import path from "path";
import fs from "fs";
import readline from "readline";

import { createComponent } from "../lib/create-component.js";

const CONFIG_DIR = path.join(os.homedir(), ".create-component");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const args = minimist(process.argv.slice(2));
const figmaLink = args["figma-link"];

(async () => {
  // check for figma_access token
  await checkFigmaAccessToken();

  if (!figmaLink) {
    console.log(chalk.red("❌ Please provide a figma-link argument."));
    process.exit(1);
  }

  console.log(
    chalk.green(`✨ Creating component from Figma link: ${figmaLink}`)
  );

  await createComponent(figmaLink, args.name);
})();

async function checkFigmaAccessToken() {
  if (fs.existsSync(CONFIG_FILE)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (config.figma_access_token) return config.figma_access_token;
  }

  const token = await promptFigmaToken();

  // Save token for future use
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify({ figma_access_token: token }, null, 2)
  );

  return token;
}

//
function promptFigmaToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("🔑 Enter your Figma Access Token: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
