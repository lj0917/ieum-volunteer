export const LEAVE_TYPES = [
  { value: 'annual', label: '연차', deduct: 1 },
  { value: 'half', label: '반차', deduct: 0.5 },
  { value: 'quarter', label: '반반차', deduct: 0.25 },
  { value: 'business_trip', label: '출장', deduct: 0 },
]

export function leaveTypeLabel(value) {
  return LEAVE_TYPES.find((t) => t.value === value)?.label || value
}

export function deductDaysFor(value) {
  return LEAVE_TYPES.find((t) => t.value === value)?.deduct ?? 0
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
