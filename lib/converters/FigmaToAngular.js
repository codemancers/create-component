import path from "path";
import fs from "fs";
import chalk from "chalk";
import { execSync } from "child_process";
import FigmaToHTML from "./FigmaToHTML.js";

export default class FigmaToAngular extends FigmaToHTML {
  get classAttr() {
    return "class";
  }

  sanitizeName(name) {
    return name
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/_/g, "-")
      .toLowerCase();
  }

  createComponentFile(componentName, code) {
    try {
      // execute command to generate angular component
      execSync(`ng g c ${componentName}`, { stdio: "inherit" });

      const targetDir = path.join(process.cwd(), `src/app/${componentName}`);
      const filePath = path.join(targetDir, `${componentName}.component.html`);
      fs.writeFileSync(filePath, code);

      console.log(
        chalk.green(
          `✅ ${componentName} component is created successfully in src/app folder`
        )
      );
    } catch (error) {
      console.error(`Error generating ${componentName}: ${error}`);
    }
  }
}
