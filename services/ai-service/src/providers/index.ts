import { env } from '../config/env.js'

export interface AiProvider {
  name: string
  chat(prompt: string, system?: string): Promise<string>
  embed(text: string): Promise<number[]>
}

class OllamaProvider implements AiProvider {
  name = 'ollama'
  async chat(prompt: string, system?: string): Promise<string> {
    const r = await fetch(`${env.ollama.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.ollama.model, prompt, system, stream: false }),
    })
    if (!r.ok) throw new Error(`Ollama chat failed: ${r.status}`)
    const json = (await r.json()) as { response?: string }
    return json.response ?? ''
  }
  async embed(text: string): Promise<number[]> {
    const r = await fetch(`${env.ollama.url}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.ollama.embedModel, prompt: text }),
    })
    if (!r.ok) throw new Error(`Ollama embed failed: ${r.status}`)
    const json = (await r.json()) as { embedding?: number[] }
    return json.embedding ?? []
  }
}

class OpenAIProvider implements AiProvider {
  name = 'openai'
  async chat(prompt: string, system?: string): Promise<string> {
    if (!env.openai.apiKey) throw new Error('OPENAI_API_KEY not set')
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openai.apiKey}` },
      body: JSON.stringify({
        model: env.openai.model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!r.ok) throw new Error(`OpenAI chat failed: ${r.status}`)
    const json = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return json.choices?.[0]?.message?.content ?? ''
  }
  async embed(text: string): Promise<number[]> {
    if (!env.openai.apiKey) throw new Error('OPENAI_API_KEY not set')
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openai.apiKey}` },
      body: JSON.stringify({ model: env.openai.embedModel, input: text }),
    })
    if (!r.ok) throw new Error(`OpenAI embed failed: ${r.status}`)
    const json = (await r.json()) as { data?: Array<{ embedding?: number[] }> }
    return json.data?.[0]?.embedding ?? []
  }
}

export function getProvider(): AiProvider {
  if (env.provider === 'openai' && env.openai.apiKey) return new OpenAIProvider()
  return new OllamaProvider()
}
