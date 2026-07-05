#!/usr/bin/env node
/**
 * 画像生成スクリプト（教材概念図向け）— Gemini / OpenAI 両対応
 *
 * プロバイダ（--provider で選択。既定は gemini）:
 *   - gemini : Google Generative Language API。GEMINI_API_KEY が必要。
 *              モデルは gemini-3-pro-image（既定）/ gemini-3.1-flash-image。4K / 16:9 まで可。
 *   - openai : OpenAI Images API。OPENAI_API_KEY が必要。
 *              モデルは gpt-image-2（既定）/ gpt-image-1.5 / gpt-image-1-mini。
 *              gpt-image-2 は flexible サイズ（既定 1792x1008＝16:9、4K も可）。
 *              gpt-image-1.5 / mini は 1024x1024 / 1536x1024 / 1024x1536 の固定3サイズのみ。
 *   ※ "codex" は openai の別名として受理する（実体は OpenAI GPT Image。Codex 自体に画像生成機能はない）。
 *
 * 既定: provider=gemini / Pro / 16:9 / 4K
 * 出力先: assets/diagrams/output/
 * プロンプト保存先: assets/diagrams/prompts/
 *
 * 使用例:
 *   node generate-image.js "イベントループの概念図" --name event-loop
 *   node generate-image.js "SPAとMPAの比較" --name spa-vs-mpa --provider openai
 *   node generate-image.js "..." --name x --openai --model gpt-image-1.5 --quality high --size 1536x1024
 */

const fs = require("fs");
const path = require("path");

// --- Gemini モデル（Gemini API の現行 GA 版、2026-06 時点）---
// 旧 "gemini-2.0-flash-preview-image-generation" は廃止済み。
// 利用可能なモデルは `GET https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY` で確認できる。
const GEMINI_MODELS = {
  flash: "gemini-3.1-flash-image",
  pro: "gemini-3-pro-image",
};

// --- OpenAI Images API（2026-06 時点）---
// model 受理値: gpt-image-2（フラッグシップ・既定）/ gpt-image-1.5 / gpt-image-1-mini。
// quality: low / medium / high / auto。
const OPENAI_DEFAULT_MODEL = "gpt-image-2";

// gpt-image-1.5 / gpt-image-1 / gpt-image-1-mini は固定3サイズのみ（+auto）。
const OPENAI_FIXED_SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"];

// gpt-image-2 は flexible サイズに対応（2026-06 時点）:
//   両辺が16の倍数 / 長辺 ≤ 3840 / 長辺:短辺 ≤ 3:1 / 総ピクセル 655,360〜8,294,400。
function isValidOpenAISize(size, model) {
  if (size === "auto") return true;
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) return false;
  if (!/^gpt-image-2/.test(model)) {
    return OPENAI_FIXED_SIZES.includes(size);
  }
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w % 16 !== 0 || h % 16 !== 0) return false;
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  if (long > 3840) return false;
  if (long / short > 3) return false;
  const px = w * h;
  if (px < 655360 || px > 8294400) return false;
  return true;
}

// プロジェクトルートを検出（.git ディレクトリを探す）
function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

// プロバイダ名の正規化（codex → openai）
function normalizeProvider(value) {
  const v = (value || "").toLowerCase();
  if (v === "openai" || v === "codex" || v === "gpt") return "openai";
  if (v === "gemini" || v === "google") return "gemini";
  return value; // 不明値はそのまま返してバリデーションに委ねる
}

function getApiKey(provider) {
  if (provider === "openai") {
    const k = process.env.OPENAI_API_KEY;
    if (k) return k;
    throw new Error(
      "OpenAI APIキーが見つかりません。OPENAI_API_KEY 環境変数を設定してください（取得方法は SKILL.md の「前提条件 > API キー」を参照）。"
    );
  }
  const k = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (k) return k;
  throw new Error(
    "Gemini APIキーが見つかりません。GEMINI_API_KEY 環境変数を設定してください。"
  );
}

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg"; // image/jpeg ほか
}

/**
 * プロンプトを Markdown ファイルとして保存
 */
function savePrompt(promptsDir, name, prompt, metaLine) {
  const filename = `${name}.md`;
  const filepath = path.join(promptsDir, filename);

  const content = `# ${name}

${metaLine}

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

/**
 * Gemini で画像を生成し、{data, mimeType} の配列を返す
 */
async function callGemini({ prompt, aspectRatio, resolution, tier }, apiKey) {
  const modelId = GEMINI_MODELS[tier] || GEMINI_MODELS.pro;
  const modelLabel = tier === "flash" ? "⚡ Flash" : "🚀 Pro";

  console.log(`${modelLabel} 画像生成中（Gemini）: "${prompt.substring(0, 80)}..."`);
  console.log(`📐 アスペクト比: ${aspectRatio}`);
  console.log(`📏 解像度: ${resolution}`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  // プロンプトの強化
  let enhancedPrompt = prompt;
  if (tier === "pro") {
    if (prompt.length < 50) {
      enhancedPrompt = `Create a high-quality, detailed image: ${prompt}. Pay attention to composition, lighting, and fine details.`;
    }
    if (resolution === "4k") {
      enhancedPrompt += " Render at maximum 4K quality with exceptional detail.";
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
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
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

  return images;
}

/**
 * OpenAI（GPT Image）で画像を生成し、{data, mimeType} の配列を返す
 */
async function callOpenAI({ prompt, model, size, quality, outputFormat }, apiKey) {
  console.log(`🟢 画像生成中（OpenAI）: "${prompt.substring(0, 80)}..."`);
  console.log(`🧩 モデル: ${model}`);
  console.log(`📐 サイズ: ${size} | ✨ 品質: ${quality} | 🖼  形式: ${outputFormat}`);

  if (!isValidOpenAISize(size, model)) {
    const hint = /^gpt-image-2/.test(model)
      ? "gpt-image-2 は両辺16の倍数・長辺≤3840・比率≤3:1・総画素65.5万〜829万なら任意サイズ可（16:9 は 1792x1008、4K は 3840x2160）。"
      : `${model} は固定3サイズのみ: ${OPENAI_FIXED_SIZES.join(" / ")}（16:9 や 4K が必要なら --model gpt-image-2）。`;
    throw new Error(`OpenAI のサイズ指定が不正です: "${size}"。${hint}`);
  }

  const url = "https://api.openai.com/v1/images/generations";
  const requestBody = {
    model,
    prompt,
    size,
    quality,
    n: 1,
    output_format: outputFormat,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.data || result.data.length === 0) {
    console.error("APIレスポンス:", JSON.stringify(result, null, 2));
    throw new Error("画像が生成されませんでした");
  }

  const mime =
    { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" }[
      result.output_format || outputFormat
    ] || "image/png";

  const images = [];
  for (const d of result.data) {
    if (d.b64_json) {
      images.push({ data: Buffer.from(d.b64_json, "base64"), mimeType: mime });
    }
  }

  if (images.length === 0) {
    console.error("data:", JSON.stringify(result.data, null, 2));
    throw new Error("画像が生成されませんでした（b64_json なし）");
  }

  if (result.usage) {
    console.log(`📊 トークン使用: ${JSON.stringify(result.usage)}`);
  }

  return images;
}

async function generateImage(options) {
  const {
    prompt,
    outputPath,
    name,
    aspectRatio = "16:9",
    resolution = "4k",
    tier = "pro",
    quality = "high",
    outputFormat = "png",
    model,
  } = options;

  const provider = normalizeProvider(options.provider || "gemini");
  const apiKey = getApiKey(provider);

  let images;
  let metaLine;

  if (provider === "openai") {
    const modelId = model || OPENAI_DEFAULT_MODEL;
    const size =
      options.size ||
      (/^gpt-image-2/.test(modelId) ? "1792x1008" : "1536x1024");
    images = await callOpenAI(
      { prompt, model: modelId, size, quality, outputFormat },
      apiKey
    );
    metaLine = `**プロバイダ**: openai | **モデル**: ${modelId} | **サイズ**: ${size} | **品質**: ${quality}`;
  } else if (provider === "gemini") {
    images = await callGemini({ prompt, aspectRatio, resolution, tier }, apiKey);
    metaLine = `**プロバイダ**: gemini | **モデル**: ${tier} | **アスペクト比**: ${aspectRatio} | **解像度**: ${resolution}`;
  } else {
    throw new Error(
      `不明なプロバイダ: "${provider}"。--provider gemini / openai（codex も可）を指定してください。`
    );
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
    savePrompt(promptsDir, name, prompt, metaLine);
  }

  const savedPaths = [];
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  for (let i = 0; i < images.length; i++) {
    const ext = extFromMime(images[i].mimeType);
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

共通オプション:
  --provider <p>   プロバイダ: gemini（既定）/ openai（codex も可）
  --name <name>    ファイル名（英語、ハイフン区切り）※推奨
  --output <path>  出力先パス（デフォルト: assets/diagrams/output/）

Gemini 用オプション:
  --aspect <ratio> アスペクト比（デフォルト: 16:9）
  --resolution <r> 解像度（デフォルト: 4k。白背景にしみが出る場合は 2k）
  --flash          Flash モデル使用（高速・低品質。既定は Pro）

OpenAI 用オプション（--provider openai / --openai / --codex）:
  --model <id>     gpt-image-2（既定）/ gpt-image-1.5 / gpt-image-1-mini
  --size <s>       gpt-image-2: 1792x1008（16:9・既定）/ 3840x2160（4K）等（両辺16の倍数）。1.5/mini: 1024x1024 / 1536x1024 / 1024x1536
  --quality <q>    low / medium / high（既定）
  --format <f>     png（既定）/ jpeg / webp

例:
  node generate-image.js "イベントループの概念図" --name event-loop
  node generate-image.js "SPAとMPAの比較" --name spa-vs-mpa --provider openai
  node generate-image.js "Clean Architectureの層構造" --name ca-layers --openai --model gpt-image-1.5
`);
    process.exit(1);
  }

  // デフォルト: provider=gemini / Pro / 16:9 / 4K（OpenAI 側の既定は high / 1536x1024 / png）
  const options = {
    provider: "gemini",
    tier: "pro",
    aspectRatio: "16:9",
    resolution: "4k",
    size: "1792x1008",
    quality: "high",
    outputFormat: "png",
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--provider" && args[i + 1]) {
      options.provider = args[++i];
    } else if (a === "--openai" || a === "--codex") {
      options.provider = "openai";
    } else if (a === "--gemini") {
      options.provider = "gemini";
    } else if (a === "--flash") {
      options.tier = "flash";
    } else if (a === "--pro") {
      options.tier = "pro";
    } else if (a === "--aspect" && args[i + 1]) {
      options.aspectRatio = args[++i];
    } else if (a === "--resolution" && args[i + 1]) {
      options.resolution = args[++i];
    } else if (a === "--size" && args[i + 1]) {
      options.size = args[++i];
    } else if (a === "--quality" && args[i + 1]) {
      options.quality = args[++i];
    } else if (a === "--format" && args[i + 1]) {
      options.outputFormat = args[++i];
    } else if (a === "--model" && args[i + 1]) {
      options.model = args[++i];
    } else if (a === "--output" && args[i + 1]) {
      options.outputPath = args[++i];
    } else if (a === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (!a.startsWith("--")) {
      options.prompt = a;
    }
  }

  // OpenAI で --size 未指定なら、モデルとアスペクト比から既定サイズを決める
  if (
    normalizeProvider(options.provider) === "openai" &&
    !args.includes("--size")
  ) {
    const modelId = options.model || OPENAI_DEFAULT_MODEL;
    const isV2 = /^gpt-image-2/.test(modelId);
    const map = isV2
      ? {
          "16:9": "1792x1008",
          "3:2": "1536x1024",
          "1:1": "1024x1024",
          "9:16": "1008x1792",
          "2:3": "1024x1536",
        }
      : {
          "16:9": "1536x1024",
          "3:2": "1536x1024",
          "1:1": "1024x1024",
          "9:16": "1024x1536",
          "2:3": "1024x1536",
        };
    options.size =
      map[options.aspectRatio] || (isV2 ? "1792x1008" : "1536x1024");
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

module.exports = { generateImage, isValidOpenAISize };
