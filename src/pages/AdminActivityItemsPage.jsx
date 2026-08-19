import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

function AdminActivityItemsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadItems = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('activity_items')
      .select('*')
      .order('name')
    if (!fetchError) setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadItems()
  }, [isAdmin])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return

    setSaving(true)
    const { error: insertError } = await supabase.from('activity_items').insert({ name: name.trim() })
    setSaving(false)

    if (insertError) {
      setError(insertError.code === '23505' ? '이미 등록된 항목입니다.' : '등록에 실패했습니다.')
      return
    }
    setName('')
    loadItems()
  }

  const deleteItem = async (id) => {
    if (!window.confirm('이 활동 항목을 삭제할까요? 기존 봉사시간 기록의 항목 연결이 해제됩니다.')) return
    await supabase.from('activity_items').delete().eq('id', id)
    loadItems()
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
            <h1>봉사 활동 항목 관리</h1>
          </div>
        </div>

        <AdminNav />

        <form onSubmit={onSubmit} className="hours-form">
          <input
            type="text"
            required
            maxLength={60}
            placeholder="예: 교통안전 캠페인"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? '추가 중…' : '항목 추가'}
          </button>
        </form>

        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <ul className="activity-item-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <button type="button" className="link-btn link-btn--danger" onClick={() => deleteItem(item.id)}>
                  삭제
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="board-empty">등록된 활동 항목이 없습니다.</li>}
          </ul>
        )}
      </div>
    </section>
  )
}

export default AdminActivityItemsPage
