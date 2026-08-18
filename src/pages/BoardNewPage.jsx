import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

function BoardNewPage() {
  const { user, displayName } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({ title, content, author_id: user.id, author_name: displayName })
      .select('id')
      .single()

    setLoading(false)

    if (insertError) {
      setError('글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    navigate(`/board/${data.id}`)
  }

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">게시판</span>
            <h1>글쓰기</h1>
          </div>
        </div>

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
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />
          </label>

          {error && <p className="auth-form__error">{error}</p>}

          <div className="board-form__actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '등록 중…' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default BoardNewPage
