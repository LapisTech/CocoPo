# CocoPo

CocoPoはTwitter Lite( https://mobile.twitter.com/ )をElectronのWebViewに入れただけのTwitterクライアントです。

公式が出しているのをそのまま使っているだけです。

ユーザーが任意のテーマを設定できます。

# 開発

## 準備

環境はNode.jsとElectron、TypeScriptです。

### Node.js

Node.jsはWindowsならNodist、Linux/UNIX系OSならnvmからインストールしてください。
バージョン変更が非常に楽になります。

一応開発者は7以降を使っています。

### 開発に必要な環境のインストール

TypeScriptとElectronはグローバルな領域にインストールします。

TypeScriptは2.2以上を使っています。

```
npm -g i typescript
npm -g i electron
npm -g i electron-packager
npm -g i electron-prebuilt
```

### 開発に必要なモジュールのインストール

なんと、型定義ファイルしかインストールしていません。

```
npm i
```

## ビルド

```
npm run build
```

## 実行

```
npm run start
```

## リリースビルド

X64のWindows向けのビルドが走ります。Mac？知らない子ですね。

```
npm run release
```

## Windows向け起動バイナリ

Visual Studio 2017のC++の開発環境とかをインストールしていると、起動プログラムのビルドが可能です。

ビルド済み起動プログラムは `CocoPo/CocoPo.exe` で、このプログラムを起動すると `CocoPo/App/Cocopo.exe` を起動します。

リリースビルドを行うと `CocoPo-x64.....` みたいなフォルダが作られその中にプログラムが一式入りますが、これを `CocoPo` フォルダに入れて、フォルダ名を `App` に書き換えると使えるようになります。

単に配布時に起動プログラムがごちゃごちゃしたところにあって分かりづらいため、一発で起動できるようにしただけのものです。

# 機能

## ウィンドウ

### ページを開く

Twitter外へのリンクはブラウザで開きます(セキュリティ対策もかねて、TwitterのURLでないものはすべてOSに開くのを任せる)。

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

* 設定画面の作成
* ウィンドウの位置やサイズの保存
* ユーザー固有テーマの編集
* 固定フレーム化
    * Windows7とかだと見た目がすっきりする。
* CocoPo自身のサイズ周りの指定をrem/%依存にする。

## 追加したいが仕様考え中

* 任意のテーマをインストールする。
    * JSONのパスを与えるとその中のデータに従ってテーマをインストールとかしたい。

## 認知しているバグ

* WebViewの開発者ツールを起動したまま終了するとエラーになる。
