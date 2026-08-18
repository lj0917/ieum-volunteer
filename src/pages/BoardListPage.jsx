import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function BoardListPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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
  }, [])

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">게시판</span>
            <h1>이음봉사단 게시판</h1>
          </div>
          {user ? (
            <Link to="/board/new" className="btn btn-primary">
              글쓰기
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline">
              로그인 후 글쓰기
            </Link>
          )}
        </div>

        {loading && <p className="board-empty">불러오는 중…</p>}
        {error && <p className="board-empty">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="board-empty">아직 등록된 글이 없습니다. 첫 글을 남겨보세요!</p>
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
