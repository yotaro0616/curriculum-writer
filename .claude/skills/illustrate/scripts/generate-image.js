#!/usr/bin/env node
/**
 * Gemini画像生成スクリプト（教材概念図向け）
 *
 * デフォルト: Pro モデル / 16:9 / 4K
 * 出力先: assets/diagrams/output/
 * プロンプト保存先: assets/diagrams/prompts/
 *
 * 使用例:
 *   node generate-image.js "イベントループの概念図" --name event-loop
 *   node generate-image.js "Clean Architectureの層構造" --name clean-architecture-layers
 */

const fs = require("fs");
const path = require("path");

const MODELS = {
  flash: "gemini-2.0-flash-preview-image-generation",
  pro: "gemini-3-pro-image-preview",
};

// プロジェクトルートを検出（.git ディレクトリを探す）
function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function getGeminiApiKey() {
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey) return envKey;

  throw new Error(
    "Gemini APIキーが見つかりません。GEMINI_API_KEY環境変数を設定してください。"
  );
}

/**
 * プロンプトを Markdown ファイルとして保存
 */
function savePrompt(promptsDir, name, prompt, options) {
  const filename = `${name}.md`;
  const filepath = path.join(promptsDir, filename);

  const content = `# ${name}

**モデル**: ${options.model || "pro"} | **アスペクト比**: ${options.aspectRatio || "16:9"} | **解像度**: ${options.resolution || "4k"}

## プロンプト本文

\`\`\`
${prompt}
\`\`\`

## 生成日時

${new Date().toISOString().slice(0, 10)}
`;

  fs.writeFileSync(filepath, content);
  console.log(`📝 プロンプト保存: ${filepath}`);
}

async function generateImage(options) {
  const {
    prompt,
    aspectRatio = "16:9",
    outputPath,
    model = "pro",
    resolution = "4k",
    name,
  } = options;

  const apiKey = getGeminiApiKey();
  const modelId = MODELS[model] || MODELS.pro;
  const modelLabel = model === "pro" ? "🚀 Pro" : "⚡ Flash";

  console.log(`${modelLabel} 画像生成中: "${prompt.substring(0, 80)}..."`);
  console.log(`📐 アスペクト比: ${aspectRatio}`);
  console.log(`📏 解像度: ${resolution}`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  // プロンプトの強化
  let enhancedPrompt = prompt;
  if (model === "pro") {
    if (prompt.length < 50) {
      enhancedPrompt = `Create a high-quality, detailed image: ${prompt}. Pay attention to composition, lighting, and fine details.`;
    }
    if (resolution === "4k") {
      enhancedPrompt +=
        " Render at maximum 4K quality with exceptional detail.";
    }
  }

  const requestBody = {
    contents: [{ parts: [{ text: enhancedPrompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize:
          { "4k": "4K", "2k": "2K", "1k": "1K", high: "1K" }[
            resolution.toLowerCase()
          ] || "4K",
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.candidates || !result.candidates[0]?.content?.parts) {
    console.error("APIレスポンス:", JSON.stringify(result, null, 2));
    throw new Error("画像が生成されませんでした");
  }

  const images = [];
  for (const part of result.candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
      images.push({
        data: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType,
      });
    }
  }

  if (images.length === 0) {
    console.error(
      "パーツ:",
      JSON.stringify(result.candidates[0].content.parts, null, 2)
    );
    throw new Error("画像が生成されませんでした（画像パーツなし）");
  }

  // 出力先ディレクトリの決定
  const projectRoot = findProjectRoot();
  const defaultOutputDir = path.join(projectRoot, "assets/diagrams/output");
  const promptsDir = path.join(projectRoot, "assets/diagrams/prompts");

  const outputDir =
    outputPath &&
    fs.statSync(outputPath, { throwIfNoEntry: false })?.isDirectory()
      ? outputPath
      : outputPath
        ? path.dirname(outputPath)
        : defaultOutputDir;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // プロンプトを保存
  if (name) {
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }
    savePrompt(promptsDir, name, prompt, { model, aspectRatio, resolution });
  }

  const savedPaths = [];
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  for (let i = 0; i < images.length; i++) {
    const ext = images[i].mimeType === "image/png" ? "png" : "jpg";
    let filename;

    if (
      outputPath &&
      !fs.statSync(outputPath, { throwIfNoEntry: false })?.isDirectory()
    ) {
      filename = path.basename(outputPath);
    } else if (name) {
      filename =
        images.length === 1 ? `${name}.${ext}` : `${name}_${i + 1}.${ext}`;
    } else {
      filename = `image_${timestamp}_${i + 1}.${ext}`;
    }

    const fullPath = path.join(outputDir, filename);

    fs.writeFileSync(fullPath, images[i].data);
    savedPaths.push(fullPath);
    console.log(`✅ 保存: ${fullPath}`);
  }

  return savedPaths;
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`使用法: node generate-image.js <prompt> [options]

オプション:
  --name <name>    ファイル名（英語、ハイフン区切り）※推奨
  --aspect <ratio> アスペクト比（デフォルト: 16:9）
  --resolution <r> 解像度（デフォルト: 4k）
  --output <path>  出力先パス（デフォルト: assets/diagrams/output/）
  --flash          Flash モデル使用（高速・低品質）

例:
  node generate-image.js "イベントループの概念図" --name event-loop
  node generate-image.js "Clean Architectureの層構造" --name clean-architecture-layers
  node generate-image.js "SPAとMPAの比較" --name spa-vs-mpa
`);
    process.exit(1);
  }

  // デフォルト: Pro / 16:9 / 4K
  const options = { model: "pro", aspectRatio: "16:9", resolution: "4k" };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--flash") {
      options.model = "flash";
    } else if (args[i] === "--pro") {
      options.model = "pro";
    } else if (args[i] === "--aspect" && args[i + 1]) {
      options.aspectRatio = args[++i];
    } else if (args[i] === "--resolution" && args[i + 1]) {
      options.resolution = args[++i];
    } else if (args[i] === "--output" && args[i + 1]) {
      options.outputPath = args[++i];
    } else if (args[i] === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (!args[i].startsWith("--")) {
      options.prompt = args[i];
    }
  }

  if (!options.prompt) {
    console.error("エラー: プロンプトを指定してください");
    process.exit(1);
  }

  generateImage(options)
    .then((paths) => console.log("\n生成完了:", paths.join(", ")))
    .catch((err) => {
      console.error("エラー:", err.message);
      process.exit(1);
    });
}

module.exports = { generateImage };
