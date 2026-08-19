import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabaseClient.js'

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NoticeDetailPage() {
  const { id } = useParams()
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) setNotFound(true)
        else setNotice(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

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
          <p className="board-empty">공지사항을 찾을 수 없습니다.</p>
          <Link to="/notices" className="btn btn-outline">
            목록으로
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container board-detail">
        <Link to="/notices" className="board-detail__back">
          ← 목록으로
        </Link>

        <article className="board-detail__post">
          <h1>{notice.title}</h1>
          <p className="board-list__meta">
            {notice.author_name} · {formatDate(notice.created_at)}
          </p>
          <div
            className="board-detail__content board-editor__content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(notice.content, {
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
        </article>
      </div>
    </section>
  )
}

export default NoticeDetailPage
