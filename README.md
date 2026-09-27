# 无锡学院社团招新系统

面向校园社团招新和作品征集的轻量网页 MVP。首页以无锡学院计算机协会新生报名为示例场景；这是学生展示项目，不代表学校或协会的官方授权。报名者无需注册；管理员通过 Supabase Auth 登录并处理报名。

## 已实现功能

- 管理员创建、编辑、发布和关闭投递项目
- 公开项目首页、项目介绍、移动端分步投递表单
- 简历 PDF、作品 PDF/图片、HTTPS 作品链接
- 文件类型与大小校验、逐文件上传进度和错误提示
- 投递编号、一次性展示的查询密码、状态查询
- 管理后台统计、搜索、筛选、排序、详情和私有文件预览/下载
- 1–5 分评审、评论、评审结论、状态历史与 CSV 导出
- 所有管理 API 在服务端验证登录身份和管理员角色

第一版仅启用 `admin` 角色。数据库保留 `reviewer` 角色值用于后续扩展，但该角色目前不能进入管理 API。

## 技术栈

Next.js 15、React 19、TypeScript、Supabase PostgreSQL/Auth/Storage、Zod、原生 CSS。

## 本地启动

1. 准备 Node.js 22 或更新版本。
2. 创建 Supabase 项目，在 SQL Editor 中依次执行 [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql) 和 [`supabase/migrations/0002_add_student_identity_fields.sql`](supabase/migrations/0002_add_student_identity_fields.sql)。已有数据库只需执行第二个迁移；它为历史记录填充空值，不删除原数据。
3. 在 Supabase Authentication 的 Users 页面创建一个管理员用户。记下用户 UUID。
4. 在 SQL Editor 中执行下面的语句，将 UUID 替换为该用户的真实 UUID：

   ```sql
   insert into public.admin_users (user_id, role)
   values ('替换为管理员用户 UUID', 'admin');
   ```

5. 将 `.env.example` 复制为 `.env.local`，填入 Supabase 项目 URL、anon key、service role key。**service role key 只用于服务端，绝不能加 `NEXT_PUBLIC_` 前缀，也不要提交到 Git。**
6. 执行：

   ```bash
   npm install
   npm run dev
   ```

7. 访问 `http://localhost:3000/admin/login`，登录后创建并发布一个项目。首页将自动显示该项目。

## 虚构测试数据

请只使用虚构资料，例如“测试同学”、虚构学号 `20260001`、学院“计算机学院”、班级“计科2601”、`demo@example.com`，并上传自行生成的示例 PDF 和作品图片。不要用真实个人简历、学号或联系方式测试。

## 环境变量

| 名称 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目地址，可公开 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 浏览器使用的公开 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅服务端使用的高权限密钥 |

## 安全和文件规则

- 存储桶 `submissions` 为私有；数据库启用 RLS，浏览器无法直接读取业务表。
- 管理员预览/下载先经过服务端权限验证，再获得 60 秒有效的签名地址。
- 简历仅允许 PDF，最大 10 MB；作品允许 PDF/JPG/PNG/WebP，单个最大 5 MB；最多 10 个文件。
- 提交时服务端检查对象存储中的文件大小和 MIME 类型。
- 匿名投递按来源和项目每小时最多初始化 12 次。
- 列表分页读取最多 10000 条；超出会提示缩小筛选范围。CSV 超过 10000 条时拒绝导出，避免静默漏数据。
- 投递查询密码只保存 SHA-256 哈希。CSV 文本做公式注入防护。
- 第一版不提供自动数据清理；真实试用前需制定隐私告知和留存周期，定期清理过期草稿和文件。

## 验证

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## 部署到 Vercel

1. 将代码推送到个人 GitHub 仓库。
2. 在 Vercel 导入仓库，使用默认 Next.js 配置。
3. 在 Vercel 项目环境变量中设置上述三个值。
4. 部署后，用虚构资料完整走一遍：创建项目 → 投递 → 上传 → 查询 → 管理员评审 → 导出。
5. Vercel 和 Supabase 的中国大陆访问质量可能波动。面向国内用户正式开放前，应从中国大陆网络实测浏览、上传和下载速度；必要时迁移到国内合规云环境。

当前尚未连接 Supabase 和 Vercel，因此没有可访问的应用网页链接。
