const EFFECTS = [
  '청소년의 생활안전 의식 및 환경 보호 의식 함양',
  '학교 및 지역사회 내 안전하고 깨끗한 환경 조성',
  '학생 주도의 참여 활동을 통한 민주시민 역량 강화',
  '캠페인과 정화활동을 연계한 이론·실천 결합 체험 중심 교육 효과',
  '청소년의 생활안전 실천 역량 강화',
  '지역사회 환경 개선 및 공동체 의식 함양',
]

function Effects() {
  return (
    <section id="effects" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">기대효과</span>
          <h2>이음봉사단이 만드는 변화</h2>
          <p>작은 실천이 모여 학교와 마을 전체의 안전 문화로 이어집니다.</p>
        </div>

        <div className="effects-grid">
          {EFFECTS.map((effect, i) => (
            <div className="effect-card" key={effect}>
              <span className="effect-card__num">{String(i + 1).padStart(2, '0')}</span>
              <p>{effect}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Effects
