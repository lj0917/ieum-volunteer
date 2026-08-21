import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

const SOURCE_LABEL = { bukgu: '북구청 공지', naver: '뉴스' }

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminLocalNewsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  const loadIssues = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('local_issues')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(200)
    if (!fetchError) setIssues(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadIssues()
  }, [isAdmin])

  const onRefresh = async () => {
    setRefreshing(true)
    setError('')
    setResultMsg('')

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    try {
      const res = await fetch('/api/refresh-local-issues', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '가져오기에 실패했습니다.')
      setResultMsg(`북구청 공지 ${json.bukgu}건, 뉴스 ${json.naver}건 확인 완료`)
      loadIssues()
    } catch (e) {
      setError(e.message)
    }
    setRefreshing(false)
  }

  const deleteIssue = async (id) => {
    if (!window.confirm('이 항목을 목록에서 삭제할까요?')) return
    await supabase.from('local_issues').delete().eq('id', id)
    setIssues((prev) => prev.filter((i) => i.id !== id))
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
            <h1>지역소식 관리</h1>
          </div>
          <button type="button" className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? '가져오는 중…' : '지금 새로고침'}
          </button>
        </div>

        <AdminNav />

        {resultMsg && <p className="board-empty">{resultMsg}</p>}
        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <div className="admin-table__wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>제목</th>
                  <th>수집일시</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id}>
                    <td>{i.category || SOURCE_LABEL[i.source] || i.source}</td>
                    <td>
                      <a href={i.url} target="_blank" rel="noopener noreferrer">
                        {i.title}
                      </a>
                    </td>
                    <td>{formatDateTime(i.fetched_at)}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => deleteIssue(i.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={4} className="board-empty">
                      수집된 소식이 없습니다. "지금 새로고침"을 눌러주세요.
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

export default AdminLocalNewsPage
