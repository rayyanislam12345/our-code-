import styles from "../styles/Navbar.module.css";

// Displays a horizontal list of students for navigation.
// Highlights the currently selected student.
// Props:
// - students: array of { id, name },
// - currentStudentId: active student ID,
// - onSelectStudent: handler for selection.

function Navbar({ students, currentStudentId, onSelectStudent }) {
  return (
    <div className={styles.navbar}>
      {students.map((student) => (
        <button
          key={student.id}
          className={`${styles.navItem} ${
            student.id === currentStudentId ? styles.active : ""
          }`}
          onClick={() => onSelectStudent(student.id)}
        >
          {student.name}
        </button>
      ))}
    </div>
  );
}

export default Navbar;