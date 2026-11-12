import { Icon } from '../../../../components/icon/Icon'
import './ProfileCard.css'

/**
 * 프로필 카드 (이름 + 이메일)
 *
 * @param {string} name 이름
 * @param {string} email 이메일 (로그인 ID). 마스킹 없이 그대로 표시한다.
 */
export const ProfileCard = ({ name, email }) => (
  <div className='profile-card'>
    <span className='profile-card__avatar'>
      <Icon name='user' width={32} height={32} aria-hidden='true' />
    </span>
    <div className='profile-card__text'>
      <p className='profile-card__name'>{name}</p>
      <p className='profile-card__email'>{email}</p>
    </div>
  </div>
)
