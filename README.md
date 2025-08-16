# 放課後クロニクル 学生証ジェネレーター

放課後クロニクルの世界観で、あなただけの学生証を作成できるジェネレーターです。

## 機能

- 顔写真のアップロード
- 学生情報の入力（氏名、学科、部活動、生年月日）
- 学生証の生成
- SNSシェア機能（X、LINE）

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/YukimaruGit/student-id-generator.git
cd student-id-generator
```

2. Cloudflare Workersの設定
```bash
# Wranglerのインストール
npm install -g wrangler

# ログイン
wrangler login

# 開発サーバーの起動
wrangler dev

# 本番環境へのデプロイ
wrangler deploy
```

## シェア機能の設定と検証

### Cloudflare Workersのセットアップ

1. `wrangler.toml`の設定
   - `name`をあなたのプロジェクト名に変更
   - `account_id`を自分のCloudflareアカウントIDに変更

2. デプロイ
```bash
wrangler deploy
```

### SNSシェアの動作確認

1. Twitter Card Validatorでの確認
   - https://cards-dev.twitter.com/validator にアクセス
   - 生成されたシェアURLを入力（例: `https://after-school-share.your-subdomain.workers.dev/?img=https://example.com/image.png`）
   - 「カードの再取得」をクリックして最新の情報を取得
   - プレビューが正しく表示されることを確認

2. LINEシェアデバッガーでの確認
   - https://access.line.me/share-debugger/ にアクセス
   - 生成されたシェアURLを入力
   - 「デバッグ」をクリックして最新の情報を取得
   - プレビューが正しく表示されることを確認

### 新しい共有機能の検証手順

1. **Cloudflare Pages Functionsのデプロイ**
   - `functions/s/[slug].js`をCloudflare Pagesにデプロイ
   - `https://ogp.yukimarugit.github.io/s/test`が200を返すことを確認

2. **X Card Validatorでの確認**
   - https://cards-dev.twitter.com/validator にアクセス
   - 生成された短い共有URL（`/s/{slug}`形式）を入力
   - 「カードの再取得」をクリック
   - 学生証画像のプレビューが表示されることを確認

3. **Discordでの確認**
   - Discordに短い共有URLを貼り付け
   - 画像サムネイルが表示されることを確認

4. **ローカル検証**
   - Chromeで`file://`プロトコルで`index.html`を開く
   - ボタンクリックで正常に遷移することを確認
   - コンソールに`Dangerous protocol blocked`エラーが出ないことを確認

### キャッシュのクリア手順

SNSでシェアした画像が更新されない場合は、以下の手順でキャッシュをクリアしてください：

1. Twitter
   - Twitter Card Validatorで対象URLを検証
   - 「カードの再取得」をクリック
   - 新しいツイートで変更を確認

2. LINE
   - LINEシェアデバッガーで対象URLを入力
   - 「デバッグ」をクリック
   - LINEアプリで新しくシェアして変更を確認

## 設定が必要な項目

### Cloudflare Pages Functions
- **ドメイン**: `https://ogp.yukimarugit.github.io` に変更が必要
- **ファイル**: `functions/s/[slug].js` の設定値を確認
  - `CLOUD_NAME`: Cloudinaryのクラウド名（現在: `di5xqlddy`）
  - `REDIRECT_TO`: メインサイトのURL（現在: `https://yukimarugit.github.io/student-id-generator/index.html`）
  - `TWITTER_SITE`: Twitterアカウント（現在: `@as_chronicle`）

### generator.html
- **SHARE_BASE**: Cloudflare Pages Functionsのドメイン（現在: `https://ogp.yukimarugit.github.io`）

## 技術仕様

- フロントエンド: HTML, CSS, JavaScript
- 画像処理: Canvas API
- 画像ホスティング: Cloudinary
- シェアページ: Cloudflare Pages Functions

## 最新の修正内容（v2.1.0）

### 修正された問題

1. **クリック時のテキスト選択問題**
   - ボタンやリンクをクリックした際の不要なテキスト選択を無効化
   - フォーム入力欄は除外（`.copyable`クラスで選択可能）

2. **診断ゲーム遷移問題**
   - `generator → (診断結果を見る) → index` の遷移でパラメータが消失する問題を修正
   - iFrame検知時にクエリパラメータとハッシュを引き継ぐように改善
   - `quiz.html`で`showResult=true`を受けて結果UIを即時表示

3. **画像付き共有機能の実装**
   - サーバレスで"共有専用ページ（OGP静的HTML）"を返す方式Aを実装
   - Cloudflare Pages Functionsを使用したOGP画像生成
   - X/Discord等での画像プレビュー表示に対応

4. **ローカル検証時の遷移問題**
   - `file://`プロトコルでの`window.URL`例外を解決
   - 開発時（file/localhost）では`file:`プロトコルを許可
   - 本番環境では従来通り厳格なセキュリティを維持

5. **CSPノイズの解消**
   - Font Awesomeの重複読み込みを解消
   - コンソールエラーの抑制

### 新しい共有機能

- **短い共有URL**: `/s/{slug}`形式でOGP画像を表示
- **Cloudinary統合**: `public_id`から直接共有URLを生成
- **毎回ユニーク**: タイムスタンプ付きでキャッシュ回避
- **フォールバック対応**: 新方式が利用できない場合は従来方式に自動切り替え

4. **セキュリティ強化**
   - Referrer-Policyの追加
   - フォーム内ボタンの`type="button"`明示
   - 外部リンクへの`rel="noopener noreferrer"`付与

### 検証手順

#### 1. クリック時のテキスト選択問題の確認
```bash
# ローカルでテスト
python -m http.server 8000
# または
npx serve .
```
- ブラウザで各ページを開く
- ボタンやリンクをクリックしてテキスト選択が発生しないことを確認
- フォーム入力欄ではテキスト選択が可能なことを確認

#### 2. 診断ゲーム遷移の確認
1. Studio環境またはiFrame内で`index.html`にアクセス
2. `quiz.html`にリダイレクトされることを確認
3. 診断を完了して`generator.html`に遷移
4. 「診断結果を見る」ボタンをクリック
5. 診断結果が正しく表示されることを確認

#### 3. 画像付き共有機能の確認
1. Cloudflare Pages Functionsのデプロイ
   ```bash
   # functions/s/[slug].jsの設定
   # CLOUD_NAMEとリダイレクト先URLを実際の値に置換
   ```

2. X Card Validatorでの確認
   - https://cards-dev.twitter.com/validator にアクセス
   - 生成された共有URL（例: `https://ogp.your-domain.com/s/xxxx`）を入力
   - 学生証画像がプレビューで表示されることを確認

3. Discordでの確認
   - 共有URLをDiscordに貼り付けて画像サムネイルが表示されることを確認

#### 4. セキュリティ設定の確認
- 各HTMLファイルの`<head>`に`<meta name="referrer" content="strict-origin-when-cross-origin">`が含まれていることを確認
- フォーム内のボタンに`type="button"`が設定されていることを確認
- 外部リンクに`rel="noopener noreferrer"`が設定されていることを確認

### 設定が必要な項目

1. **Cloudflare Pages Functions**
   - `functions/s/[slug].js`内の`CLOUD_NAME`を実際のCloudinaryクラウド名に置換
   - リダイレクト先URLを実際のドメインに置換

2. **generator.html**
   - `SHARE_BASE`定数を実際のCloudflare Pagesドメインに置換

### 注意事項

- 既存のデザイン/ギミックは完全に維持されています
- 既存のshare系HTMLファイルは削除・改変していません
- 相対パス/絶対パスの基準は変更していません

## ライセンス

このプロジェクトは[MITライセンス](LICENSE.txt)の下で公開されています。 # Last updated: 2025-08-17 03:55:02
