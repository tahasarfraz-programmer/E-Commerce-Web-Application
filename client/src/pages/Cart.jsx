import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api.js';
import { useStore } from '../store.jsx';
import ProductArt from '../components/ProductArt.jsx';

export default function Cart() {
  const { cart, setQty, remove, clear, user } = useStore();

  const [f, setF] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    postal: '',
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [q, setQ] = useState(null);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState('');

  // Load saved address when the user is logged in
  useEffect(() => {
    if (!user) return;

    api('/addresses')
      .then((addresses) => {
        const defaultAddress =
          addresses.find((address) => address.is_default) || addresses[0];

        if (defaultAddress) {
          setF((current) => ({
            ...current,
            name: defaultAddress.name,
            address: defaultAddress.line1,
            city: defaultAddress.city,
            postal: defaultAddress.postal,
          }));
        }
      })
      .catch(() => {});
  }, [user]);

  // Get order quote whenever cart or coupon changes
  useEffect(() => {
    if (!user || !cart.length) {
      setQ(null);
      return;
    }

    api('/orders/quote', {
      method: 'POST',
      body: {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        coupon: applied || undefined,
      },
    })
      .then(setQ)
      .catch((e) => {
        setErr(e.message);
        setApplied('');
        setQ(null);
      });
  }, [cart, applied, user]);

  const sub = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const disc = q?.discount || 0;

  const ship =
    sub - disc >= 150 || !sub
      ? 0
      : 9.5;

  const total = q ? q.total : sub + ship;

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setErr('');

    try {
      const r = await api('/orders', {
        method: 'POST',
        body: {
          ...f,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        },
      });

      clear();
      setDone(r);
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  // Order completed
  if (done) {
    return (
      <div className="wrap sec empty">
        <h1>Order #{done.id} confirmed</h1>

        <p>
          Total {money(done.total)}. Payment is a demo step in this build.
        </p>

        <Link className="btn" to="/account">
          View your orders
        </Link>
      </div>
    );
  }

  // Empty cart
  if (!cart.length) {
    return (
      <div className="wrap sec empty">
        <h1>Your cart is empty</h1>

        <p>Pick something you’ll use every day.</p>

        <Link className="btn" to="/shop">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap sec">
      <h1 className="h1">Cart</h1>

      <div className="shop cart">
        <div>
          {cart.map((item) => (
            <div className="line" key={item.id}>
              <div className="thumb">
                <ProductArt
                  color={item.color}
                  name={item.name}
                />
              </div>

              <div>
                <Link to={`/product/${item.id}`}>
                  <b>{item.name}</b>
                </Link>

                <div>{money(item.price)}</div>

                <button
                  className="link"
                  type="button"
                  onClick={() => remove(item.id)}
                >
                  Remove
                </button>
              </div>

              <div className="qty">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setQty(item.id, item.quantity - 1)}
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setQty(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <form className="summary" onSubmit={submit}>
          <h3>Order summary</h3>

          <div className="row between">
            <span>Subtotal</span>
            <span>{money(sub)}</span>
          </div>

          <div className="row between">
            <span>Shipping</span>
            <span>{ship ? money(ship) : 'Free'}</span>
          </div>

          {disc > 0 && (
            <div className="row between">
              <span>Discount ({q.coupon})</span>
              <span>−{money(disc)}</span>
            </div>
          )}

          <div className="row between total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          {!user ? (
            <Link
              className="btn"
              to="/login?next=/cart"
            >
              Sign in to check out
            </Link>
          ) : (
            <>
              {[
                ['name', 'Full name'],
                ['address', 'Street address'],
                ['city', 'City'],
                ['postal', 'Postal code'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}

                  <input
                    required
                    value={f[key]}
                    onChange={(e) =>
                      setF({
                        ...f,
                        [key]: e.target.value,
                      })
                    }
                  />
                </label>
              ))}

              <div className="row">
                <input
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    setErr('');
                    setApplied(code.trim().toUpperCase());
                  }}
                >
                  Apply
                </button>
              </div>

              {applied && q?.coupon && (
                <small className="ok">
                  Coupon {q.coupon} applied
                </small>
              )}

              {err && (
                <p className="err" role="alert">
                  {err}
                </p>
              )}

              <button
                className="btn"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Placing order…' : 'Place order'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}