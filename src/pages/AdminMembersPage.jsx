import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

const STATUS_LABEL = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function AdminMembersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const callApi = async (method, body) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch('/api/admin-members', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || '요청에 실패했습니다.')
    return json
  }

  const loadMembers = async () => {
    setLoading(true)
    setError('')
    try {
      const json = await callApi('GET')
      setMembers(json.members)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadMembers()
  }, [isAdmin])

  const runAction = async (userId, action) => {
    if (action === 'delete' && !window.confirm('이 회원을 탈퇴 처리할까요? 되돌릴 수 없습니다.')) {
      return
    }
    setBusyId(userId)
    setError('')
    try {
      await callApi('POST', { action, userId })
      await loadMembers()
    } catch (e) {
      setError(e.message)
    }
    setBusyId(null)
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
            <h1>회원 관리</h1>
          </div>
        </div>

        <AdminNav />

        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <div className="admin-table__wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>닉네임</th>
                  <th>이메일</th>
                  <th>가입일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.display_name}
                      {m.is_admin && <span className="admin-badge">관리자</span>}
                    </td>
                    <td>{m.email}</td>
                    <td>{formatDate(m.created_at)}</td>
                    <td>
                      <span className={`status-badge status-badge--${m.status}`}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                    </td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="link-btn"
                        disabled={busyId === m.id || m.status === 'approved'}
                        onClick={() => runAction(m.id, 'approve')}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="link-btn"
                        disabled={busyId === m.id || m.status === 'rejected'}
                        onClick={() => runAction(m.id, 'reject')}
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        disabled={busyId === m.id || m.id === user.id}
                        onClick={() => runAction(m.id, 'delete')}
                      >
                        탈퇴 처리
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="board-empty">
                      가입한 회원이 없습니다.
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

export default AdminMembersPage
