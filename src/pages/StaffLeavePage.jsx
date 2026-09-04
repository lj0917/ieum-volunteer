import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import {
  LEAVE_TYPES,
  annualGrantDays,
  currentLeaveYearRange,
  deductDaysForRequest,
  formatDateTime,
  formatDeduction,
  isHourlyType,
  leaveTypeLabel,
  leaveTypeOptionLabel,
  statusLabel,
  tenureLabel,
  usedDaysInRange,
} from '../lib/leaveCalc.js'

function StaffLeavePage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [staff, setStaff] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [notStaff, setNotStaff] = useState(false)

  const [leaveType, setLeaveType] = useState('annual')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    const { data: staffData } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle()
    if (!staffData) {
      setNotStaff(true)
      setLoading(false)
      return
    }
    setStaff(staffData)
    const { data: requestData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('staff_id', user.id)
      .order('start_at', { ascending: false })
    setRequests(requestData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!startAt || !endAt) {
      setError('시작/종료 일시를 입력해주세요.')
      return
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError('종료 일시는 시작 일시보다 이후여야 합니다.')
      return
    }
    if (isHourlyType(leaveType) && (new Date(endAt) - new Date(startAt)) % (60 * 60 * 1000) !== 0) {
      setError('시간차는 1시간 단위로 입력해주세요.')
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('leave_requests').insert({
      staff_id: user.id,
      leave_type: leaveType,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      deduct_days: deductDaysForRequest(leaveType, startAt, endAt),
      reason: reason.trim() || null,
    })
    setSubmitting(false)

    if (insertError) {
      setError('신청에 실패했습니다.')
      return
    }

    setStartAt('')
    setEndAt('')
    setReason('')
    loadAll()
  }

  const cancelRequest = async (id) => {
    if (!window.confirm('이 신청을 취소할까요?')) return
    await supabase.from('leave_requests').delete().eq('id', id)
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  if (authLoading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="section board-page">
        <div className="container">
          <EmptyState message="로그인 후 이용할 수 있는 메뉴입니다." />
          <p style={{ textAlign: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              로그인하러 가기
            </Link>
          </p>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (notStaff) {
    return (
      <section className="section board-page">
        <div className="container">
          <div className="page-head">
            <div>
              <span className="eyebrow">연차/근태</span>
              <h1>연차·근태 관리</h1>
            </div>
          </div>
          <EmptyState message="사무국 직원만 이용할 수 있는 메뉴입니다." />
          {isAdmin && (
            <p style={{ textAlign: 'center' }}>
              <Link to="/admin/leave" className="btn btn-outline">
                직원 등록하러 가기
              </Link>
            </p>
          )}
        </div>
      </section>
    )
  }

  const range = currentLeaveYearRange(staff.hire_date)
  const granted = annualGrantDays(staff.hire_date)
  const used = usedDaysInRange(requests, range)
  const remaining = granted - used

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">연차/근태</span>
            <h1>연차·근태 관리</h1>
          </div>
        </div>

        <div className="leave-summary">
          <div className="leave-summary__card">
            <span>근속 기간</span>
            <strong>{tenureLabel(staff.hire_date)}</strong>
          </div>
          <div className="leave-summary__card">
            <span>올해 부여 연차</span>
            <strong>{granted}일</strong>
          </div>
          <div className="leave-summary__card">
            <span>사용 연차</span>
            <strong>{used}일</strong>
          </div>
          <div className="leave-summary__card">
            <span>잔여 연차</span>
            <strong>{remaining}일</strong>
          </div>
        </div>

        <h2 className="hours-section-title">연차/근태 신청</h2>
        <form onSubmit={onSubmit} className="hours-form">
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {leaveTypeOptionLabel(t.value)}
              </option>
            ))}
          </select>
          <input type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <input type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          <input
            type="text"
            maxLength={100}
            placeholder="사유 (선택)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '신청 중…' : '신청'}
          </button>
        </form>
        {error && <p className="auth-form__error">{error}</p>}

        <h2 className="hours-section-title">신청 내역</h2>
        <div className="admin-table__wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>유형</th>
                <th>기간</th>
                <th>차감</th>
                <th>사유</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{leaveTypeLabel(r.leave_type)}</td>
                  <td>
                    {formatDateTime(r.start_at)} ~ {formatDateTime(r.end_at)}
                  </td>
                  <td>{formatDeduction(r)}</td>
                  <td>{r.reason || '-'}</td>
                  <td>
                    <span className={`status-badge status-badge--${r.status}`}>{statusLabel(r.status)}</span>
                    {r.status === 'rejected' && r.reject_reason && (
                      <div className="status-badge__note">{r.reject_reason}</div>
                    )}
                  </td>
                  <td className="admin-table__actions">
                    {r.status === 'pending' && (
                      <button type="button" className="link-btn link-btn--danger" onClick={() => cancelRequest(r.id)}>
                        취소
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="board-empty">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default StaffLeavePage
