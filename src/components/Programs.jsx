const PROGRAMS = [
  {
    tag: '가',
    icon: '🤝',
    title: '네트워크 구성 및 회의',
    meta: '정기 회의 2회 · 역량강화교육 1회',
    items: [
      '안전한 북구 조성을 위한 네트워크 구성',
      '사업 공유 및 점검을 위한 참여 단체 간 정기 회의',
      '교통안전, 학교폭력 및 사이버폭력 역량강화교육으로 구성원들의 정확한 안전 정보 이해 교육',
    ],
  },
  {
    tag: '나',
    icon: '🚸',
    title: '생활안전캠페인',
    meta: '연 2회 · 북구관내 중·고등학교',
    items: [
      '북구관내 중·고등학교 대상 안전캠페인 진행',
      '교통안전(횡단보도 이용, 스몸비, 무단횡단, 자전거 등) 예방 캠페인',
      '학교폭력 및 사이버폭력 예방 캠페인',
      '학부모회와 연계한 자살예방캠페인 진행',
      '참여봉사단체와 함께하는 캠페인 진행',
    ],
  },
  {
    tag: '다',
    icon: '🌍',
    title: '환경정화활동',
    meta: '연 2회 · 학교 및 지역사회 주변',
    items: [
      '북구관내 중·고등학교 및 지역사회 주변 쓰레기 줍기, 빗물받이 점검 및 정화 (하수구 확인 및 이물질 제거)',
      '활동 물품(장갑, 집게, 쓰레기 봉투 등) 지급',
      '활동 전 환경보호 및 안전교육 실시',
      '마을e척척 앱으로 빗물받이 현황 공유',
      '환경정화 지역 주변 위험요소 안전신문고 앱 활용',
    ],
  },
]

function Programs() {
  return (
    <section id="programs" className="section section-alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">주요 사업</span>
          <h2>이음봉사단이 하는 일</h2>
          <p>네트워크 구성부터 캠페인, 환경정화활동까지 — 이론과 실천을 결합한 체험 중심 활동입니다.</p>
        </div>

        <div className="programs-grid">
          {PROGRAMS.map((p) => (
            <article className="program-card" key={p.tag}>
              <div className="program-card__head">
                <span className="program-card__tag">{p.tag}</span>
                <span className="program-card__icon">{p.icon}</span>
              </div>
              <h3>{p.title}</h3>
              <p className="program-card__meta">{p.meta}</p>
              <ul>
                {p.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Programs
