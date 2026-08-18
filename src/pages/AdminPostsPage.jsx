import { Fragment, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function AdminPostsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [openPostId, setOpenPostId] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  const callApi = async (method, params, body) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    const res = await fetch(`/api/admin-content${query}`, {
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

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const json = await callApi('GET', { resource: 'posts' })
      setPosts(json.posts)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadPosts()
  }, [isAdmin])

  const deletePost = async (postId) => {
    if (!window.confirm('이 게시글을 삭제할까요? 댓글도 함께 삭제됩니다.')) return
    setBusyId(postId)
    setError('')
    try {
      await callApi('POST', null, { resource: 'post', id: postId })
      if (openPostId === postId) setOpenPostId(null)
      await loadPosts()
    } catch (e) {
      setError(e.message)
    }
    setBusyId(null)
  }

  const toggleComments = async (postId) => {
    if (openPostId === postId) {
      setOpenPostId(null)
      return
    }
    setOpenPostId(postId)
    setCommentsLoading(true)
    try {
      const json = await callApi('GET', { resource: 'comments', postId })
      setComments(json.comments)
    } catch (e) {
      setError(e.message)
    }
    setCommentsLoading(false)
  }

  const deleteComment = async (commentId, postId) => {
    if (!window.confirm('이 댓글을 삭제할까요?')) return
    setBusyId(commentId)
    setError('')
    try {
      await callApi('POST', null, { resource: 'comment', id: commentId })
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p)))
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
            <h1>게시판 관리</h1>
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
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>댓글</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <Fragment key={p.id}>
                    <tr>
                      <td>{p.title}</td>
                      <td>{p.author_name}</td>
                      <td>{formatDate(p.created_at)}</td>
                      <td>
                        <button type="button" className="link-btn" onClick={() => toggleComments(p.id)}>
                          {p.comment_count}개 {openPostId === p.id ? '숨기기' : '보기'}
                        </button>
                      </td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          className="link-btn link-btn--danger"
                          disabled={busyId === p.id}
                          onClick={() => deletePost(p.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                    {openPostId === p.id && (
                      <tr>
                        <td colSpan={5}>
                          {commentsLoading && <p className="board-empty">불러오는 중…</p>}
                          {!commentsLoading && comments.length === 0 && (
                            <p className="board-empty">댓글이 없습니다.</p>
                          )}
                          {!commentsLoading && comments.length > 0 && (
                            <ul className="admin-comment-list">
                              {comments.map((c) => (
                                <li key={c.id}>
                                  <div>
                                    <span className="comment-list__author">{c.author_name}</span>
                                    <span className="comment-list__date">{formatDate(c.created_at)}</span>
                                  </div>
                                  <p>{c.content}</p>
                                  <button
                                    type="button"
                                    className="link-btn link-btn--danger"
                                    disabled={busyId === c.id}
                                    onClick={() => deleteComment(c.id, p.id)}
                                  >
                                    삭제
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="board-empty">
                      등록된 게시글이 없습니다.
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

export default AdminPostsPage
