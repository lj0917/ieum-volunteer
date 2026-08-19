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
  const [activityItems, setActivityItems] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedActivityItemId, setSelectedActivityItemId] = useState('')

  const [bulkActivityItemId, setBulkActivityItemId] = useState('')
  const [bulkDate, setBulkDate] = useState(todayInputValue())
  const [bulkHours, setBulkHours] = useState('')
  const [bulkNote, setBulkNote] = useState('')
  const [participantIds, setParticipantIds] = useState([])
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editActivityItemId, setEditActivityItemId] = useState('')
  const [editHours, setEditHours] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError('')
    const [
      { data: memberData, error: memberError },
      { data: hourData, error: hourError },
      { data: itemData, error: itemError },
    ] = await Promise.all([
      supabase.from('profiles').select('id, display_name, email').eq('status', 'approved').order('display_name'),
      supabase.from('volunteer_hours').select('*').order('activity_date', { ascending: false }),
      supabase.from('activity_items').select('*').order('name'),
    ])
    if (memberError || hourError || itemError) setError('데이터를 불러오지 못했습니다.')
    else {
      setMembers(memberData)
      setRecords(hourData)
      setActivityItems(itemData)
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

  const filteredRecords = records.filter((r) => {
    if (selectedMemberId && r.member_id !== selectedMemberId) return false
    if (selectedActivityItemId && r.activity_item_id !== selectedActivityItemId) return false
    return true
  })

  const totalHours = filteredRecords.reduce((sum, r) => sum + Number(r.hours), 0)

  const toggleParticipant = (memberId) => {
    setParticipantIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const onBulkSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!bulkActivityItemId) {
      setError('활동 항목을 선택해주세요.')
      return
    }
    if (!bulkHours) {
      setError('시간을 입력해주세요.')
      return
    }
    if (participantIds.length === 0) {
      setError('참여한 회원을 한 명 이상 선택해주세요.')
      return
    }

    const activityItem = activityItems.find((a) => a.id === bulkActivityItemId)

    setSaving(true)
    const { error: insertError } = await supabase.from('volunteer_hours').insert(
      participantIds.map((memberId) => ({
        member_id: memberId,
        activity_date: bulkDate,
        activity_name: activityItem?.name || '',
        activity_item_id: bulkActivityItemId,
        hours: Number(bulkHours),
        note: bulkNote.trim() || null,
      })),
    )
    setSaving(false)

    if (insertError) {
      setError('등록에 실패했습니다.')
      return
    }

    setBulkHours('')
    setBulkNote('')
    setParticipantIds([])
    loadAll()
  }

  const deleteRecord = async (id) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return
    await supabase.from('volunteer_hours').delete().eq('id', id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (record) => {
    setEditingId(record.id)
    setEditDate(record.activity_date)
    setEditActivityItemId(record.activity_item_id || '')
    setEditHours(String(record.hours))
    setEditNote(record.note || '')
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id) => {
    if (!editHours) {
      setError('시간을 입력해주세요.')
      return
    }
    const activityItem = activityItems.find((a) => a.id === editActivityItemId)

    setEditSaving(true)
    setError('')
    const { error: updateError } = await supabase
      .from('volunteer_hours')
      .update({
        activity_date: editDate,
        activity_item_id: editActivityItemId || null,
        activity_name: activityItem?.name || records.find((r) => r.id === id)?.activity_name || '',
        hours: Number(editHours),
        note: editNote.trim() || null,
      })
      .eq('id', id)
    setEditSaving(false)

    if (updateError) {
      setError('수정에 실패했습니다.')
      return
    }

    setEditingId(null)
    loadAll()
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
    const memberLabel = selectedMemberId ? memberNameById[selectedMemberId] || '회원' : '전체'
    const itemLabel = selectedActivityItemId
      ? activityItems.find((a) => a.id === selectedActivityItemId)?.name || '활동'
      : null
    const label = itemLabel ? `${memberLabel}_${itemLabel}` : memberLabel
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
            <h2 className="hours-section-title">활동 인원·시간 일괄 등록</h2>
            {activityItems.length === 0 ? (
              <p className="board-empty">
                등록된 활동 항목이 없습니다. 먼저 활동 항목 관리에서 항목을 추가해주세요.
              </p>
            ) : (
              <form onSubmit={onBulkSubmit} className="hours-form hours-form--bulk">
                <select value={bulkActivityItemId} onChange={(e) => setBulkActivityItemId(e.target.value)}>
                  <option value="">활동 항목 선택</option>
                  {activityItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input type="date" required value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  placeholder="시간"
                  value={bulkHours}
                  onChange={(e) => setBulkHours(e.target.value)}
                />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="비고 (선택)"
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                />

                <div className="member-check-list">
                  {members.map((m) => (
                    <label key={m.id} className="member-check-list__item">
                      <input
                        type="checkbox"
                        checked={participantIds.includes(m.id)}
                        onChange={() => toggleParticipant(m.id)}
                      />
                      {m.display_name}
                    </label>
                  ))}
                  {members.length === 0 && <p className="board-empty">승인된 회원이 없습니다.</p>}
                </div>

                <div className="board-form__actions">
                  <span className="hours-toolbar__total">{participantIds.length}명 선택됨</span>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '등록 중…' : '일괄 등록'}
                  </button>
                </div>
              </form>
            )}

            <h2 className="hours-section-title">등록 기록</h2>
            <div className="hours-toolbar">
              <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                <option value="">회원 전체</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} ({m.email})
                  </option>
                ))}
              </select>
              <select value={selectedActivityItemId} onChange={(e) => setSelectedActivityItemId(e.target.value)}>
                <option value="">활동 항목 전체</option>
                {activityItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="hours-toolbar__total">합계 {totalHours.toFixed(1)}시간</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={onDownload}>
                CSV 다운로드
              </button>
            </div>

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
                  {filteredRecords.map((r) =>
                    editingId === r.id ? (
                      <tr key={r.id}>
                        {!selectedMemberId && <td>{memberNameById[r.member_id] || '(탈퇴한 회원)'}</td>}
                        <td>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                        </td>
                        <td>
                          <select value={editActivityItemId} onChange={(e) => setEditActivityItemId(e.target.value)}>
                            <option value="">(직접입력 유지)</option>
                            {activityItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editHours}
                            onChange={(e) => setEditHours(e.target.value)}
                          />
                        </td>
                        <td>
                          <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                        </td>
                        <td className="admin-table__actions">
                          <button
                            type="button"
                            className="link-btn"
                            disabled={editSaving}
                            onClick={() => saveEdit(r.id)}
                          >
                            저장
                          </button>
                          <button type="button" className="link-btn" onClick={cancelEdit}>
                            취소
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.id}>
                        {!selectedMemberId && <td>{memberNameById[r.member_id] || '(탈퇴한 회원)'}</td>}
                        <td>{formatDate(r.activity_date)}</td>
                        <td>{r.activity_name}</td>
                        <td>{r.hours}</td>
                        <td>{r.note || '-'}</td>
                        <td className="admin-table__actions">
                          <button type="button" className="link-btn" onClick={() => startEdit(r)}>
                            수정
                          </button>
                          <button
                            type="button"
                            className="link-btn link-btn--danger"
                            onClick={() => deleteRecord(r.id)}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
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
