import path from 'node:path'

import { createMarkdownTextSplitter } from '@zhengxs/vector-core'
import type { Plugin } from 'vite'
import { type SiteConfig, createMarkdownRenderer } from 'vitepress'

import { fileLoader } from './fileLoader'
import type { VSearchPluginConfig } from './types'
import { resolveSiteDataByRoute, slash } from './utils'

const VECTOR_SEARCH_CLIENT_CONFIG = '@vectorSearchConfig'
const VECTOR_SEARCH_CLIENT_CONFIG_MODULE_PATH =
  '/' + VECTOR_SEARCH_CLIENT_CONFIG

export default function vectorSearch(config: VSearchPluginConfig): Plugin {
  const { searchPath = '/vector-search', include, onScanPages, onLoadFileAfter, onDocumentLoad, vectorStore } =
    config

  const scanForBuild = async (config: SiteConfig) => {
    const renderer = await createMarkdownRenderer(
      config.srcDir,
      config.markdown,
      config.site.base,
      config.logger,
    )

    const { createDocument } = createMarkdownTextSplitter({
      renderer: renderer,
    })

    function getLocaleForPath(relativePath: string) {
      const siteData = resolveSiteDataByRoute(config.site, relativePath)
      return siteData?.localeIndex ?? ''
    }

    const slugger = (relativePath: string) => {
      let relFile = slash(relativePath)
      relFile = config.rewrites.map[relFile] || relFile
      let id = path.join(config.site.base, relFile)
      id = id.replace(/\/index\.md$/, '/')
      id = id.replace(/\.md$/, config.cleanUrls ? '' : '.html')
      return id
    }

    const files = await fileLoader({
      srcDir: config.srcDir,
      pages: config.pages,
      include,
      onScanPages,
      onLoadFileAfter,
    })

    for (const file of files) {
      const { content, relativePath } = file

      const slug = slugger(relativePath)
      const locale = getLocaleForPath(relativePath)
      const document = await createDocument(content)

      // TODO 如果文档只有 HTML 内容，就会没有 sections
      if (document.sections.length === 0) continue

      onDocumentLoad?.(document, { slug, locale, file })

      // TODO 需要支持多并发请求
      await vectorStore.fromDocument(document, { slug, locale, file })
    }
  }

  return {
    name: '@zhengxs/vitepress-plugin-vector-search',
    async configResolved(userConfig) {
      if (process.env.NODE_ENV === 'production') {
        scanForBuild(
          (userConfig as unknown as { vitepress: SiteConfig }).vitepress,
        )
      }
    },
    resolveId(id) {
      if (id.startsWith(VECTOR_SEARCH_CLIENT_CONFIG)) {
        return `/${id}`
      }
    },
    async load(id) {
      if (id === VECTOR_SEARCH_CLIENT_CONFIG_MODULE_PATH) {
        return `export default ${JSON.stringify({ searchPath })}`
      }
    },
  }
}
