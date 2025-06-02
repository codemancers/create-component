import path from "path";
import fs from "fs";
import chalk from "chalk";

export default class FigmaToVue {
  createInput(placeholder, styles) {
    return `<input type="text" placeholder="${placeholder}" class="${styles}" />`;
  }

  createTableHead(headHtml) {
    return `<thead><tr class="flex">${headHtml}</tr></thead>`;
  }

  createTableBody(rowHtml) {
    return `<tbody><tr class="flex">${rowHtml}</tr></tbody>`;
  }

  createTableHeadingContent(childHtml, styles) {
    return `<th class="${styles}">${childHtml}</th>`;
  }

  createTableDataContent(childHtml, styles) {
    return `<td class="${styles}">${childHtml}</td>`;
  }

  createTable(tableHead, tableBody) {
    return (
      '<div class="overflow-x-scroll"><table>' +
      tableHead +
      tableBody +
      "</table></div>"
    );
  }

  createImage(imageUrl, styles) {
    return `<img src="${imageUrl}" class="${styles}" />`;
  }

  createImageContainer(imageUrl, styles) {
    return `<div class="${styles}"><img src="${imageUrl}" /></div>`;
  }

  createText(text, styles) {
    return `<p class="${styles}">${text}</p>`;
  }

  createDivContainer(childHtml, styles) {
    return `<div class="${styles}">${childHtml.join("")}</div>`;
  }

  sanitizeName(name) {
    return name
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^\d+/, "")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  createComponentFile(componentName, code) {
    const componentCode = `
<script setup>
// Add script logic here
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
