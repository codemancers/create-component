import TailwindStyles from "../tailwind-styles.js";
import FigmaService from "../FigmaService.js";

import FigmaToReact from "./FigmaToReact.js";
import FigmaToVue from "./FigmaToVue.js";
import FigmaToAngular from "./FigmaToAngular.js";

export default class FigmaToCode {
  constructor() {
    this.componentName = null;
    this.tailwindStyles = new TailwindStyles();
    this.figmaService = new FigmaService();
    this.figmaToCodeConverter = null;
  }

  createInputElement(node) {
    let styles = this.tailwindStyles.figmaToTailwind(node);
    const textNode = node.children?.find((child) => child.type === "TEXT");
    const textColor = this.tailwindStyles.getTextColor(textNode);
    const placeholder = textNode?.characters?.trim() || "";

    styles += " " + textColor;

    return this.figmaToCodeConverter.createInput(placeholder, styles);
  }

  createTableElement(table) {
    const tableColumns = table.children || [];

    // Table head
    const headHtml = tableColumns
      .map((col) => {
        const head = col.children?.[0];
        return head ? this.parseNode(head) : "";
      })
      .join("");

    const tableHead = this.figmaToCodeConverter.createTableHead(headHtml);

    // Table body (first row only)
    const rowHtml = tableColumns
      .map((col) => {
        const row = col.children?.[1];
        return row ? this.parseNode(row) : "";
      })
      .join("");

    const tableBody = this.figmaToCodeConverter.createTableBody(rowHtml);

    return this.figmaToCodeConverter.createTable(tableHead, tableBody);
  }

  async parseNode(node, fileId) {
    if (!node) return "";
    if (node.visible === false) {
      return "";
    }

    const nodeName = node.name || "Unnamed";
    const nodeType = node.type;
    const children = node.children || [];
    const styles = this.tailwindStyles.figmaToTailwind(node);

    // Handle image elements
    if (
      nodeType === "VECTOR" ||
      nodeType === "INSTANCE" ||
      nodeName.toLowerCase() === "logo"
    ) {
      const imageUrl = await this.figmaService.getFrameImageUrl(
        fileId,
        node.id
      );
      return imageUrl
        ? this.figmaToCodeConverter.createImage(imageUrl, styles)
        : "";
    }

    // Handle RECTANGLE elements as images
    if (nodeType === "RECTANGLE") {
      const imageUrl = await this.figmaService.getFrameImageUrl(
        fileId,
        node.id
      );
      return imageUrl
        ? this.figmaToCodeConverter.createImageContainer(imageUrl, styles)
        : "";
    }

    // Handle text elements
    if (nodeType === "TEXT") {
      const textContent = node.characters?.trim() || "";
      return this.figmaToCodeConverter.createText(textContent, styles);
    }

    if (nodeName.split("-")[0].toLowerCase() === "label") {
      const textNode = node.children?.find((child) => child.type === "TEXT");
      let styles = this.tailwindStyles.figmaToTailwind(textNode);
      return this.figmaToCodeConverter.createLabel(textNode.name, styles);
    }

    // Handle input fields
    if (nodeName.split("-")[0].toLowerCase() === "input") {
      return this.createInputElement(node);
    }

    // Handle table elements
    if (nodeName.toLowerCase().includes("table")) {
      return this.createTableElement(node);
    }

    // Handle heading content
    if (nodeName.toLowerCase() === "heading-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId))
        .join("");
      return this.figmaToCodeConverter.createTableHeadingContent(
        childHtml,
        styles
      );
    }

    // Handle data content
    if (nodeName.toLowerCase() === "data-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId))
        .join("");
      return this.figmaToCodeConverter.createTableDataContent(
        childHtml,
        styles
      );
    }

    // Handle generic containers
    if (nodeType === "FRAME" || nodeType === "GROUP") {
      // Pass fileId to recursive calls
      const childHtml = await Promise.all(
        children.map((child) => this.parseNode(child, fileId))
      );
      return this.figmaToCodeConverter.createDivContainer(childHtml, styles);
    }

    return "";
  }

  async figmaToComponent(fileId, nodeId) {
    try {
      const data = await this.figmaService.getFigmaJson(fileId, nodeId);
      const figmaJson = data.nodes[nodeId.replace("-", ":")].document;
      this.componentName = figmaJson.name;

      // Sort nodes by position
      if (figmaJson.children) {
        figmaJson.children.sort((a, b) => {
          const aY = a.absoluteBoundingBox?.y || 0;
          const aX = a.absoluteBoundingBox?.x || 0;
          const bY = b.absoluteBoundingBox?.y || 0;
          const bX = b.absoluteBoundingBox?.x || 0;
          return aY === bY ? aX - bX : aY - bY;
        });
      }

      // Pass fileId to the initial parseNode call
      return await this.parseNode(figmaJson, fileId);
    } catch (error) {
      console.error("Error converting Figma to HTML:", error);
      throw error;
    }
  }

  codeConverter(framework) {
    switch (framework) {
      case "react":
        this.figmaToCodeConverter = new FigmaToReact();
        break;
      case "vue":
        this.figmaToCodeConverter = new FigmaToVue();
        break;
      case "angular":
        this.figmaToCodeConverter = new FigmaToAngular();
        break;
    }
  }

  async createComponent(fileId, nodeId, framework, extension, rawName = false) {
    // assigns this.figmaToCodeConverter to respective class
    this.codeConverter(framework);

    const code = await this.figmaToComponent(fileId, nodeId);

    const componentName = this.figmaToCodeConverter.sanitizeName(
      rawName || this.componentName
    );

    this.figmaToCodeConverter.createComponentFile(
      componentName,
      code,
      extension
    );
  }
}
