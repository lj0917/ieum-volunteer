import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const BUCKET = 'activity-photos'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function publicUrlFor(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploaderName, setUploaderName] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

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
    loadPhotos()
  }, [])

  const onFileChange = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (!f) {
      setFile(null)
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('PNG, JPG, WEBP, GIF 형식만 업로드할 수 있습니다.')
      setFile(null)
      return
    }
    if (f.size > MAX_SIZE) {
      setError('파일 용량은 5MB 이하만 가능합니다.')
      setFile(null)
      return
    }
    setFile(f)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('사진을 선택해주세요.')
      return
    }

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)

    if (uploadError) {
      setUploading(false)
      setError('업로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const { error: insertError } = await supabase.from('photos').insert({
      storage_path: path,
      caption,
      uploader_name: uploaderName.trim() || '익명',
    })

    setUploading(false)

    if (insertError) {
      setError('사진 등록에 실패했습니다.')
      return
    }

    setFile(null)
    setCaption('')
    setUploaderName('')
    e.target.reset()
    loadPhotos()
  }

  return (
    <section className="section gallery-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">활동 사진첩</span>
            <h1>이음봉사단 활동 모습</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="upload-form">
          <label className="upload-form__file">
            사진 선택
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFileChange} />
          </label>
          <input
            type="text"
            maxLength={80}
            placeholder="사진 설명 (선택)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <input
            type="text"
            maxLength={20}
            placeholder="이름 (선택, 비워두면 익명)"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? '업로드 중…' : '업로드'}
          </button>
        </form>
        {error && <p className="auth-form__error">{error}</p>}

        {loading && <p className="board-empty">불러오는 중…</p>}
        {!loading && photos.length === 0 && <p className="board-empty">아직 등록된 사진이 없습니다.</p>}

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
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GalleryPage
