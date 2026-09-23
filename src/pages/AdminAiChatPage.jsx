import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import AdminNav from '../components/AdminNav.jsx'

const MODEL_OPTIONS = [
  { value: 'claude-opus-5', label: 'Claude Opus 5 (가장 똑똑함)' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (균형)' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (빠름)' },
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

function AdminAiChatPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [draftModel, setDraftModel] = useState('claude-opus-5')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const threadRef = useRef(null)

  const callApi = async (method, { query = '', body } = {}) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch(`/api/ai-chat${query}`, {
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

  const loadConversations = async () => {
    setLoadingList(true)
    setListError('')
    try {
      const json = await callApi('GET')
      setConversations(json.conversations)
    } catch (err) {
      setListError(err.message)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    if (isAdmin) loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  const selectConversation = async (id) => {
    setCurrentConversationId(id)
    setMessages([])
    setSendError('')
    setLoadingMessages(true)
    try {
      const json = await callApi('GET', { query: `?id=${id}` })
      setMessages(json.messages)
    } catch (err) {
      setListError(err.message)
    }
    setLoadingMessages(false)
  }

  const newConversation = () => {
    setCurrentConversationId(null)
    setMessages([])
    setInput('')
    setSendError('')
  }

  const deleteConversation = async (id) => {
    if (!window.confirm('이 대화를 삭제할까요?')) return
    try {
      await callApi('DELETE', { query: `?id=${id}` })
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversationId === id) newConversation()
    } catch (err) {
      setListError(err.message)
    }
  }

  const onSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSendError('')
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text, pending: true }])
    setInput('')
    setSending(true)

    try {
      const json = await callApi('POST', {
        body: { conversationId: currentConversationId, message: text, model: draftModel },
      })
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: tempId, role: 'user', content: text },
        json.reply,
      ])
      if (!currentConversationId) {
        setCurrentConversationId(json.conversation.id)
      }
      setConversations((prev) => [json.conversation, ...prev.filter((c) => c.id !== json.conversation.id)])
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(text)
      setSendError(err.message)
    }
    setSending(false)
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

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null

  return (
    <section className="section board-page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">관리자</span>
            <h1>AI 챗봇</h1>
          </div>
        </div>

        <AdminNav />

        <p className="local-news__desc">Claude(Anthropic)와 자유롭게 대화할 수 있는 관리자 전용 도구입니다.</p>

        {listError && <p className="auth-form__error">{listError}</p>}

        <div className="ai-layout">
          <aside className="ai-sidebar">
            <button type="button" className="ai-sidebar__new" onClick={newConversation}>
              + 새 대화
            </button>
            <ul className="ai-sidebar__list">
              {loadingList && (
                <li className="ai-sidebar__item">
                  <span className="ai-sidebar__item-title">불러오는 중…</span>
                </li>
              )}
              {!loadingList && conversations.length === 0 && (
                <li className="ai-sidebar__item">
                  <span className="ai-sidebar__item-title">대화 내역이 없습니다.</span>
                </li>
              )}
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`ai-sidebar__item ${currentConversationId === c.id ? 'is-active' : ''}`}
                    onClick={() => selectConversation(c.id)}
                  >
                    <span className="ai-sidebar__item-title">{c.title}</span>
                    <span className="ai-sidebar__item-date">{formatDateTime(c.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="ai-main">
            <div className="ai-chat-toolbar">
              {!currentConversationId ? (
                <select value={draftModel} onChange={(e) => setDraftModel(e.target.value)}>
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <span className="hours-toolbar__total" style={{ marginRight: 'auto' }}>
                    {MODEL_OPTIONS.find((m) => m.value === currentConversation?.model)?.label ||
                      currentConversation?.model}
                  </span>
                  <button
                    type="button"
                    className="link-btn link-btn--danger"
                    onClick={() => deleteConversation(currentConversationId)}
                  >
                    대화 삭제
                  </button>
                </>
              )}
            </div>

            <div className="ai-chat-thread" ref={threadRef}>
              {loadingMessages && <p className="board-empty">불러오는 중…</p>}
              {!loadingMessages && messages.length === 0 && (
                <p className="board-empty">메시지를 입력해 대화를 시작하세요.</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`ai-chat-msg ai-chat-msg--${m.role} ${m.pending ? 'ai-chat-msg--pending' : ''}`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            {sendError && <p className="auth-form__error">{sendError}</p>}

            <form onSubmit={onSend} className="ai-chat-form">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? '전송 중…' : '전송'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminAiChatPage
