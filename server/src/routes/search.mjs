import { Configuration, OpenAIApi } from 'openai'
import { createClient } from '@supabase/supabase-js'
import gpt3Tokenizer from 'gpt3-tokenizer'
import { codeBlock, oneLine } from 'common-tags'

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    basePath: process.env.OPENAI_BASE_URL,
    organization: process.env.OPENAI_ORGANIZATION
  })
)

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const tokenizer = new gpt3Tokenizer.default({ type: 'gpt3' })

/**
 *
 * @param {import('@koa/router').RouterContext} ctx
 * @returns
 */
const handler = async (ctx) => {
  const { query = '' } = ctx.request.body

  ctx.assert(query, 400, 'Missing query in request data')

  // Moderate the content to comply with OpenAI T&C
  const sanitizedQuery = query.trim()
  const moderationResponse = await openai.createModeration({
    input: sanitizedQuery
  })

  const [results] = moderationResponse.data.results

  if (results.flagged) {
    ctx.throw(400, 'Flagged content', {
      details: {
        categories: results.categories
      }
    })
  }


  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: sanitizedQuery.replaceAll('\n', ' '),
  })

  if (embeddingResponse.status !== 200) {
    ctx.throw(500, 'Failed to create embedding for question', {
      details: {
        status: embeddingResponse.status,
        statusText: embeddingResponse.statusText,
      }
    })
  }

  const [{ embedding }] = embeddingResponse.data.data

  const { error: matchError, data: pageSections } = await supabaseClient.rpc(
    'match_page_sections',
    {
      embedding,
      match_threshold: 0.78,
      match_count: 10,
      min_content_length: 50,
    }
  )

  if (matchError) {
    ctx.throw(500, 'Failed to match page sections')
  }


  let tokenCount = 0
  let contextText = ''

  for (let i = 0; i < pageSections.length; i++) {
    const pageSection = pageSections[i]
    const content = pageSection.content
    const encoded = tokenizer.encode(content)

    tokenCount += encoded.text.length
    tokenCount += encoded.length

    if (tokenCount >= 1500) {
      break
    }

    contextText += `${content.trim()}\n---\n`
  }

  const prompt = codeBlock`
    ${oneLine`
      You are a very enthusiastic Supabase representative who loves
      to help people! Given the following sections from the Supabase
      documentation, answer the question using only that information,
      outputted in markdown format. If you are unsure and the answer
      is not explicitly written in the documentation, say
      "Sorry, I don't know how to help with that."
    `}

    Context sections:
    ${contextText}

    Question: """
    ${sanitizedQuery}
    """

    Answer as markdown (including related code snippets if available):
  `

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 512,
    temperature: 0,
    stream: true,
  })

  if (response.status !== 200) {
    ctx.throw(500, 'Failed to generate completion')
  }

  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  ctx.body = response.data
}

export default handler
