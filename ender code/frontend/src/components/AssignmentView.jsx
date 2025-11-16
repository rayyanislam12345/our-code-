import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/AssignmentView.module.css";
import EnrolledStudentsList from "./EnrolledStudentsList";
import AssignmentCreationModal from "./AssignmentCreationModal";
import ExtendDeadlineModal from "./ExtendDeadlineModal";


// Lists all assignments for a selected course.
// Navigates to group view (teacher) or assignment details (student).
// Props:
// - courseId: course identifier,
// - swap: function to change view.

export default function AssignmentView({ courseId: propCourseId, swap, user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = propUser ?? location.state?.user;
  const courseId = propCourseId ?? location.state?.courseId;

  const [assignments, setAssignments] = useState([]);
  const [extensions, setExtensions] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    async function getAssignments() {
      if (!courseId) {
        setAssignments([]);
        return;
      }
      const url = `http://127.0.0.1:8000/api/classes/${courseId}/assignments/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const json = await response.json();
      setAssignments(json);
      
      // Fetch extensions for each assignment
      if (user?.id) {
        const extensionsMap = {};
        for (const assignment of json) {
          try {
            const extRes = await fetch(`http://127.0.0.1:8000/api/assignments/${assignment.id}/extensions/`);
            if (extRes.ok) {
              const exts = await extRes.json();
              if (user.is_teacher) {
                // For teachers, find the latest extension (personal or class-wide)
                if (exts.length > 0) {
                  const latestExt = exts.reduce((latest, ext) => {
                    const extDate = new Date(ext.extended_submission_deadline);
                    const latestDate = latest ? new Date(latest.extended_submission_deadline) : null;
                    return !latestDate || extDate > latestDate ? ext : latest;
                  }, null);
                  if (latestExt) {
                    extensionsMap[assignment.id] = new Date(latestExt.extended_submission_deadline);
                  }
                }
              } else {
                // For students, check for personal or class-wide extension
                const personalExt = exts.find(ext => ext.user && ext.user.id === user.id);
                const classExt = exts.find(ext => ext.user === null);
                const applicableExt = personalExt || classExt;
                if (applicableExt) {
                  extensionsMap[assignment.id] = new Date(applicableExt.extended_submission_deadline);
                }
              }
            }
          } catch (err) {
            console.error(`Failed to fetch extensions for assignment ${assignment.id}:`, err);
          }
        }
        setExtensions(extensionsMap);
      }
    }
    getAssignments();
  }, [courseId, user]);

  const refreshAssignments = async () => {
    try {
      if (!courseId) return;
      const url = `http://127.0.0.1:8000/api/classes/${courseId}/assignments/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const json = await response.json();
      setAssignments(json);
      
      // Refresh extensions
      if (user?.id) {
        const extensionsMap = {};
        for (const assignment of json) {
          try {
            const extRes = await fetch(`http://127.0.0.1:8000/api/assignments/${assignment.id}/extensions/`);
            if (extRes.ok) {
              const exts = await extRes.json();
              if (user.is_teacher) {
                // For teachers, find the latest extension
                if (exts.length > 0) {
                  const latestExt = exts.reduce((latest, ext) => {
                    const extDate = new Date(ext.extended_submission_deadline);
                    const latestDate = latest ? new Date(latest.extended_submission_deadline) : null;
                    return !latestDate || extDate > latestDate ? ext : latest;
                  }, null);
                  if (latestExt) {
                    extensionsMap[assignment.id] = new Date(latestExt.extended_submission_deadline);
                  }
                }
              } else {
                // For students, check for personal or class-wide extension
                const personalExt = exts.find(ext => ext.user && ext.user.id === user.id);
                const classExt = exts.find(ext => ext.user === null);
                const applicableExt = personalExt || classExt;
                if (applicableExt) {
                  extensionsMap[assignment.id] = new Date(applicableExt.extended_submission_deadline);
                }
              }
            }
          } catch (err) {
            console.error(`Failed to fetch extensions for assignment ${assignment.id}:`, err);
          }
        }
        setExtensions(extensionsMap);
      }
    } catch (err) {
      console.error("Failed to refresh assignments", err);
    }
  };

  const deleteCourse = async () => {
    if (!confirm("Delete this course, all assignments, submissions, and unenroll all students?")) return;
    try {
      const res = await fetch(`/api/classes/${courseId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error(`${res.status}`);
      window.location.href = "/home";
    } catch (err) {
      console.error(err);
      alert("Failed to delete course: " + err.message);
    }
  };

  const displayAssignment = [...assignments];

  return (
    <div>
      {user?.is_teacher && courseId && (
        <div style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowCreateModal(true)}>Add Assignment</button>
          <button onClick={deleteCourse} style={{ background: "#d32f2f", color: "white" }}>Delete Course</button>
        </div>
      )}
       <div>
        <EnrolledStudentsList key={courseId} classId={courseId} user={user} />
      </div>

      <ul className={styles.container}>
        {displayAssignment.map((assignment) => {
          const hasExtension = extensions[assignment.id];
          return (
          <li key={assignment.id} className={styles.child}>
            <h2 className={styles.head}>{assignment.name}</h2>
            <p className={styles.submission}>
              Submission Deadline:{" "}
              {new Date(assignment.submission_deadline).toLocaleString()}
            </p>
            {hasExtension && (
              <p className={styles.submission} style={{ color: user?.is_teacher ? "#ff9800" : "green", fontWeight: "bold" }}>
                {user?.is_teacher ? "Active Submission Extension:" : "Extended Deadline:"}{" "}
                {hasExtension.toLocaleString()}
              </p>
            )}
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
                      state: { user, assignmentId: assignment.id, courseId },
                      state: { user, assignmentId: assignment.id, classId: courseId },
                    });
                } else {
                  navigate(`/assignments/${assignment.id}`, {
                    state: { user, assignment: assignment },
                  });
                }
              }}
            >
              View Details
            </button>
            {user?.is_teacher && (
              <button
                className={styles.viewmore}
                style={{ marginLeft: "0.5rem", background: "#ff9800" }}
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowExtendModal(true);
                }}
              >
                Extend Submission Deadline
              </button>
            )}
          </li>
          );
        })}
      </ul>     
      {showCreateModal && (
        <AssignmentCreationModal
          user={user}
          defaultCourseId={courseId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshAssignments();
          }}
        />
      )}
      {showExtendModal && selectedAssignment && (
        <ExtendDeadlineModal
          assignmentId={selectedAssignment.id}
          classId={courseId}
          originalDeadline={selectedAssignment.submission_deadline}
          onClose={() => {
            setShowExtendModal(false);
            setSelectedAssignment(null);
          }}
          onSaved={() => {
            setShowExtendModal(false);
            setSelectedAssignment(null);
            refreshAssignments();
          }}
        />
      )}
    </div>
  );
}
