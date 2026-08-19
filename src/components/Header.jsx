import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logoMark from '../assets/images/logo-mark.webp'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { href: '/#about', label: '소개' },
  { href: '/#programs', label: '주요 사업' },
  { href: '/notices', label: '공지사항' },
  { href: '/board', label: '게시판' },
  { href: '/gallery', label: '사진첩' },
]

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, displayName, isAdmin, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = isAdmin ? [...NAV_LINKS, { href: '/admin/members', label: '관리자' }] : NAV_LINKS

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <img src={logoMark} alt="이음봉사단 로고" />
          <span>이음봉사단</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'is-open' : ''}`}>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="nav-auth-mobile">
              {user ? (
                <button type="button" className="link-btn" onClick={signOut}>
                  {displayName}님 로그아웃
                </button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  로그인
                </Link>
              )}
            </li>
          </ul>
        </nav>

        <div className="nav-auth">
          {user ? (
            <button type="button" className="link-btn" onClick={signOut}>
              {displayName}님 로그아웃
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm">
              로그인
            </Link>
          )}
        </div>

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
