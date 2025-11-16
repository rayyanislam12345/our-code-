import styles from "../styles/Topbar.module.css";

// Top navigation bar with class title and basic controls.
// Props:
// - onToggleSidebar: toggles the sidebar visibility.
// - classTitle: displays the current class name.

function Topbar({ onToggleSidebar, title, setUser }) {

  const toggleLogoutVisible = () => {
    const b = document.getElementById("panel");
    if (b.className == styles.actionsPanelInvis) {
      b.className = styles.actionsPanelVis;
    } else {
      b.className = styles.actionsPanelInvis;
    };
  }

  const logout = () => {
    setUser(null);
  }

  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} onClick={onToggleSidebar}>
        ☰
      </button>
      <div className={styles.title}>{title}</div>
      <div className={styles.actions} data-testid="action-bar">
        <div className={styles.profileIcon} onClick={toggleLogoutVisible}></div>
        <div id="panel" className={styles.actionsPanelInvis}>
          <div className={styles.logout} onClick={logout} data-testid="logout">Log Out</div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;