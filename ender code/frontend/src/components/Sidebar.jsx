import { useEffect, useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { useNavigate } from "react-router-dom";

// Sidebar component showing user's classes and their assignments.
// Props:
// - user: logged-in user object.
// - currentClass, setCurrentClass: selected class state.
// - currentAssignment, setCurrentAssignment: selected Assignment state.
// - setPage: function to navigate between views.
// - setShowCreateModal: function to open the create class modal.


function Sidebar({
  user,
  currentClass,
  setCurrentClass,
  currentAssignment,
  setCurrentAssignment,
  setPage,
  setShowCreateModal,
}) {
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState({});
  // fetchClasses is exposed so other handlers (like after create) can refresh.
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

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const handleCreateToggle = () => {
    setCreateError(null);
    setShowCreateForm((s) => !s);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewClass((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    const payload = {
      ...newClass,
      teacher: user.id,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/classes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Status ${res.status}`);
      }

      // Success: refresh classes by re-running effect (by forcing a small state change)
      // Simple approach: fetch classes again here.
      const roleParam = user.is_teacher ? "teacher" : "student";
      const r = await fetch(
        `http://127.0.0.1:8000/api/classes/?${roleParam}=${user.id}`
      );
      const classData = await r.json();
      setClasses(classData);
      setShowCreateForm(false);
      setNewClass({ code: "", name: "", term: "", year: new Date().getFullYear(), start_date: "", end_date: "" });
    } catch (err) {
      console.error(err);
      setCreateError(err.message);
    }
  };

  return (
    <nav className={styles.sidebar}>
      <div>
        {user.is_teacher && (
          <div>
            <button
              className={styles.addClass}
              onClick={() => setShowCreateModal(true)}
            >
              + Add a class
            </button>
          </div>
        )}
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
                  setCurrentAssignment(null);
                  navigate("/home", { state: { user } });
                }}
              >
                {cls.code}: {cls.name}
              </div>

              {cls.id === currentClass && (
                <div className={styles.assignmentList}>
                  {(assignments[cls.id] || []).map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`${styles.assignmentName} ${
                        assignment.name === currentAssignment ? styles.active : ""
                      }`}
                      onClick={() => {
                        setCurrentAssignment(assignment.name);
                        setPage("assignment");
                        console.log(
                          `Navigating to assignment ${assignment.id} for class ${cls.id}`
                        );
                        navigate(`/assignments/${assignment.id}/groups`, {
                          state: {
                            user,
                            assignmentId: assignment.id,
                            classId: cls.id,
                          },
                        });

                      }}
                    >
                      {assignment.name}
                    </div>
                  ))}
                </div>
              )} 
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
