import { useEffect, useState } from 'react'
import logoMark from '../assets/images/logo-mark.webp'

const NAV_LINKS = [
  { href: '#about', label: '소개' },
  { href: '#programs', label: '주요 사업' },
  { href: '#character', label: '이음이' },
  { href: '#pamphlet', label: '홍보자료' },
  { href: '#effects', label: '기대효과' },
]

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <a href="#top" className="brand">
          <img src={logoMark} alt="이음봉사단 로고" />
          <span>이음봉사단</span>
        </a>

        <nav className={`nav ${menuOpen ? 'is-open' : ''}`}>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#pamphlet" className="btn btn-primary btn-sm nav-cta">
          활동 살펴보기
        </a>

        <button
          type="button"
          className="menu-toggle"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

export default Header
