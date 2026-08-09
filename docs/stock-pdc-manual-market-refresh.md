# Stock PDC 手动市场数据刷新

这个入口只在网页按钮点击后运行，不含 `schedule`、cron 或自动 PDC 发布。

执行链路为：

```text
手动点击页面按钮
→ GitHub Actions workflow_dispatch
→ 全市场行情 API（东财完整快照，失败时由新浪完整快照整体接管）
→ 腾讯日线历史
→ Hawkeye 固定两条规则
→ 写入并校验 hawkeye/latest.json
→ Cloudflare Pages 展示新快照
```

它不会调用五位 PDC 模型，也不会把任何结果发布到正式 PDC。数据刷新成功后，Mini 和正式版都必须由用户再次手动点击“开始生成”。

## 一次性配置

在 Cloudflare Pages 的 Production 环境新增加密变量：

```text
STOCK_PDC_GITHUB_TOKEN
```

该值应为只授权给 `leoispanda/turnpo` 的 GitHub fine-grained token，权限仅需：

```text
Repository permissions → Actions → Read and write
```

不要把 token 填进代码、提交到 Git，或发送到聊天中。没有这个变量时，网页会明确显示“未配置”，而不会伪造刷新成功。
