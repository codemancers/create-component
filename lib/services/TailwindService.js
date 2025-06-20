import colors from "tailwindcss/colors";
import { parse, formatHex8 } from "culori";

import {
  BORDER_RADIUS_MAPPING,
  FLEX_COUNTER_AXIS_MAPPING,
  FLEX_PRIMARY_AXIS_MAPPING,
  FONT_SIZE_MAPPING,
  FONT_WEIGHT_MAPPING,
  TAILWIND_MAPPING,
} from "./tailwindConstants.js";

export default class TailwindService {
  constructor() {
    this.tailwindMapping = TAILWIND_MAPPING;
    this.borderRadiusMapping = BORDER_RADIUS_MAPPING;
    this.fontSizeMapping = FONT_SIZE_MAPPING;
    this.fontWeightMapping = FONT_WEIGHT_MAPPING;
    this.primaryAxisMap = FLEX_PRIMARY_AXIS_MAPPING;
    this.counterAxisMap = FLEX_COUNTER_AXIS_MAPPING;
    this.colorMap = this.buildTailwindColorMap();
  }

  buildTailwindColorMap() {
    const oklchColorMap = {};
    const skip = ["lightBlue", "warmGray", "trueGray", "coolGray", "blueGray"];

    for (const [colorName, shades] of Object.entries(colors)) {
      if (typeof shades === "object" && !skip.includes(colorName)) {
        for (const [shade, hex] of Object.entries(shades)) {
          const normalizedHex = hex.toLowerCase();
          oklchColorMap[normalizedHex] = `${colorName}-${shade}`;
        }
      } else if (typeof shades === "string") {
        oklchColorMap[shades.toLowerCase()] = `${colorName}`;
      }
    }

    let tailwindColorMap = {};
    for (const [oklchStr, tailwindName] of Object.entries(oklchColorMap)) {
      const parsed = parse(oklchStr); // returns a color object
      if (parsed) {
        const hex = formatHex8(parsed); // returns hex like "#64748b"
        tailwindColorMap[hex] = tailwindName;
      }
    }

    tailwindColorMap["#ffffff"] = "white";
    tailwindColorMap["#000000"] = "black";

    return tailwindColorMap;
  }

  hexToRgba(hex) {
    hex = hex.replace("#", "");

    if (hex.length === 6) {
      hex += "ff";
    }

    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(6, 8), 16),
    ];
  }

  colorDistance(rgba1, rgba2) {
    return Math.sqrt(
      (rgba1[0] - rgba2[0]) ** 2 +
        (rgba1[1] - rgba2[1]) ** 2 +
        (rgba1[2] - rgba2[2]) ** 2 +
        (rgba1[3] - rgba2[3]) ** 2
    );
  }

  findClosestColorName(inputHex, colorMap) {
    const inputRgba = this.hexToRgba(inputHex);
    let closest = null;
    let minDist = Infinity;

    for (const [hex8, name] of Object.entries(colorMap)) {
      const mapRgba = this.hexToRgba(hex8);
      const dist = this.colorDistance(inputRgba, mapRgba);
      if (dist < minDist) {
        minDist = dist;
        closest = name;
      }
    }

    return closest;
  }

  getColor(color, opacity = 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(color.a * opacity * 255);
    let hex = `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a
      .toString(16)
      .padStart(2, "0")}`;
    let tailwindClass = this.colorMap[hex];
    return tailwindClass
      ? tailwindClass
      : this.findClosestColorName(hex, this.colorMap);
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
    const cornerRadius = figmaJson.cornerRadius;
    if (!cornerRadius) return "";

    if (cornerRadius === 4) return "rounded";
    const tailwindClass =
      this.borderRadiusMapping[cornerRadius] || `[${cornerRadius}px]`;
    return `rounded-${tailwindClass}`;
  }

  getFontSizeAndWeight(figmaJson) {
    const styles = [];

    const fontSize = figmaJson.style?.fontSize;
    if (fontSize) {
      const tailwindClass = this.fontSizeMapping[fontSize] || `[${fontSize}px]`;
      styles.push(`text-${tailwindClass}`);
    }

    const fontWeight = figmaJson.style?.fontWeight;
    if (fontWeight) {
      const weightClass = this.fontWeightMapping[fontWeight];
      if (weightClass) styles.push(`font-${weightClass}`);
    }

    return styles.join(" ");
  }

  getBorder(figmaJson) {
    if (!figmaJson.strokes?.length || figmaJson.type === "VECTOR") return "";

    const stroke = figmaJson.strokes[0];
    const opacity = stroke.opacity ?? 1;
    const color = this.getColor(stroke.color, opacity);
    return `border border-${color}`;
  }

  getDropShadow(figmaJson) {
    const styles = [];
    const effects = figmaJson.effects || [];

    for (const effect of effects) {
      if (effect.type === "DROP_SHADOW" && effect.visible) {
        const { offset, radius, color } = effect;
        const x = offset?.x || 0;
        const y = offset?.y || 0;
        const blur = radius || 0;

        const shadowSize = this.mapToTailwindShadowSize(x, y, blur);
        styles.push(shadowSize);

        const shadowColor = this.getColor(color);
        styles.push(`shadow-${shadowColor}`);
      }
    }

    return styles.join(" ");
  }

  mapToTailwindShadowSize(x, y, blur) {
    const maxOffset = Math.max(Math.abs(x), Math.abs(y));

    if (blur <= 1 && maxOffset <= 1) return "shadow-sm";
    if (blur <= 2 && maxOffset <= 2) return "shadow";
    if (blur <= 4 && maxOffset <= 4) return "shadow-md";
    if (blur <= 6 && maxOffset <= 6) return "shadow-lg";
    if (blur <= 8 && maxOffset <= 8) return "shadow-xl";
    return "shadow-2xl";
  }

  getTextColor(figmaJson) {
    if (figmaJson.type !== "TEXT" || !figmaJson.fills?.length) return "";

    const textColor = figmaJson.fills[0].color;
    if (!textColor) return "";

    const color = this.getColor(textColor);
    return `text-${color}`;
  }

  getBackgroundColor(figmaJson) {
    const bgColor = figmaJson.backgroundColor;
    if (!bgColor) return "";

    const color = this.getColor(bgColor);
    return `bg-${color}`;
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

    if (primaryAxisAlignItems && this.primaryAxisMap[primaryAxisAlignItems]) {
      styles.push(this.primaryAxisMap[primaryAxisAlignItems]);
    }

    if (counterAxisAlignItems && this.counterAxisMap[counterAxisAlignItems]) {
      styles.push(this.counterAxisMap[counterAxisAlignItems]);
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
    const dropShadow = this.getDropShadow(figmaJson);
    if (dropShadow) styles.push(dropShadow);

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
}
