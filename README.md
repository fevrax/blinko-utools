# Blinko 闪念插件 (uTools版)

这是Blinko的uTools插件版本，允许用户通过uTools快速访问Blinko服务。

## 功能特点

- 使用uTools.ubrowser加载Blinko网站
- 支持自定义服务器配置
- 优美现代的界面设计
- 配置持久化保存
- 使用代理服务器加载外部网站内容
- 支持浏览历史（前进/后退）
- 响应式设计，适配各种设备
- 暗黑模式支持
- 可自定义目标URL

## 安装和运行

### 安装前端依赖

```bash
cd blinko-utools
pnpm install
```

### 安装代理服务器依赖

```bash
cd server
pnpm install
```

### 启动代理服务器

```bash
cd server
pnpm dev
```

### 启动前端应用

```bash
cd blinko-utools
pnpm dev
```

现在，您可以在浏览器中访问 `http://localhost:5173` 来使用应用程序。

## 工作原理

应用使用Node.js代理服务器来请求并返回外部网站的内容，而不是直接使用iframe嵌入。这种方法可以：

1. 绕过一些网站的X-Frame-Options限制
2. 提供更好的安全控制
3. 允许对加载的内容进行预处理和修改

## 注意事项

- 由于使用代理服务器，某些依赖于客户端JavaScript和cookie的功能可能无法正常工作
- 某些网站可能会检测并阻止代理访问
- 此应用仅用于学习和研究目的

## 使用说明

### 首次使用

1. 首次启动插件时，会显示欢迎页面
2. 您可以选择使用默认服务器(https://blinko.kl.do)或配置自定义服务器
3. 确认后，您的配置将被保存

### 修改配置

如果需要修改服务器配置，您可以：

1. 在uTools中卸载并重新安装插件
2. 手动删除uTools存储中的配置数据
