import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";
import chalk from "chalk";

import TailwindStyles from "./tailwind-styles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export async function createComponent(
  figmaLink,
  rawName = false,
  isTS = false
) {
  const { fileId, nodeId } = parseFigmaUrl(figmaLink);

  const figmaService = new FigmaService();
  const html = await figmaService.figmaToHtml(fileId, nodeId);

  const componentName = sanitizeName(rawName || figmaService.componentName);

  const extension = isTS ? "tsx" : "jsx";

  // Convert HTML to JSX
  const jsx = htmlToJsx(html);

  const componentCode = `
import React from 'react';

const ${componentName} = () => {
  return (
    ${jsx}
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

function parseFigmaUrl(figmaUrl) {
  try {
    const url = new URL(figmaUrl);
    const [, , fileId] = url.pathname.split("/");
    const nodeId = url.searchParams.get("node-id");

    if (!fileId || !nodeId) {
      throw new Error("Invalid Figma URL");
    }

    return { fileId, nodeId };
  } catch (err) {
    console.error("❌ Failed to parse Figma URL:", figmaUrl);
    return { fileId: null, nodeId: null };
  }
}

function sanitizeName(name) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function htmlToJsx(html) {
  // Basic replacement for 'class' attribute
  let jsx = html.replace(/class=/g, "className=");

  // Add other basic replacements here as needed, e.g., for event handlers
  // jsx = jsx.replace(/onclick=/g, 'onClick=');
  // jsx = jsx.replace(/for=/g, 'htmlFor='); // for labels

  // NOTE: More complex conversions (like self-closing tags, style objects,
  // and complex attributes) would require a proper HTML parser.

  return jsx;
}

// service to convert figma to code
class FigmaService {
  constructor() {
    this.figmaToken = process.env.FIGMA_TOKEN;
    this.componentName = null;
    this.tailwindStyles = new TailwindStyles();
  }

  async getFrameImageUrl(fileId, frameId) {
    try {
      const url = `https://api.figma.com/v1/images/${fileId}?ids=${frameId}&format=png`;
      const response = await fetch(url, {
        headers: {
          "X-Figma-Token": this.figmaToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch frame image: ${response.statusText}`);
      }

      const data = await response.json();
      return data.images[frameId];
    } catch (error) {
      console.error("Error fetching frame image URL:", error);
      return null;
    }
  }

  createInputHtml(node) {
    const styles = this.tailwindStyles.figmaToTailwind(node);
    const textNode = node.children?.find((child) => child.type === "TEXT");
    const placeholder = textNode?.characters?.trim() || "";

    return `<input type="text" placeholder="${placeholder}" class="${styles} focus:outline-0" />`;
  }

  createTableHtml(table) {
    const tableColumns = table.children || [];

    // Table head
    const headHtml = tableColumns
      .map((col) => {
        const head = col.children?.[0];
        return head ? this.parseNode(head) : "";
      })
      .join("");

    const tableHead = `<thead><tr class="flex">${headHtml}</tr></thead>`;

    // Table body (first row only)
    const rowHtml = tableColumns
      .map((col) => {
        const row = col.children?.[1];
        return row ? this.parseNode(row) : "";
      })
      .join("");

    const tableBody = `<tbody><tr class="flex">${rowHtml}</tr></tbody>`;

    return (
      '<div class="overflow-x-scroll"><table>' +
      tableHead +
      tableBody +
      "</table></div>"
    );
  }

  async parseNode(node, fileId) {
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
      const imageUrl = await this.getFrameImageUrl(fileId, node.id);
      return imageUrl ? `<img src="${imageUrl}" class="${styles}" />` : "";
    }

    // Handle RECTANGLE elements as images
    if (nodeType === "RECTANGLE") {
      const imageUrl = await this.getFrameImageUrl(fileId, node.id);
      return imageUrl
        ? `<div class="${styles}"><img src="${imageUrl}" /></div>`
        : "";
    }

    // Handle text elements
    if (nodeType === "TEXT") {
      const textContent = node.characters?.trim() || "";
      return `<p class="${styles}">${textContent}</p>`;
    }

    // Handle input fields
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "input") {
      return this.createInputHtml(node);
    }

    // Handle table elements
    if (nodeType === "FRAME" && nodeName.toLowerCase().includes("table")) {
      return this.createTableHtml(node);
    }

    // Handle heading content
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "heading-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId))
        .join("");
      return `<th class="${styles}">${childHtml}</th>`;
    }

    // Handle data content
    if (nodeType === "FRAME" && nodeName.toLowerCase() === "data-content") {
      const childHtml = children
        .map((child) => this.parseNode(child, fileId))
        .join("");
      return `<td class="${styles}">${childHtml}</td>`;
    }

    // Handle generic containers
    if (nodeType === "FRAME" || nodeType === "GROUP") {
      // Pass fileId to recursive calls
      const childHtml = await Promise.all(
        children.map((child) => this.parseNode(child, fileId))
      );
      return `<div class="${styles}">${childHtml.join("")}</div>`;
    }

    return "";
  }

  async figmaToHtml(fileId, nodeId) {
    try {
      const response = await fetch(
        `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}`,
        {
          headers: {
            "X-Figma-Token": this.figmaToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Figma data: ${response.statusText}`);
      }

      const data = await response.json();
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
}
