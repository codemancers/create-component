import os from "os";
import path from "path";
import fs from "fs";

const CONFIG_DIR = path.join(os.homedir(), ".create-component");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export default class FigmaService {
  constructor() {
    this.figmaToken = this.getFigmaAccessToken();
  }

  getFigmaAccessToken() {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      if (config.figma_access_token) return config.figma_access_token;
    }
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

  async getFigmaJson(fileId, nodeId) {
    const url = `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}`;
    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": this.figmaToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Figma data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}
