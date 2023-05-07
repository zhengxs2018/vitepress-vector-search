import type { VSDocumentHandler, VSFile } from '@zhengxs/vector-search-core'
import { type SiteConfig } from 'vitepress'

export type VSFileLoaderConfig = {
  /**
   * 源文件目录
   */
  srcDir: SiteConfig['srcDir']
  /**
   * 需要处理的路由页
   */
  pages: SiteConfig['pages']
  /**
   * 需要处理的文件
   *
   * 使用 micromatch 进行匹配
   */
  include?: string[]
  /**
   * 扫描到页面
   *
   * @param pages - 文件列表
   * @returns
   */
  onScanPages?: (pages: string[]) => string[]
  /**
   * 加载文件
   *
   * 返回 false 可以跳过此文件处理
   */
  onLoadFileAfter?: (file: VSFile) => void | false
}

export interface VSearchPluginConfig
  extends Partial<
    Pick<VSFileLoaderConfig, 'include' | 'onScanPages' | 'onLoadFileAfter'>
  > {
  /**
   * 提供给客户端的 API 地址
   *
   * @default /vector-search
   */
  searchPath?: string
  /**
   * 处理文档源码
   */
  onDocumentLoad: VSDocumentHandler
  /**
   * 允许动态配置
   */
  [key: string]: any
}

export type VSearchPluginOptions = Required<VSearchPluginConfig>
