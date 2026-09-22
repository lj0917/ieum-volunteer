import { createClient } from '@supabase/supabase-js'

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
    const { data, error } = await adminClient
      .from('ai_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      res.status(500).json({ error: '목록을 불러오지 못했습니다.' })
      return
    }
    res.status(200).json({ evaluations: data })
    return
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id
    if (!id) {
      res.status(400).json({ error: '잘못된 요청입니다.' })
      return
    }
    const { error } = await adminClient.from('ai_evaluations').delete().eq('id', id)
    if (error) {
      res.status(500).json({ error: '삭제에 실패했습니다.' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'POST') {
    if (!process.env.TYPESAFE_AI_API_KEY) {
      res.status(500).json({ error: '서버에 TYPESAFE_AI_API_KEY가 설정되지 않았습니다.' })
      return
    }

    const { title, state, questionType, instructions, criteria } = req.body || {}
    if (!state || !questionType || !instructions || !criteria) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다.' })
      return
    }
    if (!['noul', 'choice', 'score'].includes(questionType)) {
      res.status(400).json({ error: '알 수 없는 판정 유형입니다.' })
      return
    }

    let answer = null
    let usage = null
    let apiError = null

    try {
      const apiRes = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TYPESAFE_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state,
          model: 'jev-latest',
          questions: {
            q1: { type: questionType, instructions, criteria },
          },
        }),
      })
      const json = await apiRes.json()
      if (!apiRes.ok) {
        apiError = json?.error ? JSON.stringify(json.error) : JSON.stringify(json)
      } else {
        answer = json?.answers?.q1 || null
        usage = json?.usage || null
      }
    } catch (e) {
      apiError = e.message
    }

    const { data, error: insertError } = await adminClient
      .from('ai_evaluations')
      .insert({
        created_by: caller.id,
        title: (title?.trim() || state).slice(0, 80),
        state,
        question_type: questionType,
        instructions,
        criteria,
        answer,
        usage,
        error: apiError,
      })
      .select()
      .single()

    if (insertError) {
      res.status(500).json({ error: '저장에 실패했습니다.' })
      return
    }

    res.status(200).json({ evaluation: data })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
