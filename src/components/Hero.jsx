import characterHero from '../assets/images/character-sheet.webp'
import logoInfinity from '../assets/images/logo-infinity.webp'

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <span className="eyebrow">광주 북구 청소년 안전 봉사단체</span>
          <h1>
            마음을 잇고,
            <br />
            함께 만들어요!
          </h1>
          <p>
            마음과 마음을 잇는 봉사, 함께 만드는 안전한 우리 마을.
            <br />
            <strong>이음봉사단</strong>은 교통안전·학교폭력예방·환경정화 활동으로
            학교와 지역사회를 안전하고 따뜻하게 잇습니다.
          </p>
          <div className="hero__actions">
            <a href="#programs" className="btn btn-primary">
              주요 사업 보기
            </a>
            <a href="#pamphlet" className="btn btn-outline">
              홍보 팜플렛 보기
            </a>
          </div>
          <img className="hero__infinity" src={logoInfinity} alt="" aria-hidden="true" />
        </div>

        <div className="hero__visual">
          <div className="hero__blob" aria-hidden="true" />
          <img src={characterHero} alt="이음봉사단 캐릭터 이음이" />
        </div>
      </div>
    </section>
  )
}

export default Hero
