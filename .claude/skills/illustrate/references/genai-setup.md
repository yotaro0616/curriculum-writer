# genai 経路のセットアップ（API キー取得手順）

/illustrate の genai 経路（選択式）で初回のみ必要な、API キーの取得・設定手順。キーが設定済みなら読む必要はない（確認コマンドは SKILL.md 本文）。

## Gemini（`GEMINI_API_KEY`）未設定の場合

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを作成
2. `~/.zshrc`（または `~/.bashrc`）に追加: `export GEMINI_API_KEY="取得したキー"`
3. `source ~/.zshrc` で反映

## OpenAI（`OPENAI_API_KEY`）未設定の場合

1. [OpenAI Platform](https://platform.openai.com/) にサインアップ／ログイン
2. [Billing 設定](https://platform.openai.com/settings/organization/billing/overview) で支払い方法を登録しクレジットを購入する（画像生成は従量課金。残高がないと `401 / insufficient_quota` になる）
3. [API keys](https://platform.openai.com/api-keys) で「Create new secret key」を押し、表示されたキー（`sk-...`）をコピーする（**作成時しか全体表示されない**ので必ず控える）
4. `~/.zshrc` に追加: `export OPENAI_API_KEY="取得したキー"`
5. `source ~/.zshrc` で反映
