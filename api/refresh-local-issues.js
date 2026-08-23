import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const BUKGU_URL = 'https://bukgu.gwangju.kr/board.es?mid=a10201010000&bid=0114'
const NAVER_QUERY = '광주 북구'

function getAdminClient() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function isAuthorized(req, adminClient) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return false

  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true

  const { data: userData, error } = await adminClient.auth.getUser(token)
  if (error || !userData?.user) return false

  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle()

  return Boolean(profile?.is_admin)
}

function stripHtml(str) {
  return str
    .replace(/<\/?b>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .trim()
}

async function fetchBukguNotices() {
  const res = await fetch(BUKGU_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IeumVolunteerBot/1.0' },
  })
  if (!res.ok) throw new Error(`bukgu fetch failed: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const rows = []
  $('li.title').each((_, el) => {
    const $li = $(el)
    const $a = $li.find('a').first()
    const href = $a.attr('href') || ''
    const match = href.match(/list_no=(\d+)/)
    if (!match) return

    const listNo = match[1]
    const title = ($a.attr('title') || $a.text()).trim()
    const siblings = $li.parent('ul').children('li')
    const department = siblings.eq(2).text().trim()
    const dateText = siblings.eq(3).text().trim()

    rows.push({
      source: 'bukgu',
      external_id: listNo,
      title,
      category: department || null,
      published_at: /^\d{4}\/\d{2}\/\d{2}$/.test(dateText) ? dateText.replaceAll('/', '-') : null,
      url: `https://bukgu.gwangju.kr/board.es?mid=a10201010000&bid=0114&act=view&list_no=${listNo}`,
    })
  })
  return rows
}

async function fetchNaverNews() {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) return []

  const params = new URLSearchParams({ query: NAVER_QUERY, display: '30', sort: 'date' })
  const res = await fetch(`https://openapi.naver.com/v1/search/news.json?${params}`, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`naver fetch failed: ${res.status} ${body}`)
  }
  const json = await res.json()

  return (json.items || []).map((item) => {
    const pubDate = new Date(item.pubDate)
    return {
      source: 'naver',
      external_id: item.link,
      title: stripHtml(item.title),
      category: null,
      published_at: Number.isNaN(pubDate.getTime()) ? null : pubDate.toISOString().slice(0, 10),
      url: item.originallink || item.link,
    }
  })
}

export default async function handler(req, res) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: '서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' })
    return
  }

  const adminClient = getAdminClient()
  const authorized = await isAuthorized(req, adminClient)
  if (!authorized) {
    res.status(403).json({ error: '권한이 없습니다.' })
    return
  }

  const [bukguResult, naverResult] = await Promise.allSettled([fetchBukguNotices(), fetchNaverNews()])

  const bukguRows = bukguResult.status === 'fulfilled' ? bukguResult.value : []
  const naverRows = naverResult.status === 'fulfilled' ? naverResult.value : []
  const rows = [...bukguRows, ...naverRows]

  const errors = {}
  if (bukguResult.status === 'rejected') errors.bukgu = bukguResult.reason?.message || String(bukguResult.reason)
  if (naverResult.status === 'rejected') errors.naver = naverResult.reason?.message || String(naverResult.reason)

  if (rows.length > 0) {
    const { error: upsertError } = await adminClient
      .from('local_issues')
      .upsert(rows, { onConflict: 'source,external_id', ignoreDuplicates: false })

    if (upsertError) {
      res.status(500).json({ error: '저장에 실패했습니다.', detail: upsertError.message })
      return
    }
  }

  if (Object.keys(errors).length > 0 && rows.length === 0) {
    res.status(500).json({ error: '가져오기에 실패했습니다.', detail: JSON.stringify(errors) })
    return
  }

  res.status(200).json({
    ok: true,
    count: rows.length,
    bukgu: bukguRows.length,
    naver: naverRows.length,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  })
}
