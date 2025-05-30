import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import fs from "fs";
import chalk from "chalk";

console.log("Figma token", process.env.FIGMA_TOKEN);

export async function createReactComponent(
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
    this.tailwindMapping = {
      0: "0",
      1: "px",
      2: "0.5",
      4: "1",
      6: "1.5",
      8: "2",
      10: "2.5",
      12: "3",
      14: "3.5",
      16: "4",
      20: "5",
      24: "6",
      28: "7",
      32: "8",
      36: "9",
      40: "10",
      44: "11",
      48: "12",
      56: "14",
      64: "16",
      72: "18",
      80: "20",
      96: "24",
      112: "28",
      128: "32",
      144: "36",
      160: "40",
      176: "44",
      192: "48",
      208: "52",
      224: "56",
      240: "60",
      256: "64",
      288: "72",
      320: "80",
      384: "96",
    };
  }

  getColor(color, opacity = 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(color.a * opacity * 255);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a
      .toString(16)
      .padStart(2, "0")}`;
  }

  getWidthAndHeight(figmaJson) {
    const styles = [];
    const width = figmaJson.absoluteBoundingBox?.width;
    const height = figmaJson.absoluteBoundingBox?.height;

    if (width) {
      const tailwindClass =
        this.tailwindMapping[Math.round(width)] || `[${Math.round(width)}px]`;
      styles.push(`w-${tailwindClass}`);
    }

    if (
      height &&
      (figmaJson.type === "INSTANCE" || figmaJson.type === "VECTOR")
    ) {
      const tailwindClass =
        this.tailwindMapping[Math.round(height)] || `[${Math.round(height)}px]`;
      styles.push(`h-${tailwindClass}`);
    }

    return styles.join(" ");
  }

  getPadding(figmaJson) {
    const styles = [];
    const { paddingTop, paddingBottom, paddingLeft, paddingRight } = figmaJson;

    const getTailwindPadding = (value) => {
      if (value === undefined) return undefined;
      return (
        this.tailwindMapping[Math.round(value)] || `[${Math.round(value)}px]`
      );
    };

    const pt = getTailwindPadding(paddingTop);
    const pb = getTailwindPadding(paddingBottom);
    const pl = getTailwindPadding(paddingLeft);
    const pr = getTailwindPadding(paddingRight);

    if (pt && pt === pb && pt === pl && pt === pr) {
      styles.push(`p-${pt}`);
    } else if (pt && pb && pt === pb && pl && pr && pl === pr) {
      styles.push(`py-${pt}`);
      styles.push(`px-${pl}`);
    } else {
      if (pt) styles.push(`pt-${pt}`);
      if (pb) styles.push(`pb-${pb}`);
      if (pl) styles.push(`pl-${pl}`);
      if (pr) styles.push(`pr-${pr}`);
    }

    return styles.join(" ");
  }

  getGap(figmaJson) {
    const gap = figmaJson.itemSpacing;
    if (!gap) return "";

    const tailwindClass =
      this.tailwindMapping[Math.round(gap)] || `[${Math.round(gap)}px]`;
    return `gap-${tailwindClass}`;
  }

  getBorderRadius(figmaJson) {
    const tailwindBorderRadius = {
      0: "none",
      2: "sm",
      6: "md",
      8: "lg",
      12: "xl",
      16: "2xl",
      24: "3xl",
      9999: "full",
    };

    const cornerRadius = figmaJson.cornerRadius;
    if (!cornerRadius) return "";

    if (cornerRadius === 4) return "rounded";
    const tailwindClass =
      tailwindBorderRadius[cornerRadius] || `[${cornerRadius}px]`;
    return `rounded-${tailwindClass}`;
  }

  getFontSizeAndWeight(figmaJson) {
    const styles = [];
    const fontSizeMapping = {
      12: "xs",
      14: "sm",
      16: "base",
      18: "lg",
      20: "xl",
      24: "2xl",
      30: "3xl",
      36: "4xl",
      48: "5xl",
      60: "6xl",
      72: "7xl",
      96: "8xl",
      128: "9xl",
    };

    const fontWeightMapping = {
      100: "thin",
      200: "extralight",
      300: "light",
      400: "normal",
      500: "medium",
      600: "semibold",
      700: "bold",
      800: "extrabold",
      900: "black",
    };

    const fontSize = figmaJson.style?.fontSize;
    if (fontSize) {
      const tailwindClass = fontSizeMapping[fontSize] || `[${fontSize}px]`;
      styles.push(`text-${tailwindClass}`);
    }

    const fontWeight = figmaJson.style?.fontWeight;
    if (fontWeight) {
      const weightClass = fontWeightMapping[fontWeight];
      if (weightClass) styles.push(`font-${weightClass}`);
    }

    return styles.join(" ");
  }

  getBorder(figmaJson) {
    if (!figmaJson.strokes?.length || figmaJson.type === "VECTOR") return "";

    const stroke = figmaJson.strokes[0];
    const opacity = stroke.opacity ?? 1;
    const color = this.getColor(stroke.color, opacity);
    return `border border-[${color}]`;
  }

  getDropShadow(figmaJson) {
    const styles = [];
    const effects = figmaJson.effects || [];

    for (const effect of effects) {
      if (effect.type === "DROP_SHADOW" && effect.visible) {
        styles.push("shadow-md");
        if (effect.radius) styles.push(`shadow-[${effect.radius}px]`);
        const color = this.getColor(effect.color);
        styles.push(`shadow-[${color}]`);
      }
    }

    return styles.join(" ");
  }

  getTextColor(figmaJson) {
    if (figmaJson.type !== "TEXT" || !figmaJson.fills?.length) return "";

    const textColor = figmaJson.fills[0].color;
    if (!textColor) return "";

    const color = this.getColor(textColor);
    return `text-[${color}]`;
  }

  getBackgroundColor(figmaJson) {
    const bgColor = figmaJson.backgroundColor;
    if (!bgColor) return "";

    const color = this.getColor(bgColor);
    return `bg-[${color}]`;
  }

  getLayout(figmaJson) {
    const styles = [];
    const {
      layoutMode,
      primaryAxisAlignItems,
      counterAxisAlignItems,
      layoutWrap,
    } = figmaJson;

    if (layoutMode === "HORIZONTAL") {
      styles.push("flex flex-row");
    } else if (layoutMode === "VERTICAL") {
      styles.push("flex flex-col");
    }

    const primaryAxisMap = {
      CENTER: "justify-center",
      MIN: "justify-start",
      MAX: "justify-end",
      SPACE_BETWEEN: "justify-between",
      SPACE_AROUND: "justify-around",
      SPACE_EVENLY: "justify-evenly",
    };

    const counterAxisMap = {
      CENTER: "items-center",
      MIN: "items-start",
      MAX: "items-end",
    };

    if (primaryAxisAlignItems && primaryAxisMap[primaryAxisAlignItems]) {
      styles.push(primaryAxisMap[primaryAxisAlignItems]);
    }

    if (counterAxisAlignItems && counterAxisMap[counterAxisAlignItems]) {
      styles.push(counterAxisMap[counterAxisAlignItems]);
    }

    if (layoutWrap === "WRAP") {
      styles.push("flex-wrap");
    }

    return styles.join(" ");
  }

  figmaToTailwind(figmaJson) {
    const styles = [];

    // Width and Height
    const heightAndWidth = this.getWidthAndHeight(figmaJson);
    if (heightAndWidth) styles.push(heightAndWidth);

    // Padding
    const padding = this.getPadding(figmaJson);
    if (padding) styles.push(padding);

    // Font Size and Weight
    const fontStyles = this.getFontSizeAndWeight(figmaJson);
    if (fontStyles) styles.push(fontStyles);

    // Background Color
    const bgColor = this.getBackgroundColor(figmaJson);
    if (bgColor) styles.push(bgColor);

    // Border
    const border = this.getBorder(figmaJson);
    if (border) styles.push(border);

    // Border Radius
    const borderRadius = this.getBorderRadius(figmaJson);
    if (borderRadius) styles.push(borderRadius);

    // Shadow Effects
    // const dropShadow = this.getDropShadow(figmaJson);
    // if (dropShadow) styles.push(dropShadow);

    // Layout Mode
    const layoutStyles = this.getLayout(figmaJson);
    if (layoutStyles) styles.push(layoutStyles);

    // Text Color
    const textColor = this.getTextColor(figmaJson);
    if (textColor) styles.push(textColor);

    // Gap
    const gap = this.getGap(figmaJson);
    if (gap) styles.push(gap);

    return styles.join(" ");
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
    const styles = this.figmaToTailwind(node);
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
    const styles = this.figmaToTailwind(node);

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
