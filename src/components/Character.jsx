import characterSheet from '../assets/images/character-sheet.webp'

const POSES = ['반가워요!', '마음을 이어요!', '폭력은 NO!', '함께해요!', '마을을 지켜요!']

function Character() {
  return (
    <section id="character" className="section">
      <div className="container character">
        <div className="section-head">
          <span className="eyebrow">봉사단 캐릭터</span>
          <h2>이음이의 다양한 모습</h2>
          <p>
            마음과 마음을 이어주는 이음봉사단의 마스코트, <strong>이음이</strong>를
            소개합니다.
          </p>
        </div>

        <div className="character__sheet">
          <img src={characterSheet} alt="이음봉사단 캐릭터 이음이의 다양한 포즈" />
        </div>

        <ul className="character__poses">
          {POSES.map((pose) => (
            <li key={pose}>{pose}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Character
