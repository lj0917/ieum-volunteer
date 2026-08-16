import { useEffect, useState } from 'react'
import pamphletDisplay from '../assets/images/pamphlet.webp'
import pamphletFull from '../assets/images/pamphlet.png'

function Pamphlet() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <section id="pamphlet" className="section section-alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">홍보 자료</span>
          <h2>이음봉사단 홍보 팜플렛</h2>
          <p>이미지를 클릭하면 크게 볼 수 있어요.</p>
        </div>

        <button
          type="button"
          className="pamphlet__frame"
          onClick={() => setOpen(true)}
        >
          <img src={pamphletDisplay} alt="이음봉사단 홍보 팜플렛" />
          <span className="pamphlet__hint">클릭하여 크게 보기</span>
        </button>

        <div className="pamphlet__actions">
          <a href={pamphletFull} download="이음봉사단_홍보팜플렛.png" className="btn btn-primary">
            팜플렛 다운로드
          </a>
        </div>
      </div>

      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button type="button" className="lightbox__close" aria-label="닫기">
            ✕
          </button>
          <img src={pamphletDisplay} alt="이음봉사단 홍보 팜플렛 확대 이미지" />
        </div>
      )}
    </section>
  )
}

export default Pamphlet
