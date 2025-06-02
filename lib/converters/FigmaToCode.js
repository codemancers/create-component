import TailwindStyles from "../tailwind-styles.js";
import FigmaService from "../FigmaService.js";

import FigmaToReact from "./FigmaToReact.js";
import FigmaToVue from "./FigmaToVue.js";
import FigmaToAngular from "./FigmaToAngular.js";
import FigmaToRails from "./FigmaToRails.js";

export default class FigmaToCode {
  constructor() {
    this.componentName = null;
    this.tailwindStyles = new TailwindStyles();
    this.figmaService = new FigmaService();
  }

  createInputElement(node, figmaToCodeConverter) {
    const styles = this.tailwindStyles.figmaToTailwind(node);
    const textNode = node.children?.find((child) => child.type === "TEXT");
    const placeholder = textNode?.characters?.trim() || "";

    return figmaToCodeConverter.createInput(placeholder, styles);
  }

  createTableElement(table, figmaToCodeConverter) {
    const tableColumns = table.children || [];

    // Table head
    const headHtml = tableColumns
      .map((col) => {
        const head = col.children?.[0];
        return head ? this.parseNode(head) : "";
      })
      .join("");

    const tableHead = figmaToCodeConverter.createTableHead(headHtml);

    // Table body (first row only)
    const rowHtml = tableColumns
      .map((col) => {
        const row = col.children?.[1];
        return row ? this.parseNode(row) : "";
      })
      .join("");

    const tableBody = figmaToCodeConverter.createTableBody(rowHtml);

    return figmaToCodeConverter.createTable(tableHead, tableBody);
  }

  async parseNode(node, fileId, figmaToCodeConverter) {
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
      return imageUrl ? figmaToCodeConverter.createImage(imageUrl, styles) : "";
    }

    // Handle RECTANGLE elements as images
    if (nodeType === "RECTANGLE") {
      const imageUrl = await this.figmaService.getFrameImageUrl(
        fileId,
        node.id
      );
      return imageUrl
        ? figmaToCodeConverter.createImageContainer(imageUrl, styles)
        : "";
    }

    // Handle text elements
    if (nodeType === "TEXT") {
      const textContent = node.characters?.trim() || "";
      return figmaToCodeConverter.createText(textContent, styles);
    }

    // Handle input fields
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "input") {
      return this.createInputElement(node, figmaToCodeConverter);
    }

    // Handle table elements
    if (nodeType === "FRAME" && nodeName.toLowerCase().includes("table")) {
      return this.createTableElement(node, figmaToCodeConverter);
    }

    // Handle heading content
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "heading-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId, figmaToCodeConverter))
        .join("");
      return figmaToCodeConverter.createTableHeadingContent(childHtml, styles);
    }

    // Handle data content
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "data-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId, figmaToCodeConverter))
        .join("");
      return figmaToCodeConverter.createTableDataContent(childHtml, styles);
    }

    // Handle generic containers
    if (nodeType === "FRAME" || nodeType === "GROUP") {
      // Pass fileId to recursive calls
      const childHtml = await Promise.all(
        children.map((child) =>
          this.parseNode(child, fileId, figmaToCodeConverter)
        )
      );
      return figmaToCodeConverter.createDivContainer(childHtml, styles);
    }

    return "";
  }

  async figmaToComponent(fileId, nodeId, figmaToCodeConverter) {
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
      return await this.parseNode(figmaJson, fileId, figmaToCodeConverter);
    } catch (error) {
      console.error("Error converting Figma to HTML:", error);
      throw error;
    }
  }

  codeConverter(framework) {
    let figmaToCodeConverter;
    switch (framework) {
      case "react":
        figmaToCodeConverter = new FigmaToReact();
        break;
      case "vue":
        figmaToCodeConverter = new FigmaToVue();
        break;
      case "angular":
        figmaToCodeConverter = new FigmaToAngular();
        break;
      case "rails":
        figmaToCodeConverter = new FigmaToRails();
        break;
    }
    return figmaToCodeConverter;
  }

  async createComponent(fileId, nodeId, framework, extension, rawName = false) {
    const figmaToCodeConverter = this.codeConverter(framework);

    const code = await this.figmaToComponent(
      fileId,
      nodeId,
      figmaToCodeConverter
    );

    const componentName = figmaToCodeConverter.sanitizeName(
      rawName || this.componentName
    );
    figmaToCodeConverter.createComponentFile(componentName, code, extension);
  }
}
