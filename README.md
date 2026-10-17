# 拾词 · 英语与日语学习

手机和电脑访问：https://loveotter.github.io/shici-learning/

支持单词学习与间隔复习、语法短课、习题与错题、本地记录和备份，以及 100%—180% 字号调节。各设备保存自己的记录，迁移网址或设备前请先导出备份。

## 自动发布

仓库保存应用源码和固定版本的数据导入程序。GitHub Actions 下载数据、校验上游哈希、执行检查并发布完整网站；用户打开网站时直接读取已发布资料与音频，无须启动电脑或访问上游仓库。

数据包括 egg rolls 的 10,641 条日语笔记和 27,060 个音频、Tae Kim 中文语法指南 70 个章节、Japanese Language Data 的 595 个语法点，以及 ECDICT 的 770,611 条英汉词典记录。草稿和外部词库尚未完成本项目独立语言审校。英文声音使用设备朗读，日语例句音频包含合成语音。

本项目用于个人非商业学习，各来源分别遵守原许可，不将整个项目统一视为 MIT 授权。来源、版本、改编说明及许可证见 [ATTRIBUTION.md](ATTRIBUTION.md) 和网站内的来源说明。与“不背单词”应用无关联。

## 本地运行

需要 Node.js 20+、Python 3.9+ 和 lxml。先运行 scripts 中固定版本的数据导入程序，再执行 `npm ci`、`npm run build`、`npm test`、`npm start`。具体可重复构建步骤见 `.github/workflows/deploy.yml`。`npm start` 提供局域网服务；公网版本由 GitHub Pages 提供。
