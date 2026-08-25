import fistLivingroom from '../assets/images/knit-fist-livingroom.webp'
import fistHeart from '../assets/images/knit-fist-heart.webp'
import heartSolo from '../assets/images/knit-heart-solo.webp'
import plantSolo from '../assets/images/knit-plant-solo.webp'
import shieldWink from '../assets/images/knit-shield-wink.webp'
import megaphoneCraft from '../assets/images/knit-megaphone-craft.webp'

const GOODS = [
  { img: fistLivingroom, label: '반가워요!' },
  { img: fistHeart, label: '응원할게요!' },
  { img: heartSolo, label: '마음을 이어요!' },
  { img: megaphoneCraft, label: '함께 외쳐요!' },
  { img: plantSolo, label: '환경을 가꿔요!' },
  { img: shieldWink, label: '안전을 지켜요!' },
]

function KnitGoods() {
  return (
    <section className="section section-alt" id="knit-goods">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">이음이와 함께</span>
          <h2>이음이는 이런 모습으로도 만날 수 있어요</h2>
          <p>포근한 손뜨개 인형으로 태어난 이음이. 마음을 잇는 봉사처럼, 한 땀 한 땀 정성으로 만들었어요.</p>
        </div>

        <div className="knit-goods__grid">
          {GOODS.map((g) => (
            <figure key={g.label} className="knit-goods__item">
              <img src={g.img} alt={`이음이 인형 - ${g.label}`} loading="lazy" />
              <figcaption>{g.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default KnitGoods
