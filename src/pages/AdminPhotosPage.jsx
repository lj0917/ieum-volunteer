import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function AdminPhotosPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

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

  const loadPhotos = async () => {
    setLoading(true)
    setError('')
    try {
      const json = await callApi('GET', { resource: 'photos' })
      setPhotos(json.photos)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadPhotos()
  }, [isAdmin])

  const deletePhoto = async (photoId) => {
    if (!window.confirm('이 사진을 삭제할까요?')) return
    setBusyId(photoId)
    setError('')
    try {
      await callApi('POST', null, { resource: 'photo', id: photoId })
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
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
            <h1>사진첩 관리</h1>
          </div>
        </div>

        <AdminNav />

        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}
        {!loading && photos.length === 0 && <p className="board-empty">등록된 사진이 없습니다.</p>}

        <div className="photo-grid">
          {photos.map((p) => (
            <figure key={p.id} className="photo-grid__item">
              <img src={p.url} alt={p.caption || '이음봉사단 활동 사진'} loading="lazy" />
              <figcaption>
                <span>{p.caption || '설명 없음'}</span>
                <span className="photo-grid__uploader">
                  {p.uploader_name} · {formatDate(p.created_at)}
                </span>
              </figcaption>
              <button
                type="button"
                className="photo-grid__delete"
                disabled={busyId === p.id}
                onClick={() => deletePhoto(p.id)}
              >
                삭제
              </button>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AdminPhotosPage
