import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'
import {
  annualGrantDays,
  currentLeaveYearRange,
  formatDateTime,
  formatDeduction,
  leaveTypeLabel,
  statusLabel,
  tenureLabel,
  usedDaysInRange,
} from '../lib/leaveCalc.js'

function todayInputValue() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function AdminLeavePage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [staffList, setStaffList] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newStaffId, setNewStaffId] = useState('')
  const [newHireDate, setNewHireDate] = useState(todayInputValue())
  const [newPosition, setNewPosition] = useState('')
  const [saving, setSaving] = useState(false)

  const [statusFilter, setStatusFilter] = useState('pending')
  const [staffFilter, setStaffFilter] = useState('')

  const loadAll = async () => {
    setLoading(true)
    setError('')
    const [
      { data: profileData, error: profileError },
      { data: staffData, error: staffError },
      { data: requestData, error: requestError },
    ] = await Promise.all([
      supabase.from('profiles').select('id, display_name, email').eq('status', 'approved').order('display_name'),
      supabase.from('staff').select('*').order('hire_date'),
      supabase.from('leave_requests').select('*').order('start_at', { ascending: false }),
    ])
    if (profileError || staffError || requestError) setError('데이터를 불러오지 못했습니다.')
    else {
      setProfiles(profileData)
      setStaffList(staffData)
      setRequests(requestData)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadAll()
  }, [isAdmin])

  const profileNameById = useMemo(() => {
    const map = {}
    profiles.forEach((p) => {
      map[p.id] = p
    })
    return map
  }, [profiles])

  const availableProfiles = profiles.filter((p) => !staffList.some((s) => s.id === p.id))

  const onAddStaff = async (e) => {
    e.preventDefault()
    setError('')
    if (!newStaffId || !newHireDate) {
      setError('직원과 입사일을 선택해주세요.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase
      .from('staff')
      .insert({ id: newStaffId, hire_date: newHireDate, position: newPosition.trim() || null })
    setSaving(false)
    if (insertError) {
      setError('직원 등록에 실패했습니다.')
      return
    }
    setNewStaffId('')
    setNewPosition('')
    loadAll()
  }

  const toggleActive = async (staffRow) => {
    await supabase.from('staff').update({ active: !staffRow.active }).eq('id', staffRow.id)
    loadAll()
  }

  const removeStaff = async (staffId) => {
    if (!window.confirm('이 직원을 목록에서 삭제할까요? 신청 내역도 함께 삭제됩니다.')) return
    await supabase.from('staff').delete().eq('id', staffId)
    loadAll()
  }

  const approveRequest = async (id) => {
    await supabase
      .from('leave_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    loadAll()
  }

  const rejectRequest = async (id) => {
    const reason = window.prompt('반려 사유를 입력해주세요.')
    if (reason === null) return
    await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason.trim() || null,
      })
      .eq('id', id)
    loadAll()
  }

  const deleteRequest = async (id) => {
    if (!window.confirm('이 신청을 삭제할까요?')) return
    await supabase.from('leave_requests').delete().eq('id', id)
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  const filteredRequests = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (staffFilter && r.staff_id !== staffFilter) return false
    return true
  })

  if (authLoading) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">불러오는 중…</p>
        </div>
      </section>
    )
  }

  if (!user || !isAdmin) {
    return (
      <section className="section board-page">
        <div className="container">
          <p className="board-empty">관리자만 접근할 수 있습니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">관리자</span>
            <h1>연차/근태 관리</h1>
          </div>
        </div>

        <AdminNav />

        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <>
            <h2 className="hours-section-title">사무국 직원 관리</h2>
            <form onSubmit={onAddStaff} className="hours-form">
              <select value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)}>
                <option value="">직원으로 등록할 회원 선택</option>
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} ({p.email})
                  </option>
                ))}
              </select>
              <input type="date" required value={newHireDate} onChange={(e) => setNewHireDate(e.target.value)} />
              <input
                type="text"
                maxLength={40}
                placeholder="직책 (선택)"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '등록 중…' : '직원 등록'}
              </button>
            </form>

            <div className="admin-table__wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>입사일</th>
                    <th>근속</th>
                    <th>올해 부여</th>
                    <th>사용</th>
                    <th>잔여</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => {
                    const profile = profileNameById[s.id]
                    const range = currentLeaveYearRange(s.hire_date)
                    const staffRequests = requests.filter((r) => r.staff_id === s.id)
                    const granted = annualGrantDays(s.hire_date)
                    const used = usedDaysInRange(staffRequests, range)
                    return (
                      <tr key={s.id}>
                        <td>{profile?.display_name || '(탈퇴한 회원)'}</td>
                        <td>{profile?.email || '-'}</td>
                        <td>{s.hire_date}</td>
                        <td>{tenureLabel(s.hire_date)}</td>
                        <td>{granted}일</td>
                        <td>{used}일</td>
                        <td>{granted - used}일</td>
                        <td>
                          <button type="button" className="link-btn" onClick={() => toggleActive(s)}>
                            {s.active ? '재직중' : '퇴직'}
                          </button>
                        </td>
                        <td className="admin-table__actions">
                          <button type="button" className="link-btn link-btn--danger" onClick={() => removeStaff(s.id)}>
                            삭제
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {staffList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="board-empty">
                        등록된 직원이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="hours-section-title">연차/근태 신청 승인</h2>
            <div className="hours-toolbar">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">전체 상태</option>
                <option value="pending">대기</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
              </select>
              <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                <option value="">직원 전체</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {profileNameById[s.id]?.display_name || '(탈퇴한 회원)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-table__wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>유형</th>
                    <th>기간</th>
                    <th>차감</th>
                    <th>사유</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{profileNameById[r.staff_id]?.display_name || '(탈퇴한 회원)'}</td>
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
                          <>
                            <button type="button" className="link-btn" onClick={() => approveRequest(r.id)}>
                              승인
                            </button>
                            <button type="button" className="link-btn link-btn--danger" onClick={() => rejectRequest(r.id)}>
                              반려
                            </button>
                          </>
                        )}
                        <button type="button" className="link-btn link-btn--danger" onClick={() => deleteRequest(r.id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="board-empty">
                        신청 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default AdminLeavePage
