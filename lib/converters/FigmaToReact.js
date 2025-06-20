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
      .replace(/[^a-zA-Z0-9]+/g, " ") // Replace non-alphanumerics with space
      .replace(/^\d+/, "") // Remove leading digits
      .split(" ") // Split into words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  createComponentFile(componentName, code, importsSet, extension) {
    const componentCode = `
${[...importsSet]
  .map((component) => `import ${component} from "./${component}";`)
  .join("\n")}

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

export function isProject(dependencies) {
  return !!dependencies.react;
}

export const framework = "react";
export const extension = (isTs) => (isTs ? "tsx" : "jsx");
