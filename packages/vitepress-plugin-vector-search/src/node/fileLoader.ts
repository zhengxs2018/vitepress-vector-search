import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { VSFile } from '@zhengxs/vector-search-core'
import debug from 'debug'
import micromatch from 'micromatch'

import type { VSFileLoaderConfig } from './types'

const debugLog = debug('vitepress:vector-search:file-loader')

export async function fileLoader(
  config: VSFileLoaderConfig,
): Promise<VSFile[]> {
  const { include = [], onLoadFileAfter = () => void 0, onScanPages } = config

  function getPages() {
    const routerPages = include.length
      ? micromatch(config.pages, include)
      : config.pages

    const pages = onScanPages?.(routerPages) || routerPages

    debugLog(`discovered ${pages.length} pages`)

    return pages
  }

  const files: VSFile[] = []

  for (const relativePath of getPages()) {
    const filePath = path.join(config.srcDir, relativePath)
    if (!existsSync(filePath)) continue

    const name = path.basename(filePath)
    const raw = await fs.readFile(filePath, 'utf-8')
    const content = raw.trim()

    if (content.length === 0) continue

    const checksum = createHash('sha256').update(content).digest('base64')

    const file: VSFile = {
      name,
      content,
      relativePath,
      checksum,
    }

    if ((await onLoadFileAfter(file)) === false) continue

    files.push(file)
    debugLog(`load ${name} in ${relativePath}`)
  }

  return files
}
