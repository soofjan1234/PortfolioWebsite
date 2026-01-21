## 目的

将 xxx.vercel.app 替换为自有域名，实现 国内外均可访问，同时兼顾 隐私保护、成本、稳定性。

## 前言

Vercel 国内无法访问，可以配合Cloudflare的域名解析，和购买好的域名，可以将vercel部署的应用的自带域名代理到我们自己的域名，
这样就可以在国内访问我们的vercel应用了。并且将域名代理到 CF 之后还能享受到它提供的诸多服务

## 一、购买域名：为什么最终选择了 Spaceship

在决定使用自有域名之前，我对比了 国内与国外多家域名注册商

### 国内注册商的情况

- 需要 实名认证
- .com 等域名 涉及备案
- 审核周期较长
- 对个人技术博客来说流程偏重

### 国外注册商的优势

- ❌ 不需要备案
- ❌ 不强制实名验证
- ✅ 免费 WHOIS 隐私保护
- 支持 Visa / 支付宝
- 更适合技术博客和个人项目

### 为什么选择 Spaceship

最终我在 Spaceship 购买了域名：

- 支持 支付宝 + Visa
- 免费 WHOIS 隐私保护
- 控制台简洁
- 价格透明

### 关于一些常见域名后缀的看法

#### .top

- 运营成本低、注册量大
- 首年价格便宜
- 但历史上被大量滥用，不适合作为长期主站

#### .xyz

- 曾被大量灰产、博彩站使用
- 在部分网络环境中信任度较低

👉 最终还是选择了 .com，稳定、省心、长期成本最低。

## 二、将域名接入 Cloudflare（DNS 托管）

### 1️⃣ 登录 Cloudflare 控制台

进入 Cloudflare 首页，点击 Add a site，输入你刚购买的域名。

### 2️⃣ 选择套餐

无特殊需求，直接选择 Free Plan，点击继续即可

### 3️⃣ Cloudflare 会分配两个名称服务器（NS）

![](.\image1.png)
![](.\image2.png)

例如：

```
xxxx.ns.cloudflare.com
yyyy.ns.cloudflare.com
```

⚠️ 这两个 NS 非常重要，下一步要用到

## 三、在 Spaceship 中修改名称服务器

![](.\image3.png)
![](.\image4.png)

进入 Spaceship 域名管理器：

1. 点击你的域名，找到 名称服务器和DNS
2. 替换为 Cloudflare 提供的 两个 NS 地址
3. 保存

稍等几分钟（一般很快），Cloudflare 会显示站点已激活。

## 四、在 Vercel 中绑定自有域名

### 1️⃣ 进入 Vercel 项目 → Domains

添加你的自有域名（如 example.com，然后报错vertification nedded，

点击之后，Vercel 会自动生成通常是：

```
A → xxx
TXT -> xxx
```

![](.\image5.png)

### 2️⃣ 回到 Cloudflare 配置 DNS

在 Cloudflare 的 DNS 页面中：

1. 添加 Vercel 给出的 A 记录
2. 删除之前存在的 A 类型记录

![](.\image6.png)

## 五、国内访问测试

配置完成后进行测试：国内网络（非代理）可正常访问

