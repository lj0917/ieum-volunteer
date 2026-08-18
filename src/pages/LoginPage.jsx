import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/board', { replace: true })
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    navigate('/board')
  }

  return (
    <section className="section auth-page">
      <div className="container auth-page__inner">
        <div className="auth-card">
          <h1>로그인</h1>
          <p className="auth-card__sub">이음봉사단 게시판을 이용하려면 로그인해주세요.</p>

          <form onSubmit={onSubmit} className="auth-form">
            <label>
              이메일
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
              />
            </label>

            {error && <p className="auth-form__error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <p className="auth-card__foot">
            아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
