import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import bannerBoard from '../assets/images/banner-board.webp'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function BoardListPage() {
  const { user, approved, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('posts')
      .select('id, title, author_name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) setError('게시글을 불러오지 못했습니다.')
        else setPosts(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (authLoading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="section board-page">
        <div className="container">
          <img src={bannerBoard} alt="" className="page-banner" />
          <div className="page-head">
            <div>
              <span className="eyebrow">게시판</span>
              <h1>이음봉사단 게시판</h1>
            </div>
          </div>
          <EmptyState message="로그인 후 이용할 수 있는 메뉴입니다." />
          <p style={{ textAlign: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              로그인하러 가기
            </Link>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container">
        <img src={bannerBoard} alt="" className="page-banner" />

        <div className="page-head">
          <div>
            <span className="eyebrow">게시판</span>
            <h1>이음봉사단 게시판</h1>
          </div>
          {approved && (
            <Link to="/board/new" className="btn btn-primary">
              글쓰기
            </Link>
          )}
          {!approved && <span className="pending-badge">승인 대기중</span>}
        </div>

        {loading && <p className="board-empty">불러오는 중…</p>}
        {error && <p className="board-empty">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <EmptyState message="아직 등록된 글이 없습니다. 첫 글을 남겨보세요!" />
        )}

        <ul className="board-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link to={`/board/${post.id}`} className="board-list__row">
                <span className="board-list__title">{post.title}</span>
                <span className="board-list__meta">
                  {post.author_name} · {formatDate(post.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default BoardListPage
