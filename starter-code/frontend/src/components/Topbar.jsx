import styles from "../styles/Topbar.module.css";

// Top navigation bar with class title and basic controls.
// Props:
// - onToggleSidebar: toggles the sidebar visibility.
// - classTitle: displays the current class name.

function Topbar({ onToggleSidebar, classTitle }) {
  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} onClick={onToggleSidebar}>
        ☰
      </button>
      <div className={styles.title}>{classTitle}</div>
      <div className={styles.actions}>
        <button className={styles.addButton}>+ Add a project</button>
        <div className={styles.profileIcon}></div>
      </div>
    </header>
  );
}

export default Topbar;