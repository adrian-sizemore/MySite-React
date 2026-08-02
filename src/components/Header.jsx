import { NavLink } from './NavLink'

const navigation = [
  { label: 'About', href: '/about' },
  { label: 'Experience', href: '/experience' },
  { label: 'Military Service', href: '/military-service' },
  { label: 'Resume', href: '/resume' },
]

export function Header({ onNavigate }) {
  return (
    <header className="site-header">
      <NavLink className="brand" href="/" onNavigate={onNavigate}>
        Adrian Sizemore
      </NavLink>
      <nav aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavLink key={item.href} href={item.href} onNavigate={onNavigate}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
