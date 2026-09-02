import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import bannerGallery from '../assets/images/banner-gallery.webp'

const BUCKET = 'activity-photos'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function publicUrlFor(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

async function uploadOnePhoto(file, caption, uploaderName, uploaderId) {
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { error: insertError } = await supabase.from('photos').insert({
    storage_path: path,
    caption,
    uploader_name: uploaderName,
    uploader_id: uploaderId,
  })
  if (insertError) throw insertError
}

function GalleryPage() {
  const { user, displayName, approved, loading: authLoading } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  const [files, setFiles] = useState([])
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadPhotos = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!fetchError) setPhotos(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    loadPhotos()
  }, [user])

  const onFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    setError('')
    if (selected.length === 0) {
      setFiles([])
      return
    }

    const rejected = []
    const valid = selected.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        rejected.push(`${f.name} (지원하지 않는 형식)`)
        return false
      }
      if (f.size > MAX_SIZE) {
        rejected.push(`${f.name} (5MB 초과)`)
        return false
      }
      return true
    })

    if (rejected.length > 0) {
      setError(`다음 파일은 제외됩니다: ${rejected.join(', ')}`)
    }
    setFiles(valid)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('사진을 선택해주세요.')
      return
    }

    setUploading(true)
    setError('')

    const results = await Promise.allSettled(
      files.map((f) => uploadOnePhoto(f, caption, displayName, user.id)),
    )
    const failedCount = results.filter((r) => r.status === 'rejected').length

    setUploading(false)

    if (failedCount > 0) {
      setError(`${failedCount}장 업로드에 실패했습니다. (성공 ${files.length - failedCount}장)`)
    }

    setFiles([])
    setCaption('')
    e.target.reset()
    loadPhotos()
  }

  const onDelete = async (photo) => {
    if (!window.confirm('이 사진을 삭제할까요?')) return
    setDeletingId(photo.id)
    await supabase.storage.from(BUCKET).remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setDeletingId(null)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  if (authLoading) {
    return (
      <section className="section gallery-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="section gallery-page">
        <div className="container">
          <img src={bannerGallery} alt="" className="page-banner" />
          <div className="page-head">
            <div>
              <span className="eyebrow">활동 사진첩</span>
              <h1>이음봉사단 활동 모습</h1>
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
    <section className="section gallery-page">
      <div className="container">
        <img src={bannerGallery} alt="" className="page-banner" />

        <div className="page-head">
          <div>
            <span className="eyebrow">활동 사진첩</span>
            <h1>이음봉사단 활동 모습</h1>
          </div>
        </div>

        {approved && (
          <form onSubmit={onSubmit} className="upload-form">
            <label className="upload-form__file">
              {files.length > 0 ? `${files.length}장 선택됨` : '사진 선택 (여러 장 가능)'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={onFileChange}
              />
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="사진 설명 (선택)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? '업로드 중…' : '업로드'}
            </button>
          </form>
        )}
        {!approved && <p className="board-empty">관리자 승인 후 사진을 업로드할 수 있습니다.</p>}
        {error && <p className="auth-form__error">{error}</p>}

        {loading && <p className="board-empty">불러오는 중…</p>}
        {!loading && photos.length === 0 && <EmptyState message="아직 등록된 사진이 없습니다." />}

        <div className="photo-grid">
          {photos.map((p) => (
            <figure key={p.id} className="photo-grid__item">
              <img src={publicUrlFor(p.storage_path)} alt={p.caption || '이음봉사단 활동 사진'} loading="lazy" />
              {(p.caption || p.uploader_name) && (
                <figcaption>
                  {p.caption && <span>{p.caption}</span>}
                  <span className="photo-grid__uploader">{p.uploader_name}</span>
                </figcaption>
              )}
              {Boolean(user) && user.id === p.uploader_id && (
                <button
                  type="button"
                  className="photo-grid__delete"
                  disabled={deletingId === p.id}
                  onClick={() => onDelete(p)}
                >
                  삭제
                </button>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GalleryPage
