# CODEX TASK TEMPLATE

このテンプレートは、Codexに作業を依頼するときの標準フォーマットです。

Codexは必ず以下の構造で作業を理解してください。

また、AI_MASTER_RULES.md と UI_PHILOSOPHY.md のルールを必ず守ること。

---

# 1. 目的 (Purpose)

今回の作業の目的を一文で書く。

例

- ritual画面のリングUIを改善する
- Themeの視認性を上げる
- カウントダウンの表示位置を修正する

---

# 2. 前提 (Context)

以下の前提を守ること

- スマホUI最優先
- 1画面完結
- スクロールを基本しない
- 上品で静かな体験
- ミニマルUI
- 中央リングが主役

デザイン判断に迷った場合は  
UI_PHILOSOPHY.md を参照する。

---

# 3. 対象ファイル (Files)

修正対象ファイルを書く。

例

- app/ritual/page.tsx
- components/BreathRing.tsx
- components/HourglassProgress.tsx
- app/globals.css

---

# 4. やること (Tasks)

箇条書きで具体的に書く。

例

1. Themeラベルを少し下げる
2. 砂の色を濃くする
3. タイマーを1.2倍にする
4. Pause/Resetボタンを中央寄せにする
5. リングの呼吸アニメーションを少し強くする

---

# 5. UIルール (UI Rules)

以下を必ず守る

- 中央リングが主役
- タイマーは控えめ
- 情報量を増やさない
- 上品なアニメーション
- 急な動きは禁止
- UIジャンプ禁止

---

# 6. 完了条件 (Definition of Done)

作業が成功した状態を書く。

例

- スマホ画面でスクロールなし
- Themeが読みやすい
- タイマーが見やすい
- ボタンが中央
- lint/buildが通る

---

# 7. 実装ルール (Implementation Rules)

必ず以下を守る

- 既存の世界観を壊さない
- 最小変更で改善する
- 大きなリファクタリングは禁止

---

# 8. 作業後の報告 (Report)

作業完了後、以下を必ず出力する。

1. 変更ファイル一覧
2. 変更内容
3. なぜその変更をしたか
4. 確認方法

---

# 9. 最終チェック (Final Check)

作業後は必ず

npm run lint  
npm run build  

を実行し、エラーがないことを確認する。