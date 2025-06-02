import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default class FigmaService {
  constructor() {
    this.figmaToken = process.env.FIGMA_TOKEN;
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
