import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { downloadCsv } from '../lib/csv.js'
import AdminNav from '../components/AdminNav.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function todayInputValue() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function AdminHoursPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [members, setMembers] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')

  const [activityDate, setActivityDate] = useState(todayInputValue())
  const [activityName, setActivityName] = useState('')
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError('')
    const [{ data: memberData, error: memberError }, { data: hourData, error: hourError }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, email').eq('status', 'approved').order('display_name'),
      supabase.from('volunteer_hours').select('*').order('activity_date', { ascending: false }),
    ])
    if (memberError || hourError) setError('데이터를 불러오지 못했습니다.')
    else {
      setMembers(memberData)
      setRecords(hourData)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) loadAll()
  }, [isAdmin])

  const memberNameById = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      map[m.id] = m.display_name
    })
    return map
  }, [members])

  const filteredRecords = selectedMemberId
    ? records.filter((r) => r.member_id === selectedMemberId)
    : records

  const totalHours = filteredRecords.reduce((sum, r) => sum + Number(r.hours), 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedMemberId) {
      setError('먼저 회원을 선택해주세요.')
      return
    }
    if (!activityName.trim() || !hours) {
      setError('활동 내용과 시간을 입력해주세요.')
      return
    }

    setSaving(true)
    const { error: insertError } = await supabase.from('volunteer_hours').insert({
      member_id: selectedMemberId,
      activity_date: activityDate,
      activity_name: activityName.trim(),
      hours: Number(hours),
      note: note.trim() || null,
    })
    setSaving(false)

    if (insertError) {
      setError('등록에 실패했습니다.')
      return
    }

    setActivityName('')
    setHours('')
    setNote('')
    loadAll()
  }

  const deleteRecord = async (id) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return
    await supabase.from('volunteer_hours').delete().eq('id', id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const onDownload = () => {
    const headers = ['이름', '이메일', '날짜', '활동내용', '시간', '비고']
    const rows = filteredRecords.map((r) => {
      const member = members.find((m) => m.id === r.member_id)
      return [
        member?.display_name || memberNameById[r.member_id] || '(탈퇴한 회원)',
        member?.email || '',
        r.activity_date,
        r.activity_name,
        r.hours,
        r.note || '',
      ]
    })
    const label = selectedMemberId ? memberNameById[selectedMemberId] || '회원' : '전체'
    downloadCsv(`봉사시간_${label}_${todayInputValue()}.csv`, headers, rows)
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
            <h1>봉사시간 관리</h1>
          </div>
        </div>

        <AdminNav />

        {error && <p className="auth-form__error">{error}</p>}
        {loading && <p className="board-empty">불러오는 중…</p>}

        {!loading && (
          <>
            <div className="hours-toolbar">
              <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                <option value="">전체 보기</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} ({m.email})
                  </option>
                ))}
              </select>
              <span className="hours-toolbar__total">합계 {totalHours.toFixed(1)}시간</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={onDownload}>
                CSV 다운로드
              </button>
            </div>

            {selectedMemberId && (
              <form onSubmit={onSubmit} className="hours-form">
                <input
                  type="date"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                />
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="활동 내용"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  placeholder="시간"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="비고 (선택)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? '등록 중…' : '추가'}
                </button>
              </form>
            )}

            <div className="admin-table__wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    {!selectedMemberId && <th>이름</th>}
                    <th>날짜</th>
                    <th>활동내용</th>
                    <th>시간</th>
                    <th>비고</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r.id}>
                      {!selectedMemberId && <td>{memberNameById[r.member_id] || '(탈퇴한 회원)'}</td>}
                      <td>{formatDate(r.activity_date)}</td>
                      <td>{r.activity_name}</td>
                      <td>{r.hours}</td>
                      <td>{r.note || '-'}</td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          className="link-btn link-btn--danger"
                          onClick={() => deleteRecord(r.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={selectedMemberId ? 5 : 6} className="board-empty">
                        기록이 없습니다.
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

export default AdminHoursPage
