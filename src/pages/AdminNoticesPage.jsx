import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'
import RichTextEditor from '../components/RichTextEditor.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function isContentEmpty(html) {
  return !html || html.replace(/<[^>]*>/g, '').trim().length === 0
}

function AdminNoticesPage() {
  const { user, displayName, isAdmin, loading: authLoading } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadNotices = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
    if (!fetchError) setNotices(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadNotices()
  }, [isAdmin])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
  }

  const startEdit = (notice) => {
    setEditingId(notice.id)
    setTitle(notice.title)
    setContent(notice.content)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isContentEmpty(content)) {
      setError('내용을 입력해주세요.')
      return
    }

    setSaving(true)

    const payload = editingId
      ? { title, content }
      : { title, content, author_name: displayName }

    const { error: saveError } = editingId
      ? await supabase.from('notices').update(payload).eq('id', editingId)
      : await supabase.from('notices').insert(payload)

    setSaving(false)

    if (saveError) {
      setError('저장에 실패했습니다.')
      return
    }

    resetForm()
    loadNotices()
  }

  const deleteNotice = async (id) => {
    if (!window.confirm('이 공지사항을 삭제할까요?')) return
    await supabase.from('notices').delete().eq('id', id)
    if (editingId === id) resetForm()
    loadNotices()
  }

  if (authLoading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!user || !isAdmin) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">관리자만 접근할 수 있습니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">관리자</span>
            <h1>공지사항 관리</h1>
          </div>
        </div>

        <AdminNav />

        <form onSubmit={onSubmit} className="board-form">
          <label>
            제목
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </label>
          <label>
            내용
            <RichTextEditor content={content} onChange={setContent} placeholder="공지 내용을 입력하세요" />
          </label>

          {error && <p className="auth-form__error">{error}</p>}

          <div className="board-form__actions">
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                취소
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중…' : editingId ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>

        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <div className="admin-table__wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.id}>
                    <td>{n.title}</td>
                    <td>{n.author_name}</td>
                    <td>{formatDate(n.created_at)}</td>
                    <td className="admin-table__actions">
                      <button type="button" className="link-btn" onClick={() => startEdit(n)}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => deleteNotice(n.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="board-empty">
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default AdminNoticesPage
