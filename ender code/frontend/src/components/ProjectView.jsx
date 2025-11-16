import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/ProjectView.module.css";
import EnrolledStudentsList from "./EnrolledStudentsList";
import AssignmentCreationModal from "./AssignmentCreationModal";

// Lists all assignments (projects) for a selected course.
// Navigates to group view (teacher) or project details (student).
// Props:
// - courseId: course identifier,
// - swap: function to change view.

export default function ProjectView({ courseId, swap, user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = propUser ?? location.state?.user;

  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function getProjects() {
      if (!courseId) {
        setProjects([]);
        return;
      }
      const url = `http://127.0.0.1:8000/api/classes/${courseId}/assignments/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const json = await response.json();
      setProjects(json);
    }
    getProjects();
  }, [courseId]);

  const refreshProjects = async () => {
    try {
      if (!courseId) return;
      const url = `http://127.0.0.1:8000/api/classes/${courseId}/assignments/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const json = await response.json();
      setProjects(json);
    } catch (err) {
      console.error("Failed to refresh projects", err);
    }
  };

  const displayProject = [...projects];

  return (
    <div className={styles["full-width"]}>
      {user?.is_teacher && courseId && (
        <div style={{ margin: "1rem 0" }}>
          <button onClick={() => setShowCreateModal(true)}>
            Add Assignment
          </button>
        </div>
      )}
      <EnrolledStudentsList classId={courseId} />
      <ul className={styles.container}>
        {displayProject.map((assignment) => (
          <li key={assignment.id} className={styles.child}>
            <h2 className={styles.head}>{assignment.name}</h2>
            <p className={styles.submission}>
              Submission Deadline:{" "}
              {new Date(assignment.submission_deadline).toLocaleString()}
            </p>
            <p className={styles.comment}>
              Commenting Deadline:{" "}
              {new Date(assignment.commenting_deadline).toLocaleString()}
            </p>
            <p className={styles.description}>{assignment.description}</p>

            <button
              className={styles.viewmore}
              onClick={() => {
                if (user?.is_teacher) {
                  navigate(`/assignments/${assignment.id}/groups`, {
                    state: { user, assignmentId: assignment.id },
                  });
                } else {
                  navigate(`/projects/${assignment.id}`, {
                    state: { user, project: assignment },
                  });
                }
              }}
            >
              View Details
            </button>
          </li>
        ))}
      </ul>
      {showCreateModal && (
        <AssignmentCreationModal
          user={user}
          defaultCourseId={courseId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshProjects();
          }}
        />
      )}
    </div>
  );
}
