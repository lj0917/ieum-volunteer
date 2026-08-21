import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin/members', label: '회원 관리' },
  { to: '/admin/posts', label: '게시판 관리' },
  { to: '/admin/photos', label: '사진첩 관리' },
  { to: '/admin/notices', label: '공지사항 관리' },
  { to: '/admin/activity-items', label: '활동 항목 관리' },
  { to: '/admin/hours', label: '봉사시간 관리' },
  { to: '/admin/local-news', label: '지역소식 관리' },
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
