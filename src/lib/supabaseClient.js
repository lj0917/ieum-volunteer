import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. ' +
      '게시판·사진첩·로그인 기능이 동작하지 않습니다.',
  )
}

// 환경변수가 없어도 앱(특히 정적 소개 페이지)이 깨지지 않도록 더미 값으로 폴백한다.
// 실제 Supabase 호출은 각 페이지의 에러 처리에서 실패로 잡힌다.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
