import cheer from '../assets/images/mascot-cheer.webp'

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <img src={cheer} alt="" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

export default EmptyState
