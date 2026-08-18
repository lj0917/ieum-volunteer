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
      .from('profiles')
      .select('id, display_name, email, status, is_admin, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: '목록을 불러오지 못했습니다.' })
      return
    }
    res.status(200).json({ members: data })
    return
  }

  if (req.method === 'POST') {
    const { action, userId } = req.body || {}

    if (!userId || !['approve', 'reject', 'delete'].includes(action)) {
      res.status(400).json({ error: '잘못된 요청입니다.' })
      return
    }

    if (userId === caller.id) {
      res.status(400).json({ error: '본인 계정은 처리할 수 없습니다.' })
      return
    }

    if (action === 'delete') {
      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) {
        res.status(500).json({ error: '탈퇴 처리에 실패했습니다.' })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const { error } = await adminClient.from('profiles').update({ status }).eq('id', userId)
    if (error) {
      res.status(500).json({ error: '처리에 실패했습니다.' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
