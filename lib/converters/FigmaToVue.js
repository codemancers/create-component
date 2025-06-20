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
      .replace(/[^a-zA-Z0-9]+/g, " ") // Replace non-alphanumerics with space
      .replace(/^\d+/, "") // Remove leading digits
      .split(" ") // Split into words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  createComponentFile(componentName, code, importsSet) {
    const componentCode = `
<script setup>
// Add script logic here
${[...importsSet]
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

export function isProject(dependencies) {
  return !!dependencies.vue;
}

export const framework = "vue";
export const extension = "vue";
