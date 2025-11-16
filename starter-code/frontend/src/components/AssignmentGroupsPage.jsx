import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/AssignmentGroupsPage.module.css";

// Displays a list of all groups for a given assignment.
// Redirects to login if user or assignment ID is missing.
// Props received through `location.state`: user.

export default function AssignmentGroupsPage() {
  const { assignmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const loggedInUser = location.state?.user;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loggedInUser || !assignmentId) {
      navigate("/", { replace: true });
      return;
    }
    fetchGroups();
  }, [loggedInUser, assignmentId, navigate]);

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`
      );
      if (!res.ok) throw new Error("Failed to fetch assignment groups");
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberNames = (users) => {
    if (!users || !users.length) return "No members";
    return users.map((u) => u.name).join(", ");
  };

  if (!loggedInUser || !assignmentId) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading groups…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Groups for Assignment #{assignmentId}</h2>

      {groups.length === 0 ? (
        <p>No groups found for this assignment.</p>
      ) : (
        <ul className={styles.groupList}>
          {groups.map((group) => (
            <li key={group.id} className={styles.groupCard}>
              <div>
                <strong>Group ID:</strong> {group.id}
              </div>
              <div>
                <strong>Members:</strong> {formatMemberNames(group.users)}
              </div>
              <button
                className={styles.viewGroupButton}
                onClick={() =>
                  navigate("/group-comments", {
                    state: {
                      user: loggedInUser,
                      assignmentId: assignmentId,
                      groupId: group.id,
                    },
                  })
                }
              >
                View Group
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
