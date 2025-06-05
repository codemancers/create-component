import path from "path";
import fs from "fs";
import chalk from "chalk";
import FigmaToHTML from "./FigmaToHTML.js";

export default class FigmaToReact extends FigmaToHTML {
  get classAttr() {
    return "className";
  }

  sanitizeName(name) {
    return name
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^\d+/, "")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  createComponentFile(componentName, code, extension) {
    const componentCode = `
    const ${componentName} = () => {
      return (
        ${code}
      );
    };

    export default ${componentName};
    `;

    const targetDir = path.join(process.cwd(), "src/components");
    fs.mkdirSync(targetDir, { recursive: true });

    const filePath = path.join(targetDir, `${componentName}.${extension}`);
    fs.writeFileSync(filePath, componentCode);

    console.log(
      chalk.green(
        `✅ ${componentName} component is created successfully in src/components folder`
      )
    );
  }
}
