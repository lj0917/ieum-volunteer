import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import BoardListPage from './pages/BoardListPage.jsx'
import BoardDetailPage from './pages/BoardDetailPage.jsx'
import BoardNewPage from './pages/BoardNewPage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import AdminMembersPage from './pages/AdminMembersPage.jsx'
import AdminPostsPage from './pages/AdminPostsPage.jsx'
import AdminPhotosPage from './pages/AdminPhotosPage.jsx'
import NoticesListPage from './pages/NoticesListPage.jsx'
import NoticeDetailPage from './pages/NoticeDetailPage.jsx'
import AdminNoticesPage from './pages/AdminNoticesPage.jsx'
import AdminHoursPage from './pages/AdminHoursPage.jsx'
import AdminActivityItemsPage from './pages/AdminActivityItemsPage.jsx'
import StaffLeavePage from './pages/StaffLeavePage.jsx'
import AdminLeavePage from './pages/AdminLeavePage.jsx'
import LocalNewsPage from './pages/LocalNewsPage.jsx'
import AdminLocalNewsPage from './pages/AdminLocalNewsPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import './App.css'

function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/board" element={<BoardListPage />} />
            <Route path="/board/new" element={<BoardNewPage />} />
            <Route path="/board/:id" element={<BoardDetailPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/notices" element={<NoticesListPage />} />
            <Route path="/notices/:id" element={<NoticeDetailPage />} />
            <Route path="/local-news" element={<LocalNewsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin/members" element={<AdminMembersPage />} />
            <Route path="/admin/posts" element={<AdminPostsPage />} />
            <Route path="/admin/photos" element={<AdminPhotosPage />} />
            <Route path="/admin/notices" element={<AdminNoticesPage />} />
            <Route path="/admin/hours" element={<AdminHoursPage />} />
            <Route path="/admin/activity-items" element={<AdminActivityItemsPage />} />
            <Route path="/leave" element={<StaffLeavePage />} />
            <Route path="/admin/leave" element={<AdminLeavePage />} />
            <Route path="/admin/local-news" element={<AdminLocalNewsPage />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
