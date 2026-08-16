import logoMark from '../assets/images/logo-mark.webp'
import logoInfinity from '../assets/images/logo-infinity.webp'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img src={logoMark} alt="이음봉사단 로고" />
          <div>
            <strong>이음봉사단</strong>
            <p>마음과 마음을 잇는 봉사, 함께 만드는 안전한 우리 마을</p>
          </div>
        </div>

        <a href="mailto:osban2@naver.com" className="footer__contact">
          osban2@naver.com
        </a>

        <img className="footer__infinity" src={logoInfinity} alt="" aria-hidden="true" />

        <p className="footer__copyright">
          © {year} 이음봉사단. 문의사항은 이메일로 연락해 주세요.
        </p>
      </div>
    </footer>
  )
}

export default Footer
