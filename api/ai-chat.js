import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const MODEL_CONFIG = {
  'claude-opus-5': { supportsEffort: true },
  'claude-sonnet-5': { supportsEffort: true },
  'claude-haiku-4-5': { supportsEffort: false },
}
const DEFAULT_MODEL = 'claude-opus-5'
const SYSTEM_PROMPT = '당신은 이음봉사단 관리자를 돕는 AI 비서입니다. 한국어로 친절하고 간결하게 답변하세요.'

function getAdminClient() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function requireAdmin(req, adminClient) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null

  const { data: userData, error } = await adminClient.auth.getUser(token)
  if (error || !userData?.user) return null

  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (!profile?.is_admin) return null
  return userData.user
}

export default async function handler(req, res) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: '서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' })
    return
  }

  const adminClient = getAdminClient()
  const caller = await requireAdmin(req, adminClient)
  if (!caller) {
    res.status(403).json({ error: '관리자만 접근할 수 있습니다.' })
    return
  }

  if (req.method === 'GET') {
    const conversationId = req.query?.id
    if (conversationId) {
      const { data, error } = await adminClient
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) {
        res.status(500).json({ error: '메시지를 불러오지 못했습니다.' })
        return
      }
      res.status(200).json({ messages: data })
      return
    }

    const { data, error } = await adminClient
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) {
      res.status(500).json({ error: '대화 목록을 불러오지 못했습니다.' })
      return
    }
    res.status(200).json({ conversations: data })
    return
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id
    if (!id) {
      res.status(400).json({ error: '잘못된 요청입니다.' })
      return
    }
    const { error } = await adminClient.from('ai_conversations').delete().eq('id', id)
    if (error) {
      res.status(500).json({ error: '삭제에 실패했습니다.' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'POST') {
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: '서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다.' })
      return
    }

    const { conversationId, message, model } = req.body || {}
    if (!message || !message.trim()) {
      res.status(400).json({ error: '메시지를 입력해주세요.' })
      return
    }
    const requestedModel = MODEL_CONFIG[model] ? model : DEFAULT_MODEL

    let conversation
    if (conversationId) {
      const { data, error } = await adminClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle()
      if (error || !data) {
        res.status(404).json({ error: '대화를 찾을 수 없습니다.' })
        return
      }
      conversation = data
    } else {
      const { data, error } = await adminClient
        .from('ai_conversations')
        .insert({ created_by: caller.id, title: message.trim().slice(0, 40), model: requestedModel })
        .select()
        .single()
      if (error) {
        res.status(500).json({ error: '대화 생성에 실패했습니다.' })
        return
      }
      conversation = data
    }

    const { error: insertUserError } = await adminClient
      .from('ai_messages')
      .insert({ conversation_id: conversation.id, role: 'user', content: message })
    if (insertUserError) {
      res.status(500).json({ error: '메시지 저장에 실패했습니다.' })
      return
    }

    const { data: history, error: historyError } = await adminClient
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
    if (historyError) {
      res.status(500).json({ error: '대화 내역을 불러오지 못했습니다.' })
      return
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const requestParams = {
      model: conversation.model || requestedModel,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    }
    if (MODEL_CONFIG[requestParams.model]?.supportsEffort) {
      requestParams.output_config = { effort: 'low' }
    }

    let replyText = ''
    try {
      const response = await anthropic.messages.create(requestParams)
      replyText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
      if (!replyText) replyText = '(응답을 생성하지 못했습니다.)'
    } catch (e) {
      let errMsg = 'AI 응답 요청에 실패했습니다.'
      if (e?.status === 401) errMsg = 'API 키가 올바르지 않습니다.'
      else if (e?.status === 429) errMsg = '요청이 많아 잠시 후 다시 시도해주세요.'
      else if (e?.message) errMsg = e.message
      res.status(502).json({ error: errMsg })
      return
    }

    const { data: assistantMsg, error: insertAssistantError } = await adminClient
      .from('ai_messages')
      .insert({ conversation_id: conversation.id, role: 'assistant', content: replyText })
      .select()
      .single()
    if (insertAssistantError) {
      res.status(500).json({ error: '응답 저장에 실패했습니다.' })
      return
    }

    const { data: updatedConversation } = await adminClient
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id)
      .select()
      .single()

    res.status(200).json({
      conversation: updatedConversation || conversation,
      reply: assistantMsg,
    })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
