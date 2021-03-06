# テーマ

CocoPoはある程度見た目を変えることができます。

CocoPoの見た目で変更できるのはCocoPo本体とWebViewで開いているTwitterの中身です。

どちらもCSSの設定を追加する形になります。

設定画面の `Open user directory` の下のボタンをクリックするとディレクトリが開くので、そこの `theme` ディレクトリが保存場所です。

例えばWindowsでは `C:\Users\USER_NAME\AppData\Roaming\cocopo\theme` にテーマごとのディレクトリがあります。

## 最初からあるテーマ

最初から `Default` と `User` と呼ばれるテーマがあります。

`Default` は起動ごとに初期化されるので基本いじらない方が良いです。

`User` はユーザー固定テーマなので、上書きされることはありません。

## テーマディレクトリ

テーマはディレクトリごとに保存されています。
ディレクトリを追加すれば項目が追加されます。
また、ディレクトリ名が `.` から始まる場合は、無効なものとして読み込まれません。

`Default` はデフォルトのテーマで、フォントサイズ変更以外は特に何もしません。

`style.css` はTwitter Liteに追加で読み込まれるCSSです。

`theme.css` はアプリに追加で読み込まれるCSSです。

## テーマのインストール

外部のテーマをインストールできます。

テーマはテーマ情報が入ったJSONのURLを与える形になります。

例えばサンプルのCocoPoDarkは以下のURLです。

```
https://lapistech.github.io/CocoPo/CocoPoDark/theme.json
```

## テーマの作成

テーマを公開する場合、以下のファイルを用意してください。

* `theme.json`
    * 後述するテーマの情報を書いたファイル。
* `style.css`
    * Twitter Liteに追加で読み込まれるCSS。指定方法によっては任意のファイル名に変更可能。
* `theme.css`
    * アプリに追加で読み込まれるCSS。指定方法によっては任意のファイル名に変更可能。

### テーマの情報

テーマの情報は以下の形式で入れてください。

```
{
	"version": 0,
	"name": "Theme name",
	"author": "Author",
	"info": "Information",
	"twitter": "style.css",
	"cocopo": "theme.css"
}
```

項目は以下のようになっています。

* version: number
    * バージョンコード。必ず数値にして、新しいバージョンを出すたびに増やす。
    * アップデートの有無をこの値との比較で調べる。
* name: string
    * テーマの名前。ディレクトリ名になるので半角英数字と`_`程度の記号にすることを推奨。
    * 同じ名前のテーマがあった場合、上書きされるので注意。
* author: string
    * 作者名。
* info: string
    * テーマの説明。
* twitter: string
    * Twitter Liteに追加で読み込まれるCSSファイル名。
    * テーマ情報のURLからの相対パスとして扱われる。
    * 省略した場合は `style.css` が使われる。
* cocopo: string
    * アプリに追加で読み込まれるCSSファイル名。
    * テーマ情報のURLからの相対パスとして扱われる。
    * 省略した場合は `theme.css` が使われる。

### テーマ作成時の注意

CocoPoはそこまで変なスタイルの設定方法ではないので、普通にスタイルを上書きできると思います。

問題はTwitter Liteで、恐らくクラス名は変化があるたびにランダムに変化する類の物だと思われます。
またそのクラス名の設定の方が強いことがよくあり、なかなか思うようにスタイルが上書きされません。

対策としては以下の方法があります。

* `!important` を付けて無理矢理スタイルを上書きする。
* もし途中の要素に `role="string"` 等がある場合にはCSSでそこを起点にする。
    * CSSで `div[role="presentation"]` みたいな形でroleの中の値依存にすれば、クラス名よりはましなはず。

要は右クリックで出てくるDevtoolを使って頑張ってください。

# サンプル

CocoPoDarkのサンプルです。

https://github.com/LapisTech/CocoPo/tree/master/docs/CocoPoDark
