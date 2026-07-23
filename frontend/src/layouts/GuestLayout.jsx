import { Outlet } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import GuestHeader from '../components/navigation/GuestHeader.jsx';
import '../styles/guest.css';

function GuestLayout() {
  const [headerCartQuantity, setHeaderCartQuantity] = useState(0);
  const [headerCartAction, setHeaderCartAction] = useState(() => () => {});
  const setGuestHeaderConfig = useCallback(({ cartQuantity = 0, onCartClick = () => {} }) => {
    setHeaderCartQuantity(cartQuantity);
    setHeaderCartAction(() => onCartClick);
  }, []);
  const outletContext = useMemo(() => ({ setGuestHeaderConfig }), [setGuestHeaderConfig]);

  return (
    <div className="guest-shell app-min-vh d-flex flex-column">
      <GuestHeader cartQuantity={headerCartQuantity} onCartClick={headerCartAction} />
      <main className="flex-grow-1">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}

export default GuestLayout;
