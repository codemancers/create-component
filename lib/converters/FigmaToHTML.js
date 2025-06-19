export default class FigmaToHTML {
  get classAttr() {
    return "class";
  }

  createInput(placeholder, styles) {
    return `<input type="text" placeholder="${placeholder}" ${this.classAttr}="focus:outline-none ${styles}" />`;
  }

  createLabel(text, styles) {
    return `<label ${this.classAttr}="${styles}">${text}</label>`;
  }

  createTableHead(headHtml) {
    return `<thead><tr ${this.classAttr}="flex">${headHtml}</tr></thead>`;
  }

  createTableBody(rowHtml) {
    return `<tbody><tr ${this.classAttr}="flex">${rowHtml}</tr></tbody>`;
  }

  createTableHeadingContent(childHtml, styles) {
    return `<th ${this.classAttr}="${styles}">${childHtml}</th>`;
  }

  createTableDataContent(childHtml, styles) {
    return `<td ${this.classAttr}="${styles}">${childHtml}</td>`;
  }

  createTable(tableHead, tableBody) {
    return (
      `<div ${this.classAttr}="overflow-x-scroll"><table>` +
      tableHead +
      tableBody +
      `</table></div>`
    );
  }

  createImage(imageUrl, styles) {
    return `<img src="${imageUrl}" ${this.classAttr}="${styles}" />`;
  }

  createImageContainer(imageUrl, styles) {
    return `<div ${this.classAttr}="${styles}"><img src="${imageUrl}" /></div>`;
  }

  createText(text, styles) {
    return `<p ${this.classAttr}="${styles}">${text}</p>`;
  }

  createDivContainer(childHtml, styles) {
    return `<div ${this.classAttr}="${styles}">${childHtml.join("")}</div>`;
  }

  isComponentPresent(componentName, extension) {
    const targetDir = path.join(process.cwd(), "src/components");
    const componentPath = path.join(targetDir, `${componentName}.${extension}`);

    fs.mkdirSync(targetDir, { recursive: true });

    return fs.existsSync(componentPath);
  }

  renderComponent(componentName) {
    return `<${componentName} />`;
  }
}
