import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

const QUESTION_TYPES = [
  { value: 'noul', label: '예/아니오 판정' },
  { value: 'choice', label: '객관식 분류' },
  { value: 'score', label: '점수 평가' },
]

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function emptyOptions() {
  return [
    { key: '', desc: '' },
    { key: '', desc: '' },
  ]
}

function emptyLevels() {
  return ['', '']
}

function AnswerView({ evaluation }) {
  if (evaluation.error) {
    return <p className="auth-form__error">{evaluation.error}</p>
  }

  const a = evaluation.answer
  if (!a) return <p className="board-empty">결과가 없습니다.</p>

  if (a.type === 'noul') {
    const pct = Math.round((a.noul ?? 0) * 100)
    return (
      <div className="ai-answer-box">
        <p>
          예일 확률: <strong>{pct}%</strong> ({pct >= 50 ? '예' : '아니오'})
        </p>
      </div>
    )
  }

  if (a.type === 'choice') {
    return (
      <div className="ai-answer-box">
        <p>
          선택: <strong>{a.choice}</strong> (확신도 {Math.round((a.confidence ?? 0) * 100)}%)
        </p>
        <ul>
          {Object.entries(a.probabilities || {}).map(([k, v]) => (
            <li key={k}>
              {k}: {Math.round(v * 100)}%
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (a.type === 'score') {
    const legendLabel = a.legend?.[String(Math.round(a.score))]
    return (
      <div className="ai-answer-box">
        <p>
          점수: <strong>{a.score}</strong>
          {legendLabel ? ` (${legendLabel})` : ''} (확신도 {Math.round((a.confidence ?? 0) * 100)}%)
        </p>
        <ul>
          {Object.entries(a.probabilities || {}).map(([k, v]) => (
            <li key={k}>
              {a.legend?.[k] || k}: {Math.round(v * 100)}%
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return null
}

function AdminAiPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [evaluations, setEvaluations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [title, setTitle] = useState('')
  const [stateText, setStateText] = useState('')
  const [questionType, setQuestionType] = useState('noul')
  const [instructions, setInstructions] = useState('')
  const [trueDesc, setTrueDesc] = useState('조건을 만족함')
  const [falseDesc, setFalseDesc] = useState('조건을 만족하지 않음')
  const [options, setOptions] = useState(emptyOptions())
  const [levels, setLevels] = useState(emptyLevels())

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const callApi = async (method, { query = '', body } = {}) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch(`/api/ai-evaluate${query}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || '요청에 실패했습니다.')
    return json
  }

  const loadEvaluations = async () => {
    setLoadingList(true)
    setListError('')
    try {
      const json = await callApi('GET')
      setEvaluations(json.evaluations)
    } catch (e) {
      setListError(e.message)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    if (isAdmin) loadEvaluations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const resetForm = () => {
    setSelectedId(null)
    setTitle('')
    setStateText('')
    setQuestionType('noul')
    setInstructions('')
    setTrueDesc('조건을 만족함')
    setFalseDesc('조건을 만족하지 않음')
    setOptions(emptyOptions())
    setLevels(emptyLevels())
    setSubmitError('')
  }

  const selected = evaluations.find((e) => e.id === selectedId) || null

  const updateOption = (idx, field, value) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))
  }
  const addOption = () => setOptions((prev) => [...prev, { key: '', desc: '' }])
  const removeOption = (idx) => setOptions((prev) => prev.filter((_, i) => i !== idx))

  const updateLevel = (idx, value) => {
    setLevels((prev) => prev.map((l, i) => (i === idx ? value : l)))
  }
  const addLevel = () => setLevels((prev) => [...prev, ''])
  const removeLevel = (idx) => setLevels((prev) => prev.filter((_, i) => i !== idx))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!stateText.trim() || !instructions.trim()) {
      setSubmitError('평가할 내용과 질문 내용을 입력해주세요.')
      return
    }

    let criteria
    if (questionType === 'noul') {
      criteria = { true: trueDesc.trim() || '조건을 만족함', false: falseDesc.trim() || '조건을 만족하지 않음' }
    } else if (questionType === 'choice') {
      const valid = options.filter((o) => o.key.trim())
      if (valid.length < 2) {
        setSubmitError('선택지를 2개 이상 입력해주세요.')
        return
      }
      criteria = Object.fromEntries(valid.map((o) => [o.key.trim(), o.desc.trim()]))
    } else {
      const valid = levels.map((l) => l.trim()).filter(Boolean)
      if (valid.length < 2) {
        setSubmitError('점수 단계를 2개 이상 입력해주세요.')
        return
      }
      criteria = valid
    }

    setSubmitting(true)
    try {
      const json = await callApi('POST', {
        body: { title, state: stateText, questionType, instructions, criteria },
      })
      setEvaluations((prev) => [json.evaluation, ...prev])
      setSelectedId(json.evaluation.id)
    } catch (err) {
      setSubmitError(err.message)
    }
    setSubmitting(false)
  }

  const onDelete = async (id) => {
    if (!window.confirm('이 판정 기록을 삭제할까요?')) return
    try {
      await callApi('DELETE', { query: `?id=${id}` })
      setEvaluations((prev) => prev.filter((e) => e.id !== id))
      if (selectedId === id) resetForm()
    } catch (err) {
      setListError(err.message)
    }
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
            <h1>AI 판정 도구</h1>
          </div>
        </div>

        <AdminNav />

        <p className="local-news__desc">
          typesafe.ai(Jev)는 자유 대화가 아니라, 입력한 내용을 예/아니오·객관식·점수 중 하나의 형식으로 확률과 함께
          판정해주는 도구입니다.
        </p>

        {listError && <p className="auth-form__error">{listError}</p>}

        <div className="ai-layout">
          <aside className="ai-sidebar">
            <button type="button" className="ai-sidebar__new" onClick={resetForm}>
              + 새 판정
            </button>
            <ul className="ai-sidebar__list">
              {loadingList && (
                <li className="ai-sidebar__item">
                  <span className="ai-sidebar__item-title">불러오는 중…</span>
                </li>
              )}
              {!loadingList && evaluations.length === 0 && (
                <li className="ai-sidebar__item">
                  <span className="ai-sidebar__item-title">기록이 없습니다.</span>
                </li>
              )}
              {evaluations.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    className={`ai-sidebar__item ${selectedId === ev.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedId(ev.id)}
                  >
                    <span className="ai-sidebar__item-title">{ev.title}</span>
                    <span className="ai-sidebar__item-date">{formatDateTime(ev.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="ai-main">
            {selected ? (
              <div className="ai-detail">
                <div className="ai-detail__block">
                  <h3>평가한 내용</h3>
                  <p>{selected.state}</p>
                </div>
                <div className="ai-detail__block">
                  <h3>질문</h3>
                  <p>{selected.instructions}</p>
                </div>
                <div>
                  <h3 className="hours-section-title" style={{ margin: '0 0 10px' }}>
                    결과
                  </h3>
                  <AnswerView evaluation={selected} />
                </div>
                <div>
                  <button type="button" className="link-btn link-btn--danger" onClick={() => onDelete(selected.id)}>
                    이 기록 삭제
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="ai-form">
                <input
                  type="text"
                  maxLength={80}
                  placeholder="제목 (선택, 비우면 평가 내용 앞부분을 사용합니다)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  required
                  rows={5}
                  placeholder="평가할 내용을 입력하세요"
                  value={stateText}
                  onChange={(e) => setStateText(e.target.value)}
                />
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="질문 내용 (예: 이 글은 긴급한가요?)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />

                {questionType === 'noul' && (
                  <>
                    <input
                      type="text"
                      placeholder="'예'에 해당하는 조건 설명"
                      value={trueDesc}
                      onChange={(e) => setTrueDesc(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="'아니오'에 해당하는 조건 설명"
                      value={falseDesc}
                      onChange={(e) => setFalseDesc(e.target.value)}
                    />
                  </>
                )}

                {questionType === 'choice' && (
                  <>
                    {options.map((o, idx) => (
                      <div className="ai-criteria-row" key={idx}>
                        <input
                          type="text"
                          placeholder={`선택지 ${idx + 1} 이름`}
                          value={o.key}
                          onChange={(e) => updateOption(idx, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="설명"
                          value={o.desc}
                          onChange={(e) => updateOption(idx, 'desc', e.target.value)}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            className="link-btn link-btn--danger"
                            onClick={() => removeOption(idx)}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addOption}>
                      선택지 추가
                    </button>
                  </>
                )}

                {questionType === 'score' && (
                  <>
                    {levels.map((l, idx) => (
                      <div className="ai-criteria-row" key={idx}>
                        <input
                          type="text"
                          placeholder={`${idx}단계 설명`}
                          value={l}
                          onChange={(e) => updateLevel(idx, e.target.value)}
                        />
                        {levels.length > 2 && (
                          <button type="button" className="link-btn link-btn--danger" onClick={() => removeLevel(idx)}>
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={addLevel}>
                      단계 추가
                    </button>
                  </>
                )}

                {submitError && <p className="auth-form__error">{submitError}</p>}

                <div className="board-form__actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? '판정 중…' : '판정 요청'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminAiPage
