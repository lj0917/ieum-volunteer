import { useAuth } from '../context/AuthContext.jsx'
import bannerSupport from '../assets/images/banner-support.webp'

function SupportPage() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">준비 중인 페이지입니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container">
        <img src={bannerSupport} alt="" className="page-banner" />

        <div className="page-head">
          <div>
            <span className="eyebrow">후원</span>
            <h1>이음봉사단과 함께해주세요</h1>
          </div>
        </div>

        <p className="local-news__desc">
          여러분의 후원은 교통안전·학교폭력예방·환경정화 활동을 이어가는 든든한 힘이 됩니다. 작은
          관심이 모여 학교와 마을을 더 안전하고 따뜻하게 만듭니다.
        </p>

        <div className="support-grid">
          <article className="support-card">
            <h3>계좌이체로 후원하기</h3>
            <div className="support-card__placeholder">계좌 안내 이미지 (준비 중)</div>
            <p className="support-card__note">계좌 정보는 추후 안내드릴 예정입니다.</p>
          </article>

          <article className="support-card">
            <h3>고유번호로 후원하기</h3>
            <div className="support-card__placeholder">고유번호 안내 이미지 (준비 중)</div>
            <p className="support-card__note">고유번호 안내는 추후 업데이트될 예정입니다.</p>
          </article>
        </div>

        <div className="support-contact">
          <h3>정기후원·기업후원 문의</h3>
          <p>
            정기후원이나 기업 후원을 원하시면 이메일로 문의해주세요.
            <br />
            <a href="mailto:osban2@naver.com">osban2@naver.com</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default SupportPage
