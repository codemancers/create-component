import path from "path";
import fs from "fs";
import chalk from "chalk";
import FigmaToHTML from "./FigmaToHTML.js";

export default class FigmaToVue extends FigmaToHTML {
  get classAttr() {
    return "class";
  }

  sanitizeName(name) {
    return name
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^\d+/, "")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  createComponentFile(componentName, code, importsArr) {
    const componentCode = `
<script setup>
// Add script logic here
${importsArr
  .map((component) => `import ${component} from "./${component}.vue";`)
  .join("\n")}
</script>

<template>
  ${code}
</template>
`;

    const targetDir = path.join(process.cwd(), "src/components");
    fs.mkdirSync(targetDir, { recursive: true });

    const filePath = path.join(targetDir, `${componentName}.vue`);
    fs.writeFileSync(filePath, componentCode);

    console.log(
      chalk.green(
        `✅ ${componentName} component is created successfully in src/components folder`
      )
    );
  }
}
