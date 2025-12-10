import './sidenav.css'

export default function Sidenav() {
  return (
    <aside className="sidenav">
      <h2 className="sidenav-title">Release Management System</h2>
      <nav>
        <ul className="sidenav-list">
          <li><a href="#home" className="nav-link">Home</a></li>
          <li><a href="#about" className="nav-link">Environments</a></li>
          <li><a href="#contact" className="nav-link">Releases</a></li>
          <li><a href="#contact" className="nav-link">Hotfixes</a></li>
        </ul>
      </nav>
    </aside>
  )
}