# Vitepress Vector Search

Vitepress & Supabase powered search plugin.

> 正在开发中

## 使用

### 安装依赖

```bash
$ pnpm add @zhengxs/vitepress-plugin-vector-search @zhengxs/vector-openai-embedding @zhengxs/vector-store-supabase
```

### 使用插件

> 注意：目前 vitepress 不支持插件机制，只有 vite 才有

在构建文档时插件才会工作，使用时，需要提供向量存储器。

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'

import { vectorSearch } from '@zhengxs/vitepress-plugin-vector-search'
import { createSupabaseVectorStore } from '@zhengxs/vector-store-supabase'
import { createOpenAIEmbeddings } from '@zhengxs/vector-openai-embedding'

const embeddings = createOpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
}, {
  basePath: process.env.OPENAI_API_BASE_URL,
  organization: process.env.OPENAI_ORGANIZATION
})

const vectorStore = createSupabaseVectorStore({
  apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  embeddings
})

export default defineConfig({
  //...
  vite: {
    plugins: [
      vectorSearch({
        vectorStore,
      }),
    ]
  }
})
```

### 显示 UI

开发中...

## 参考项目

- [langchain](https://js.langchain.com/)
- [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search)

## License

MIT
