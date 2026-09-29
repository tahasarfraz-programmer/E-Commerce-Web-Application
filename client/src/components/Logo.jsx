import {Link} from 'react-router-dom';
export default function Logo(){
  return <Link to="/" className="logo" aria-label="Atelier home"><img src="/favicon.svg" alt="" width="34" height="34"/><span>Atelier</span></Link>;
}
