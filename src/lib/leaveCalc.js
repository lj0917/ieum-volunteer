export const LEAVE_TYPES = [
  { value: 'annual', label: '연차', deduct: 1 },
  { value: 'half', label: '반차', deduct: 0.5 },
  { value: 'quarter', label: '반반차', deduct: 0.25 },
  { value: 'hourly', label: '시간차', deduct: null },
  { value: 'business_trip', label: '출장', deduct: 0 },
]

const LEAVE_TYPE_HINTS = {
  annual: '1일(8시간)',
  half: '4시간',
  quarter: '2시간',
  hourly: '1시간 단위',
  business_trip: '연차 차감 없음',
}

export function leaveTypeLabel(value) {
  return LEAVE_TYPES.find((t) => t.value === value)?.label || value
}

export function leaveTypeOptionLabel(value) {
  const hint = LEAVE_TYPE_HINTS[value]
  return hint ? `${leaveTypeLabel(value)} (${hint})` : leaveTypeLabel(value)
}

export function isHourlyType(value) {
  return value === 'hourly'
}

export function deductDaysFor(value) {
  return LEAVE_TYPES.find((t) => t.value === value)?.deduct ?? 0
}

export function hoursBetween(startAt, endAt) {
  return (new Date(endAt) - new Date(startAt)) / (60 * 60 * 1000)
}

// 시간차는 실제 사용 시간(1시간 단위)을 8시간 기준 일수로 환산해 차감, 그 외 유형은 고정 차감일수 사용
export function deductDaysForRequest(leaveType, startAt, endAt) {
  if (isHourlyType(leaveType)) {
    return Math.round((hoursBetween(startAt, endAt) / 8) * 1000) / 1000
  }
  return deductDaysFor(leaveType)
}

// 시간차는 "N시간"으로, 그 외 유형은 "N일"로 표기
export function formatDeduction(request) {
  if (isHourlyType(request.leave_type)) {
    return `${hoursBetween(request.start_at, request.end_at)}시간`
  }
  return `${request.deduct_days}일`
}

const STATUS_LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

function monthsBetween(from, to) {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return to.getDate() < from.getDate() ? months - 1 : months
}

// 입사일 기준 근속 기간 (예: "2년 3개월")
export function tenureLabel(hireDate, asOf = new Date()) {
  const months = Math.max(0, monthsBetween(new Date(hireDate), asOf))
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return `${years}년 ${remMonths}개월`
}

// 근로기준법 60조 기준 연차 부여일수(입사일 기준, 1년 미만은 개근 월 1일, 1년 이상은 15일+가산)
export function annualGrantDays(hireDate, asOf = new Date()) {
  const months = Math.max(0, monthsBetween(new Date(hireDate), asOf))
  if (months < 12) return Math.min(11, months)
  const years = Math.floor(months / 12)
  return Math.min(25, 15 + Math.floor((years - 1) / 2))
}

// 입사일 기준 현재 연차 회계 연도 구간 [start, end)
export function currentLeaveYearRange(hireDate, asOf = new Date()) {
  const hire = new Date(hireDate)
  const anniversary = new Date(asOf.getFullYear(), hire.getMonth(), hire.getDate())
  if (anniversary > asOf) anniversary.setFullYear(anniversary.getFullYear() - 1)
  const nextAnniversary = new Date(anniversary)
  nextAnniversary.setFullYear(anniversary.getFullYear() + 1)
  return { start: anniversary, end: nextAnniversary }
}

function addYears(date, years) {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

// 입사일 기준 k번째 연차 회계연도(0-based, 0=입사 1년차)의 부여일수
export function grantForYearIndex(hireDate, k) {
  if (k <= 0) return 11
  return annualGrantDays(hireDate, addYears(new Date(hireDate), k))
}

// 현재 시점이 입사 후 몇 번째 연차 회계연도(0-based)에 속하는지
export function currentYearIndex(hireDate, asOf = new Date()) {
  const months = Math.max(0, monthsBetween(new Date(hireDate), asOf))
  return Math.floor(months / 12)
}

// 익년(다음 회계연도)에 부여될 연차일수
export function nextYearGrant(hireDate, asOf = new Date()) {
  return grantForYearIndex(hireDate, currentYearIndex(hireDate, asOf) + 1)
}

// 입사일 기준 k번째 연차 회계연도 구간 [start, end)와 부여일수
export function yearPeriodForIndex(hireDate, k) {
  const hire = new Date(hireDate)
  return { index: k, start: addYears(hire, k), end: addYears(hire, k + 1), granted: grantForYearIndex(hireDate, k) }
}

// 입사일부터 현재까지의 연차 회계연도별 구간 목록(오래된 순)
export function leaveYearHistory(hireDate, asOf = new Date()) {
  const maxIndex = currentYearIndex(hireDate, asOf)
  const years = []
  for (let k = 0; k <= maxIndex; k++) years.push(yearPeriodForIndex(hireDate, k))
  return years
}

export function roundDays(n) {
  return Math.round(n * 1000) / 1000
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 해당 연차 회계 연도에 속하는 승인된 신청들의 차감 일수 합계
export function usedDaysInRange(requests, range) {
  return requests
    .filter((r) => r.status === 'approved')
    .filter((r) => {
      const start = new Date(r.start_at)
      return start >= range.start && start < range.end
    })
    .reduce((sum, r) => sum + Number(r.deduct_days || 0), 0)
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
