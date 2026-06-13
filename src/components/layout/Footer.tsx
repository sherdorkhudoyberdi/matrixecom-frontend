import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-gray-100 bg-brand-gray-50">
      <div className="container-shop grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-4">
          <h3 className="text-2xl font-black">SHOP.CO</h3>
          <p className="text-sm text-brand-gray-600">
            We have clothes that suit your style and which you&apos;re proud to wear.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Company</h4>
          <ul className="space-y-2 text-sm text-brand-gray-600">
            <li><Link to="/catalog" className="hover:text-brand-black">Shop</Link></li>
            <li><Link to="/profile" className="hover:text-brand-black">Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Help</h4>
          <ul className="space-y-2 text-sm text-brand-gray-600">
            <li>Customer Support</li>
            <li>Delivery Details</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">Newsletter</h4>
          <p className="mb-3 text-sm text-brand-gray-600">Subscribe for updates and offers.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-full border border-brand-gray-200 px-4 text-sm outline-none"
            />
            <button
              type="button"
              className="rounded-full bg-brand-black px-5 text-sm font-semibold text-brand-white"
            >
              →
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-gray-200 py-6 text-center text-sm text-brand-gray-600">
        © {new Date().getFullYear()} SHOP.CO — MatrixEcom
      </div>
    </footer>
  )
}
