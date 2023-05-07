import { inspect } from 'node:util'
import { Configuration, type ConfigurationParameters, OpenAIApi } from 'openai'

import type { VSEmbeddings } from '@zhengxs/vector-core'

export type OpenAIEmbeddingsParams = {
  model?: string
  apiKey?: ConfigurationParameters['apiKey']
}

export function createOpenAIEmbeddings(params: OpenAIEmbeddingsParams, options: ConfigurationParameters): VSEmbeddings {
  const configuration = new Configuration({
    ...options,
    apiKey: params.apiKey || process.env.OPENAI_API_KEY,
  })
  const openai = new OpenAIApi(configuration)

  async function embed(input: string) {
    const embeddingResponse = await openai.createEmbedding({
      model: params.model || 'text-embedding-ada-002',
      input,
    })

    if (embeddingResponse.status !== 200) {
      throw new Error(inspect(embeddingResponse.data, false, 2))
    }

    const { usage, data } = embeddingResponse.data

    const total_tokens = usage.total_tokens
    const embedding = data[0]['embedding']

    return { total_tokens, embedding }
  }

  return {
    embed
  }
}
