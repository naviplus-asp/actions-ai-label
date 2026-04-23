# actions-ai-label

PR本文の「使用した生成AI」チェックと、PRコミットの `Co-Authored-By` メールアドレスに応じて、PRへラベルを自動で付与・削除する GitHub Actions 用 Composite Action です。  
Findy Team+ などで生成AI利用の効果測定を行う際に利用できます。

## 必要な権限

この Action を利用するワークフローには次の `permissions` を付与してください。

- `pull-requests: write`
- `issues: write`

## 使い方

### 1. ワークフローの追加

リポジトリに `.github/workflows/ai-label.yml` を追加します。

```yaml
name: AI Label Management
on:
  pull_request:
    types: [opened, edited, synchronize]

permissions:
  pull-requests: write
  issues: write

jobs:
  manage-ai-labels:
    runs-on: ubuntu-latest
    steps:
      - uses: naviplus-asp/actions-ai-label@v3
```

### 2. オプション指定（任意）

AIツール名リストやセクション見出しを変えたい場合は、`with` で指定できます。

```yaml
      - uses: naviplus-asp/actions-ai-label@v3
        with:
          ai_tools: '["GitHub Copilot","Cursor","Devin","Claude Code","Codex","Kiro"]'
          section_heading: '## 使用した生成AI'
          label_color: '7B68EE'
          label_description: '生成AIツール'
          enable_coauthor_email_detection: 'true'
          ai_tool_emails: '{"GitHub Copilot":["copilot@github.com"],"Cursor":["cursoragent@cursor.com"],"Codex":["noreply@openai.com"]}'
```

| 入力 | 説明 | デフォルト |
|------|------|------------|
| `ai_tools` | AIツール名のリスト（JSON配列文字列） | 上記の6ツール |
| `section_heading` | PR本文でチェック欄を探す見出し | `## 使用した生成AI` |
| `label_color` | 作成するラベルの色（6桁16進、`#`なし） | `7B68EE` |
| `label_description` | 作成するラベルの説明 | `生成AIツール` |
| `enable_coauthor_email_detection` | PRコミットの `Co-Authored-By` メールアドレスからAI利用を判定するか | `false` |
| `ai_tool_emails` | ラベル名と判定用メールアドレス配列の対応表（JSONオブジェクト文字列） | `GitHub Copilot` / `Cursor` / `Devin` / `Claude Code` / `Codex` の既定値入り |

- **セクションが無いPR**: PR本文に `section_heading` が含まれない場合は、ラベルの付与・削除は行いません（既存ラベルはそのまま）。
- **コミットベース判定**: `enable_coauthor_email_detection: 'true'` の場合、PR本文にセクションが無くても `Co-Authored-By` のメールアドレスに一致したラベルは付与・削除されます。
- **`synchronize` の推奨**: コミット追加・差し替え時にも判定を更新したい場合、ワークフローの `pull_request.types` に `synchronize` を含めてください。

### 3. PRテンプレートにチェックリストを追加

PRの説明欄でチェックされた項目に応じてラベルが付くため、PRテンプレート（`.github/pull_request_template.md`）に次のブロックを追加してください。既存のテンプレートの末尾や適当な見出しの下に貼り付けて構いません。

```markdown
## 使用した生成AI

- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Devin
- [ ] Claude Code
- [ ] Codex
- [ ] Kiro
```

`ai_tools` を変更した場合は、上記のチェック項目も同じ内容に揃えてください。

`ai_tool_emails` を使う場合は、ラベル名をキー、判定対象メールアドレス配列を値にしたJSONを指定します。

```yaml
      - uses: naviplus-asp/actions-al-label@v3
        with:
          enable_coauthor_email_detection: 'true'
          ai_tool_emails: >-
            {"Codex":["noreply@openai.com"],"Claude Code":["devin@anthropic.example"]}
```

メールアドレスは大文字小文字を区別せずに比較されます。デフォルトでは `GitHub Copilot`、`Cursor`、`Devin`、`Claude Code`、`Codex` の判定用メールアドレスを内蔵しています。`Kiro` は判定用メールアドレスが未確定のため、デフォルト設定には含めていません。

## バージョン

- `@v3` / `@v3.0.0` … `Co-Authored-By` ベースの自動判定機能を含む版
- `@v2` … PR本文チェックのみの従来版

## ライセンス

This project is licensed under the MIT License.
