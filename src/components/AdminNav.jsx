import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin/members', label: '회원 관리' },
  { to: '/admin/posts', label: '게시판 관리' },
  { to: '/admin/photos', label: '사진첩 관리' },
]

function AdminNav() {
  return (
    <div className="admin-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `admin-nav__tab ${isActive ? 'is-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}

export default AdminNav
