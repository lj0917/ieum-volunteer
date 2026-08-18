import { createClient } from '@supabase/supabase-js'

const PHOTO_BUCKET = 'activity-photos'

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
    const resource = req.query?.resource

    if (resource === 'posts') {
      const { data, error } = await adminClient
        .from('posts')
        .select('id, title, author_name, created_at, comments(count)')
        .order('created_at', { ascending: false })

      if (error) {
        res.status(500).json({ error: '게시글 목록을 불러오지 못했습니다.' })
        return
      }
      res.status(200).json({
        posts: data.map((p) => ({ ...p, comment_count: p.comments?.[0]?.count ?? 0, comments: undefined })),
      })
      return
    }

    if (resource === 'comments') {
      const postId = req.query?.postId
      if (!postId) {
        res.status(400).json({ error: 'postId가 필요합니다.' })
        return
      }
      const { data, error } = await adminClient
        .from('comments')
        .select('id, content, author_name, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        res.status(500).json({ error: '댓글 목록을 불러오지 못했습니다.' })
        return
      }
      res.status(200).json({ comments: data })
      return
    }

    if (resource === 'photos') {
      const { data, error } = await adminClient
        .from('photos')
        .select('id, storage_path, caption, uploader_name, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        res.status(500).json({ error: '사진 목록을 불러오지 못했습니다.' })
        return
      }
      res.status(200).json({
        photos: data.map((p) => ({
          ...p,
          url: adminClient.storage.from(PHOTO_BUCKET).getPublicUrl(p.storage_path).data.publicUrl,
        })),
      })
      return
    }

    res.status(400).json({ error: '알 수 없는 resource입니다.' })
    return
  }

  if (req.method === 'POST') {
    const { resource, id } = req.body || {}

    if (resource === 'post' && id) {
      const { error } = await adminClient.from('posts').delete().eq('id', id)
      if (error) {
        res.status(500).json({ error: '게시글 삭제에 실패했습니다.' })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    if (resource === 'comment' && id) {
      const { error } = await adminClient.from('comments').delete().eq('id', id)
      if (error) {
        res.status(500).json({ error: '댓글 삭제에 실패했습니다.' })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    if (resource === 'photo' && id) {
      const { data: photo } = await adminClient.from('photos').select('storage_path').eq('id', id).maybeSingle()
      if (photo?.storage_path) {
        await adminClient.storage.from(PHOTO_BUCKET).remove([photo.storage_path])
      }
      const { error } = await adminClient.from('photos').delete().eq('id', id)
      if (error) {
        res.status(500).json({ error: '사진 삭제에 실패했습니다.' })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    res.status(400).json({ error: '잘못된 요청입니다.' })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
