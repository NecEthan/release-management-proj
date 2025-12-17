import './sidenav.css'
type MenuKey = 'home' | 'environments' | 'releases' | 'deployments' | 'hotfixes'

export default function Sidenav({
  selected,
  onSelect,
}: {
  selected: MenuKey
  onSelect?: (key: MenuKey) => void
}) {
  const items: { key: MenuKey; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'environments', label: 'Environments' },
    { key: 'releases', label: 'Releases' },
    { key: 'deployments', label: 'Deployments' },
    { key: 'hotfixes', label: 'Hotfixes' },
  ]

  return (
    <aside className="sidenav">
      <h2 className="sidenav-title">Release Management System</h2>
      <nav>
        <ul className="sidenav-list">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`nav-link ${selected === item.key ? 'active' : ''}`}
                onClick={() => onSelect?.(item.key)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}