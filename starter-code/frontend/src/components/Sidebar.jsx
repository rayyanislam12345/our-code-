import { useEffect, useState } from "react";
import styles from "../styles/Sidebar.module.css";

// Sidebar component showing user's classes and their assignments.
// Props:
// - user: logged-in user object.
// - currentClass, setCurrentClass: selected class state.
// - currentProject, setCurrentProject: selected project state.
// - setPage: function to navigate between views.


function Sidebar({
  user,
  currentClass,
  setCurrentClass,
  currentProject,
  setCurrentProject,
  setPage,
}) {
  const [classes, setClasses] = useState([]);

  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const roleParam = user.is_teacher ? "teacher" : "student";
        const res = await fetch(
          `http://127.0.0.1:8000/api/classes/?${roleParam}=${user.id}`
        );
        if (!res.ok) {
          throw new Error(`Error fetching classes: ${res.status}`);
        }
        const classData = await res.json();
        setClasses(classData);

        const assignmentMap = {};
        await Promise.all(
          classData.map(async (cls) => {
            const r2 = await fetch(
              `http://127.0.0.1:8000/api/classes/${cls.id}/assignments/`
            );
            if (!r2.ok) {
              throw new Error(
                `Error fetching assignments for class ${cls.id}: ${r2.status}`
              );
            }
            const aJson = await r2.json();
            assignmentMap[cls.id] = aJson;
          })
        );
        setAssignments(assignmentMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClasses();
  }, [user]);

  return (
    <nav className={styles.sidebar}>
      <div>
        <div className={styles.sidebarTitle}>My Classes</div>
        <div className={styles.classList}>
          {classes.map((cls) => (
            <div key={cls.id} className={styles.classBlock}>
              <div
                className={`${styles.className} ${
                  cls.id === currentClass ? styles.active : ""
                }`}
                onClick={() => {
                  setCurrentClass(cls);
                  setCurrentProject(null);
                  setPage("project");
                }}
              >
                {cls.code}: {cls.name}
              </div>

              {cls.id === currentClass && (
                <div className={styles.projectList}>
                  {(assignments[cls.id] || []).map((project) => (
                    <div
                      key={project.id}
                      className={`${styles.projectName} ${
                        project.name === currentProject ? styles.active : ""
                      }`}
                      onClick={() => {
                        setCurrentProject(project.name);
                        setPage("project");
                      }}
                    >
                      {project.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className={styles.addClass}>+ Add a class</button>
    </nav>
  );
}

export default Sidebar;