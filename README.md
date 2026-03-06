# actions-al-label

PR本文の「使用した生成AI」チェックに応じて、PRへラベルを自動で付与・削除する GitHub Actions 用 Composite Action です。  
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
    types: [opened, edited]

permissions:
  pull-requests: write
  issues: write

jobs:
  manage-ai-labels:
    runs-on: ubuntu-latest
    steps:
      - uses: naviplus-asp/actions-al-label@v1
```

### 2. オプション指定（任意）

AIツール名リストやセクション見出しを変えたい場合は、`with` で指定できます。

```yaml
      - uses: naviplus-asp/actions-al-label@v1
        with:
          ai_tools: '["GitHub Copilot","Cursor","Devin","Claude Code","Codex","Kiro"]'
          section_heading: '## 使用した生成AI'
          label_color: '7B68EE'
          label_description: '生成AIツール'
```

| 入力 | 説明 | デフォルト |
|------|------|------------|
| `ai_tools` | AIツール名のリスト（JSON配列文字列） | 上記の6ツール |
| `section_heading` | PR本文でチェック欄を探す見出し | `## 使用した生成AI` |
| `label_color` | 作成するラベルの色（6桁16進、`#`なし） | `7B68EE` |
| `label_description` | 作成するラベルの説明 | `生成AIツール` |

- **セクションが無いPR**: PR本文に `section_heading` が含まれない場合は、ラベルの付与・削除は行いません（既存ラベルはそのまま）。

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

## バージョン

- `@v1` … 安定版（運用に合わせてタグを更新してください）

## ライセンス

This project is licensed under the MIT License.
