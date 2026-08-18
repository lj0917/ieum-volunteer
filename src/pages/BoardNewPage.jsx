import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import RichTextEditor from '../components/RichTextEditor.jsx'

function isContentEmpty(html) {
  return !html || html.replace(/<[^>]*>/g, '').trim().length === 0
}

function BoardNewPage() {
  const { user, displayName, approved } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!approved) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">
            아직 관리자 승인 대기중입니다. 승인 후 글을 작성할 수 있어요.
          </p>
        </div>
      </section>
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isContentEmpty(content)) {
      setError('내용을 입력해주세요.')
      return
    }

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
            <RichTextEditor content={content} onChange={setContent} placeholder="내용을 입력하세요" />
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
