export type VSFile = {
  /**
   * 文件名称
   */
  name: string
  /**
   * 文件内容
   */
  content: string
  /**
   * 相对路径
   */
  relativePath: string
  /**
   * 文件 hash
   */
  checksum: string
  // 允许自定义属性
  [key: string]: unknown
}

export type VSDocumentMetadata = Record<string, unknown>

export interface VSTextSection {
  /**
   * 文本片段
   */
  text: string
  // 允许自定义属性
  [key: string]: unknown
}

export type VSDocument<
  Section extends VSTextSection = VSTextSection,
  Metadata = VSDocumentMetadata,
> = {
  /**
   * 类型
   */
  type: string
  /**
   * 元数据
   */
  metadata: Metadata
  /**
   * 文本片段
   */
  sections: Section[]
}

export type VSDocumentContext = {
  id: string
  locale: string
  file: VSFile
}

export type VSDocumentHandler<Document extends VSDocument = VSDocument> = (
  document: Document,
  context: VSDocumentContext,
) => void | Promise<void>

export interface VSMarkdownTextSection extends VSTextSection {
  /**
   * 锚点
   */
  anchor: string
  /**
   * 标题
   */
  titles: string[]
}

export type VSMarkdownDocument = VSDocument<VSMarkdownTextSection>
