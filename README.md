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

## 技術仕様

- フロントエンド: HTML, CSS, JavaScript
- 画像処理: Canvas API
- 画像ホスティング: Cloudinary
- シェアページ: Cloudflare Workers

## ライセンス

このプロジェクトは[MITライセンス](LICENSE.txt)の下で公開されています。 