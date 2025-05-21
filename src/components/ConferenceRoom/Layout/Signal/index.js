import { ReactComponent as icon1 } from './1.svg';
import { ReactComponent as icon2 } from './2.svg';
import { ReactComponent as icon3 } from './3.svg';
import { ReactComponent as icon4 } from './4.svg';
import style from './style.module.scss';

const icons = [icon1, icon2, icon3, icon4];

const Signal = ({ level }) => {
  const IconComponent = icons[level] || icon4;
  return (
    <div
      className={style['signal']}
      style={{
        '--color': `var(--color-${level})`
      }}
    >
      <IconComponent />
    </div>
  );
};

export default Signal;
