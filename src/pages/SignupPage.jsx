import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'

function SignupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/board', { replace: true })
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: nickname } },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <section className="section auth-page">
        <div className="container auth-page__inner">
          <div className="auth-card">
            <h1>가입 완료</h1>
            <p className="auth-card__sub">
              {email}로 인증 메일을 보내드렸습니다. 메일함에서 인증 링크를 확인한 뒤 로그인해주세요.
              <br />
              로그인 후에도 관리자 승인이 완료되어야 게시판 글쓰기·댓글이 가능합니다.
            </p>
            <Link to="/login" className="btn btn-primary">
              로그인하러 가기
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section auth-page">
      <div className="container auth-page__inner">
        <div className="auth-card">
          <h1>회원가입</h1>
          <p className="auth-card__sub">닉네임으로 게시판에 표시됩니다.</p>

          <form onSubmit={onSubmit} className="auth-form">
            <label>
              닉네임
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="게시판에 표시될 이름"
              />
            </label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
              />
            </label>

            {error && <p className="auth-form__error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '가입 중…' : '회원가입'}
            </button>
          </form>

          <p className="auth-card__foot">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default SignupPage
