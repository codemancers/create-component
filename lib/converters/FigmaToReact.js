import path from "path";
import fs from "fs";
import chalk from "chalk";

export default class FigmaToReact {
  createInput(placeholder, styles) {
    return `<input type="text" placeholder="${placeholder}" className="${styles} focus:outline-0" />`;
  }

  createTableHead(headHtml) {
    return `<thead><tr className="flex">${headHtml}</tr></thead>`;
  }

  createTableBody(rowHtml) {
    return `<tbody><tr className="flex">${rowHtml}</tr></tbody>`;
  }

  createTableHeadingContent(childHtml, styles) {
    return `<th className="${styles}">${childHtml}</th>`;
  }

  createTableDataContent(childHtml, styles) {
    return `<td className="${styles}">${childHtml}</td>`;
  }

  createTable(tableHead, tableBody) {
    return (
      '<div className="overflow-x-scroll"><table>' +
      tableHead +
      tableBody +
      "</table></div>"
    );
  }

  createImage(imageUrl, styles) {
    return `<img src="${imageUrl}" className="${styles}" />`;
  }

  createImageContainer(imageUrl, styles) {
    return `<div className="${styles}"><img src="${imageUrl}" /></div>`;
  }

  createText(text, styles) {
    return `<p className="${styles}">${text}</p>`;
  }

  createDivContainer(childHtml, styles) {
    return `<div className="${styles}">${childHtml}</div>`;
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
