# CocoPo

CocoPoはTwitter Lite( https://mobile.twitter.com/ )をElectronのWebViewに入れただけのTwitterクライアントです。

公式が出しているのをそのまま使っているだけです。

ユーザーが任意のテーマを設定できます。

# 開発

## 準備

環境はNode.jsとElectron、TypeScriptです。

### Node.js

Node.jsはWindowsならNodist、Linux/UNIX系OSならnvmをインストールしてください。

一応開発者は7以降を使っています。

### 開発に必要なモジュールのインストール

TypeScriptとElectronはグローバルな領域にインストールします。

```
npm -g i typescript
npm -g i electron
npm -g i electron-packager
npm -g i electron-prebuilt
npm i
```

## Build

```
npm run build
```

## Run

```
npm run start
```

## Release build

```
npm run release
```

# 機能

## ウィンドウ

### ページを開く

Twitter外へのリンクはブラウザで開きます。

### URLバー

右クリックするとCopyで現在のURLをコピーできます。

## タスクトレイ

クリックでアプリを最前面に持ってきます。
右クリックでいくつかの作業が可能です。

* Open
    * クリック時と同じ。
* Reset Position
    * 画面中央にアプリを移動します。
* About
    * 各種バージョン情報などが見れます。
* Exit
    * 終了します。

# テーマ

## Windows

`C:\Users\USER_NAME\AppData\Roaming\cocopo\theme` にテーマごとのディレクトリがあります。

## テーマディレクトリ

`Default` はデフォルトのテーマで、フォントサイズ変更以外は特に何もしません。

`style.css` はTwitter Liteに追加で読み込まれるCSSです。

`theme.css` はアプリに追加で読み込まれるCSSです。

# 今後について

## 追加予定の機能

* ウィンドウの位置やサイズの保存
* ユーザー固有テーマの編集
* 固定フレーム化
    * Windows7とかだと見た目がすっきりする。

## 追加したいが仕様考え中

* 任意のテーマをインストールする。
    * JSONのパスを与えるとその中のデータに従ってテーマをインストールとかしたい。

## 認知しているバグ

* WebViewの開発者ツールを起動したまま終了するとエラーになる。
