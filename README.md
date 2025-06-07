# 放課後クロニクル 学生証ジェネレーター

このプロジェクトは、放課後クロニクルの世界観に沿った学生証を生成するWebアプリケーションです。

## 機能

- 顔写真のアップロードと自動トリミング
- 氏名（漢字・ローマ字）の入力
- 学科・部活動の入力
- 生年月日の選択
- 学生証画像のダウンロード
- SNS（X/Twitter、LINE）でのシェア機能

## 技術スタック

- HTML5 Canvas API - 画像生成
- JavaScript (ES6+) - アプリケーションロジック
- CSS3 - モダンなUI/UXデザイン
- Cloudinary - 画像アップロード・共有

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/student-id-generator.git
cd student-id-generator
```

2. 静的サイトホスティング（GitHub Pages等）で公開
- `index.html` がエントリーポイントです
- 必要な画像アセットは `assets/img/` に配置されています

## 使用方法

1. Webブラウザで開く
2. 顔写真をアップロード
3. 必要な情報を入力
4. 「学生証を作成」ボタンをクリック
5. プレビューを確認
6. 「画像をダウンロード」または各種SNSでシェア

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。 