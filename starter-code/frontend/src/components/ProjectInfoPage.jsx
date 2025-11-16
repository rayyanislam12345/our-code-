import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/ProjectInfoPage.module.css";

// Displays submission and commenting status for a selected project.
// Allows navigating to submit code or view peer comments.
// Props received through `location.state`: user, project.


export default function ProjectInfoPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const project = state?.project;
  const user = state?.user;

  const [groupMembers, setGroupMembers] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const fetchGroup = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${id}/groups/?student=${user.id}`
        );
        if (!res.ok) throw new Error(`Group fetch status ${res.status}`);
        const data = await res.json();
        if (data.length > 0) setGroupMembers(data[0].users);
      } catch (err) {
        console.error("Failed to fetch group:", err);
      }
    };

    const checkSubmission = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${id}/submissions/?student=${user.id}&current=true`
        );
        if (!res.ok) throw new Error(`Submission fetch status ${res.status}`);
        const data = await res.json();
        setHasSubmitted(data.length > 0);
      } catch (err) {
        console.error("Failed to check submission:", err);
      }
    };

    fetchGroup();
    checkSubmission();
  }, [id, user]);

  if (!project || !user) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>Error: Missing project or user data</h2>
        <p>Please navigate from the assignment list and try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.myCode}>
        <h2 className={styles.head}>My Code</h2>
        <p className={styles.dLine}>
          Submission Deadline: {new Date(project.submission_deadline).toLocaleString()}
        </p>
        <button
          className={styles.button}
          onClick={() =>
            navigate(`/projects/${id}/submit`, {
              state: {
                user: user,
                project: project
              }
            })
          }
        >
          {hasSubmitted ? "View Submission" : "Submit"}
        </button>

        <button
          className={styles.button}
          onClick={async () => {
            try {
              const res = await fetch(
                `http://127.0.0.1:8000/api/assignments/${id}/submissions/?student=${user.id}&current=true`
              );
              const data = await res.json();
              if (!data.length) {
                alert("No submission found.");
                return;
              }
              const submission = data[0];
              const file = submission.files[0];
              if (!file) {
                alert("No code file attached.");
                return;
              }

              const fileRes = await fetch(`http://127.0.0.1:8000/api/addfile/${file.id}/`);
              if (!fileRes.ok) throw new Error(`Failed to fetch file ${file.id}`);
              const fileJson = await fileRes.json();
              const fileText = fileJson.content;

              navigate("/code-view", {
                state: {
                  user,
                  submissionId: submission.id,
                  submissionFileId: file.id,
                  code: fileText,
                  assignmentId: id
                }
              });
            } catch (err) {
              console.error("Failed to open peer comments:", err);
              alert("Error loading submission.");
            }
          }}
        >
          See Peer Comments
        </button>
      </div>

      <div className={styles.myComments}>
        <h2 className={styles.head}>My Comments</h2>
        <p className={styles.dLine}>
          Commenting Deadline: {new Date(project.commenting_deadline).toLocaleString()}
        </p>
        <p className={styles.desc}>
          Assigned Group:{" "}
          {groupMembers.length > 0
            ? groupMembers.map(u => u.name).join(", ")
            : "No group assigned"}
        </p>
        <button
          className={styles.button}
          onClick={() =>
            navigate("/group-comments", {
              state: {
                user: user,
                assignmentId: id
              }
            })
          }
        >
          Add Comments
        </button>
      </div>
    </div>
  );
}
