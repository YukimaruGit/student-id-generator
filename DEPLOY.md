# Cloudflare Pages Functions デプロイ手順

## 概要
学生証ジェネレーターの共有URLで、X/Discord等でカードプレビュー（OGP）を確実に表示させるためのシステムです。

## 前提条件
- Cloudflareアカウント
- GitHubリポジトリ（このプロジェクト）

## フォルダ構成（必須）
```
student-id-generator/
├─ functions/
│   └─ s/
│      └─ [slug].js             # 共有用関数（必須）
└─ public/
    └─ index.html               # 最小限のファイル（必須）
```

## デプロイ手順

### 1. Cloudflare Pages プロジェクト作成
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** → **Create a project**
3. **Connect to Git** を選択
4. GitHubリポジトリ（`student-id-generator`）を選択
5. プロジェクト名を入力（例：`after-school-share`）
6. **Build and deploy settings**:
   - Framework preset: **None（なし）**
   - Build command: **空欄**
   - **Build output directory: `public`** ← 重要：`/` や `(root)` は不可
   - Root directory（Advanced）: **空欄**（=リポジトリ直下）
7. **Save and Deploy**

### 2. 自動デプロイ確認
- GitHubにプッシュすると自動でデプロイされます
- デプロイ完了後、**Production domain** が発行されます（例：`https://after-school-share.pages.dev`）

### 3. 共有ベースURLの更新（必須）
デプロイ完了後、`generator.html`の`SHARE_BASE`を実際のProduction domainに更新:

```js
const SHARE_BASE = 'https://after-school-share.pages.dev'; // ← 実際のProduction domain
```

**重要**: この更新を行わないと、共有URLにGit名（`yukimarugit.github.io`）が含まれたままになります。

### 4. 動作確認（必須）
1. 共有URLを生成: `https://<Production-domain>/s/test`
2. ページソースを確認:
   ```html
   <meta property="og:image" content="https://res.cloudinary.com/di5xqlddy/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/test.png">
   ```
3. OGP画像が表示されることを確認

## 設定変更

### 独自ドメイン化（任意）
1. Cloudflare Pages の **Custom domains** で `ogp.<your-domain>` を追加
2. CNAMEレコードを設定
3. `generator.html` の `SHARE_BASE` を更新:
   ```js
   const SHARE_BASE = 'https://ogp.<your-domain>';
   ```
4. `functions/s/[slug].js` の `REDIRECT_TO` を更新:
   ```js
   const REDIRECT_TO = 'https://<your-domain>/index.html';
   ```

## トラブルシューティング

### OGP画像が表示されない
- Cloudinaryの設定を確認
- `functions/s/[slug].js` の構文エラーを確認
- Functionsディレクトリが正しく配置されているか確認

### デプロイエラー
- GitHubリポジトリの権限を確認
- Cloudflare Pagesの設定を確認
- **Build output directory** が `public` になっているか確認

## 技術仕様
- **Functions**: Cloudflare Pages Functions（`functions/s/[slug].js`）
- **OGP**: サーバーサイドレンダリング（JS後入れ禁止）
- **画像**: Cloudinary Unsigned プリセット
- **変換**: `w_1200,h_630,c_fill,q_auto,f_auto`
- **ビルド出力**: `public/` ディレクトリ

## 重要：デプロイ後の確認事項
1. **共有URLが`github.io`を含まない**ことを確認
2. **X Card Validator**で画像プレビューが表示されることを確認
3. **Discord**でサムネイルが表示されることを確認
4. **Cloudinary画像の直リンク**が200で返されることを確認

## 禁止事項
- `SHARE_BASE` に **Studio / GitHub Pages / workers.dev** を入れない
- Pages の **Preview domain** を使わない
- **Build output directory** を `/` や `(root)` に設定しない
