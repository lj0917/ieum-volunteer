import cheer from '../assets/images/mascot-cheer.webp'
import megaphone from '../assets/images/mascot-megaphone2.webp'
import shield from '../assets/images/mascot-shield.webp'
import hugheart from '../assets/images/mascot-hugheart.webp'
import plant from '../assets/images/mascot-plant.webp'
import cheerheart from '../assets/images/mascot-cheerheart.webp'

const POSES = [
  { img: cheer, label: '반가워요!' },
  { img: megaphone, label: '함께 외쳐요!' },
  { img: shield, label: '안전을 지켜요!' },
  { img: hugheart, label: '마음을 이어요!' },
  { img: plant, label: '환경을 가꿔요!' },
  { img: cheerheart, label: '응원할게요!' },
]

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

        <div className="character__grid">
          {POSES.map((pose) => (
            <figure key={pose.label} className="character__grid-item">
              <img src={pose.img} alt={`이음이 - ${pose.label}`} />
              <figcaption>{pose.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Character
