import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import EmptyState from '../components/EmptyState.jsx'
import bannerNotices from '../assets/images/banner-notices.webp'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function NoticesListPage() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    supabase
      .from('notices')
      .select('id, title, author_name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) setError('공지사항을 불러오지 못했습니다.')
        else setNotices(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="section board-page">
      <div className="container">
        <img src={bannerNotices} alt="" className="page-banner" />

        <div className="page-head">
          <div>
            <span className="eyebrow">공지사항</span>
            <h1>이음봉사단 공지사항</h1>
          </div>
        </div>

        {loading && <p className="board-empty">불러오는 중…</p>}
        {error && <p className="board-empty">{error}</p>}
        {!loading && !error && notices.length === 0 && (
          <EmptyState message="등록된 공지사항이 없습니다." />
        )}

        <ul className="board-list">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link to={`/notices/${notice.id}`} className="board-list__row">
                <span className="board-list__title">{notice.title}</span>
                <span className="board-list__meta">
                  {notice.author_name} · {formatDate(notice.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default NoticesListPage
