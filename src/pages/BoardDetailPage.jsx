import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BoardDetailPage() {
  const { id } = useParams()
  const { user, displayName, approved } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ data: postData, error: postError }, { data: commentData }] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).maybeSingle(),
        supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true }),
      ])

      if (cancelled) return

      if (postError || !postData) {
        setNotFound(true)
      } else {
        setPost(postData)
        setComments(commentData || [])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const deletePost = async () => {
    if (!window.confirm('이 글을 삭제할까요?')) return
    await supabase.from('posts').delete().eq('id', id)
    navigate('/board')
  }

  const deleteComment = async (commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const onCommentSubmit = async (e) => {
    e.preventDefault()
    setCommentError('')
    setSubmitting(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, content: commentText, author_id: user.id, author_name: displayName })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      setCommentError('댓글 등록에 실패했습니다.')
      return
    }
    setComments((prev) => [...prev, data])
    setCommentText('')
  }

  if (loading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">글을 찾을 수 없습니다.</p>
          <Link to="/board" className="btn btn-outline">
            목록으로
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container board-detail">
        <Link to="/board" className="board-detail__back">
          ← 목록으로
        </Link>

        <article className="board-detail__post">
          <h1>{post.title}</h1>
          <p className="board-list__meta">
            {post.author_name} · {formatDate(post.created_at)}
          </p>
          <div
            className="board-detail__content board-editor__content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content, {
                ALLOWED_TAGS: [
                  'p',
                  'br',
                  'strong',
                  'em',
                  'u',
                  's',
                  'span',
                  'ul',
                  'ol',
                  'li',
                  'img',
                  'a',
                  'h1',
                  'h2',
                  'h3',
                  'blockquote',
                  'code',
                  'pre',
                ],
                ALLOWED_ATTR: ['style', 'src', 'alt', 'href', 'class', 'target', 'rel'],
              }),
            }}
          />

          {user?.id === post.author_id && (
            <button type="button" className="link-btn link-btn--danger" onClick={deletePost}>
              삭제
            </button>
          )}
        </article>

        <div className="board-detail__comments">
          <h2>댓글 {comments.length}</h2>

          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-list__item">
                <div>
                  <span className="comment-list__author">{c.author_name}</span>
                  <span className="comment-list__date">{formatDate(c.created_at)}</span>
                </div>
                <p>{c.content}</p>
                {user?.id === c.author_id && (
                  <button
                    type="button"
                    className="link-btn link-btn--danger"
                    onClick={() => deleteComment(c.id)}
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
            {comments.length === 0 && <li className="board-empty">첫 댓글을 남겨보세요.</li>}
          </ul>

          {user && approved && (
            <form onSubmit={onCommentSubmit} className="comment-form">
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요"
              />
              {commentError && <p className="auth-form__error">{commentError}</p>}
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? '등록 중…' : '댓글 등록'}
              </button>
            </form>
          )}
          {user && !approved && <p className="board-empty">관리자 승인 후 댓글을 남길 수 있습니다.</p>}
          {!user && (
            <p className="board-empty">
              <Link to="/login">로그인</Link> 후 댓글을 남길 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default BoardDetailPage
