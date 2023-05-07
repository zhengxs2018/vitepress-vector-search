import type { VSMarkdownDocument, VSMarkdownTextSection } from './interfaces'

const headingRegex = /<h(\d*).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*?)<a.*? href="#(.*?)".*?>.*?<\/a>/i

function clearHtmlTags(str: string) {
  return str.replace(/<[^>]*>/g, '')
}

function getSearchableText(content: string) {
  content = clearHtmlTags(content)
  return content.trim()
}

export const markdownTextSplitter = (html: string): VSMarkdownTextSection[] => {
  const result = html.split(headingRegex)
  const sections: VSMarkdownTextSection[] = []

  result.shift()

  let parentTitles: string[] = []

  for (let i = 0; i < result.length; i += 3) {
    const level = parseInt(result[i]) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    const title = clearHtmlTags(headingResult?.[1] ?? '').trim()
    const anchor = headingResult?.[2] ?? ''
    const content = result[i + 2]

    if (!title || !content) continue

    const titles = parentTitles.slice(0, level)

    titles[level] = title
    sections.push({ anchor, titles, text: getSearchableText(content) })

    if (level === 0) {
      parentTitles = [title]
    } else {
      parentTitles[level] = title
    }
  }

  return sections
}

export type VSMarkdownTextSplitter = typeof markdownTextSplitter

export type VSMarkdownTextSplitterOptions = {
  /**
   * Markdown 渲染器
   *
   * TODO 提供默认的渲染器
   */
  renderer: {
    render: (content: string) => string | Promise<string>
  }
  /**
   * 文本分割器
   */
  extract?: VSMarkdownTextSplitter
}

export function createMarkdownTextSplitter({
  renderer,
  extract = markdownTextSplitter,
}: VSMarkdownTextSplitterOptions) {
  const createDocument = async (
    content: string,
  ): Promise<VSMarkdownDocument> => {
    const sections = extract(await renderer.render(content))

    return {
      type: 'markdown',
      // TODO 后续提供
      metadata: {},
      sections,
    }
  }

  return {
    createDocument,
  }
}
