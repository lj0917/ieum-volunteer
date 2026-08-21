import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const SOURCE_LABEL = { bukgu: '북구청 공지', naver: '뉴스' }

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function LocalNewsPage() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  useEffect(() => {
    let cancelled = false

    supabase
      .from('local_issues')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('fetched_at', { ascending: false })
      .limit(100)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) setError('소식을 불러오지 못했습니다.')
        else setIssues(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => (sourceFilter ? issues.filter((i) => i.source === sourceFilter) : issues),
    [issues, sourceFilter],
  )

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">지역소식</span>
            <h1>광주 북구 소식 모아보기</h1>
          </div>
        </div>
        <p className="local-news__desc">
          광주광역시 북구청 공지사항과 "광주 북구" 관련 뉴스를 자동으로 모아 보여드립니다. 제목을 누르면
          원문 페이지로 이동합니다.
        </p>

        <div className="hours-toolbar">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">전체</option>
            <option value="bukgu">북구청 공지</option>
            <option value="naver">뉴스</option>
          </select>
        </div>

        {loading && <p className="board-empty">불러오는 중…</p>}
        {error && <p className="board-empty">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="board-empty">아직 수집된 소식이 없습니다.</p>
        )}

        <ul className="board-list">
          {filtered.map((issue) => (
            <li key={issue.id}>
              <a href={issue.url} target="_blank" rel="noopener noreferrer" className="board-list__row">
                <span className="board-list__title">{issue.title}</span>
                <span className="board-list__meta">
                  <span className={`status-badge status-badge--${issue.source === 'bukgu' ? 'approved' : 'pending'}`}>
                    {issue.category || SOURCE_LABEL[issue.source] || issue.source}
                  </span>
                  {' · '}
                  {formatDate(issue.published_at)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default LocalNewsPage
