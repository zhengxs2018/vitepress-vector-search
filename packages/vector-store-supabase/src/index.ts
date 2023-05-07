import { type SupabaseClient, createClient } from '@supabase/supabase-js'
import type {
  VSDocumentHandler,
  VSMarkdownDocument,
} from '@zhengxs/vector-search-core'

export type SupabaseVectorStoreEmbeddingsHandler =
  VSDocumentHandler<VSMarkdownDocument>

export type SupabaseVectorStoreConfig = {
  project: string
  url?: string
  apiKey?: string
  client?: SupabaseClient
}

export const resolveSupabaseClient = ({
  url = process.env.SUPABASE_URL as string,
  apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  client = createClient(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }),
}: SupabaseVectorStoreConfig) => client

export function createSupabaseVectorStore(config: SupabaseVectorStoreConfig) {
  const { project = 'default' } = config
  const client = resolveSupabaseClient(config)

  const fromDocument: SupabaseVectorStoreEmbeddingsHandler = async (
    document,
    { file },
  ) => {
    // 根据 checksum 查询是否存在
    const { error: fetchDocumentError, data: existingDocument } = await client
      .from('documents')
      .select('id, project, relativePath, checksum')
      .eq('project', project)
      .eq('relativePath', file.relativePath)
      .limit(1)
      .maybeSingle()

    if (fetchDocumentError) {
      throw fetchDocumentError
    }

    // TODO 内容一致需要处理文件路径等是否一致
    if (existingDocument?.checksum === file.checksum) {
      return
    }
  }

  return {
    fromDocument,
  }
}
