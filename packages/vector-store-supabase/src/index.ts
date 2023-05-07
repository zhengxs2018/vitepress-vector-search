import { type SupabaseClient, createClient } from '@supabase/supabase-js'
import type {
  VSEmbeddings,
  VSVectorStore,
} from '@zhengxs/vector-core'

export type SupabaseVectorStoreConfig = {
  project: string
  url?: string
  apiKey?: string
  client?: SupabaseClient
  shouldRefresh?: boolean
  embeddings: VSEmbeddings
}

export const resolveSupabaseClient = ({
  url = process.env.SUPABASE_URL || 'http://localhost:54321',
  apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  client = createClient(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }),
}: SupabaseVectorStoreConfig) => client

export function createSupabaseVectorStore(config: SupabaseVectorStoreConfig): VSVectorStore {
  const { project = 'default', shouldRefresh = true, embeddings } = config
  const supabaseClient = resolveSupabaseClient(config)

  // copy https://github.com/supabase-community/nextjs-openai-doc-search
  const fromDocument: VSVectorStore['fromDocument'] = async (
    document,
    { slug, file },
  ) => {
    const path = file.relativePath

    try {
      const { error: fetchPageError, data: existingPage } = await supabaseClient
        .from('nods_page')
        .select('id, project, path, checksum')
        .eq('project', project)
        .eq('path', path)
        .limit(1)
        .maybeSingle()

      if (fetchPageError) {
        throw fetchPageError
      }

      if (existingPage?.checksum === file.checksum) {
        return
      }

      if (existingPage) {
        if (!shouldRefresh) {
          console.log(
            `[${path}] Docs have changed, removing old page sections and their embeddings`
          )
        } else {
          console.log(`[${path}] Refresh flag set, removing old page sections and their embeddings`)
        }

        const { error: deletePageSectionError } = await supabaseClient
          .from('nods_page_section')
          .delete()
          .eq('page_id', existingPage.id)

        if (deletePageSectionError) {
          throw deletePageSectionError
        }
      }

      // Create/update page record. Intentionally clear checksum until we
      // have successfully generated all page sections.
      const { error: upsertPageError, data: page } = await supabaseClient
        .from('nods_page')
        .upsert(
          {
            checksum: null,
            path,
            project,
            type: document.type,
            source: file.content,
            meta: document.metadata,
          },
          // TODO project + path + locale should be unique
          // { onConflict: 'path' }
        )
        .select()
        .limit(1)
        .single()

      if (upsertPageError) {
        throw upsertPageError
      }

      const sections = document.sections
      console.log(`[${path}] Adding ${sections.length} page sections (with embeddings)`)

      for (const { title, anchor, content } of sections) {
        // OpenAI recommends replacing newlines with spaces for best results (specific to embeddings)
        const input = content.replace(/\n/g, ' ')
        if (input.length === 0) return

        try {
          const { total_tokens, embedding } = await embeddings.embed(input)

          const { error: insertPageSectionError } = await supabaseClient
            .from('nods_page_section')
            .insert({
              page_id: page.id,
              slug: `${slug}#${anchor}`,
              heading: title,
              content: content,
              token_count: total_tokens,
              embedding: embedding,
            })
            .select()
            .limit(1)
            .single()

          if (insertPageSectionError) {
            throw insertPageSectionError
          }
        } catch (err) {
          // TODO: decide how to better handle failed embeddings
          console.error(
            `Failed to generate embeddings for '${path}' page section starting with '${input.slice(
              0,
              40
            )}...'`
          )

          throw err
        }
      }

      // Set page checksum so that we know this page was stored successfully
      const { error: updatePageError } = await supabaseClient
        .from('nods_page')
        .update({ checksum: file.checksum })
        .filter('id', 'eq', page.id)

      if (updatePageError) {
        throw updatePageError
      }

    } catch (err) {
      console.error(
        `Page '${path}' or one/multiple of its page sections failed to store properly. Page has been marked with null checksum to indicate that it needs to be re-generated.`
      )
      console.error(err)
    }
  }

  return {
    fromDocument,
  }
}
