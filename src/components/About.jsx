const VALUES = [
  {
    icon: '💙',
    title: '마음이음',
    desc: '마음을 잇고 공감하는 봉사',
  },
  {
    icon: '🤝',
    title: '함께이음',
    desc: '주민·학교·마을이 함께하는 활동',
  },
  {
    icon: '🛡️',
    title: '안전이음',
    desc: '학교폭력 없는 안전한 환경 조성',
  },
  {
    icon: '🌱',
    title: '미래이음',
    desc: '아이들의 밝은 미래를 위한 지속적 실천',
  },
]

function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">이음봉사단 소개</span>
          <h2>안녕! 나는 이음이야</h2>
          <p>
            마음과 마음을 이어 학교와 마을을 더 안전하고 따뜻하게 만들기 위해
            함께 노력할게요! 이음봉사단은 네트워크 구성·역량강화교육, 생활안전캠페인,
            환경정화활동을 축으로 청소년과 지역사회를 잇는 안전 지킴이 봉사단체입니다.
          </p>
        </div>

        <div className="values-grid">
          {VALUES.map((v) => (
            <div className="value-card" key={v.title}>
              <span className="value-card__icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About
