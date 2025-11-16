import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/AssignmentGroupsPage.module.css";

import ProfStats from "./ProfStats";

// Displays a list of all groups for a given assignment.
// Redirects to login if user or assignment ID is missing.
// Props received through `location.state`: user.

export default function AssignmentGroupsPage() {
  const { assignmentId, classId: paramClassId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [assignmentName, setAssignmentName] = useState("");

  const user = location.state?.user;
  const courseId = location.state?.courseId;
  // Debug: surface current user role and id in console to diagnose visibility
  console.log("AssignmentGroupsPage state:", {
    assignmentId,
    hasUser: !!user,
    userId: user?.id,
    isTeacher: user?.is_teacher,
  });

  const [groups, setGroups] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    async function fetchAssignmentName() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/assignments/${assignmentId}/`);
        if (res.ok) {
          const data = await res.json();
          setAssignmentName(data.name || "");
        }
      } catch (err) {
        console.error("Failed to fetch assignment name:", err);
      }
    }

    if (assignmentId) {
      fetchAssignmentName();
    }
  }, [assignmentId]);


  // Restore deleteAssignment handler (was removed accidentally).
  const deleteAssignment = async () => {
    if (!confirm(`Are you sure you want to delete this assignment?`)) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assignment");
      alert("Assignment deleted successfully");
      navigate("/home", { state: { user, courseId } });
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      alert("Error deleting assignment");
    }
  };

  useEffect(() => {
    if (!user || !assignmentId) {
      navigate("/", { replace: true });
      return;
    }
    fetchGroups();
  }, [user, assignmentId, navigate]);

 const fetchGroups = async () => {
  try {
    setLoading(true);

    const res = await fetch(
      `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`
    );
    if (!res.ok) throw new Error("Failed to fetch assignment groups");

    const groupList = await res.json();   // read once
    console.log("Group list:", groupList);

    const detailedGroups = await Promise.all(
      groupList.map(async (g) => {
        const groupRes = await fetch(`http://127.0.0.1:8000/api/groups/${g.id}/`);
        if (!groupRes.ok) throw new Error(`Failed to fetch group ${g.id}`);
        const detail = await groupRes.json();
        console.log("Group detail:", detail);
        return detail;
      })
    );

    // Fetch deadline extensions
    const resExt = await fetch(
      `http://127.0.0.1:8000/api/assignments/${assignmentId}/extensions/`
    );

    if (resExt.ok) {
      const extData = await resExt.json();
      setExtensions(extData);
    }

    setGroups(detailedGroups);
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

  if (!user || !assignmentId) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        {user?.is_teacher && (
          <button
            onClick={deleteAssignment}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            Delete Assignment
          </button>
        )}
        <p>Loading groups…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        {user?.is_teacher && (
          <button
            onClick={deleteAssignment}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            Delete Assignment
          </button>
        )}
        <p>Error: {error}</p>
      </div>
    );
  } const handleAutoCreateGroups = async () => {
    

    const classId = location.state.classId;
    const size = prompt("How many students per group?");
    if (!size) return; 
    const groupSize = parseInt(size);
    if (isNaN(groupSize) || groupSize <= 0) {
      alert("Please enter a valid group size.");
      return;
    }
    console.log("Group size entered:", groupSize);

    if (!location.state?.classId) {
      alert("Missing class ID — cannot fetch roster.");
      return;
    }

    if (!classId) {
      alert("Missing class ID — cannot fetch roster.");
      return;
    }

    const rosterUrl = `http://127.0.0.1:8000/api/classes/${classId}/roster/`;

    try {
      const res = await fetch(rosterUrl);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const roster = await res.json();
      const studentsOnly = roster.filter((s) => !s.is_teacher);
      console.log("Roster:", studentsOnly);
  
      const shuffled = [...studentsOnly];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const groups = [];
      for (let i = 0; i < shuffled.length; i += groupSize) {
        groups.push(shuffled.slice(i, i + groupSize));
      }
      console.log("Random groups generated:", groups);

      for (const group of groups) {
        const studentEmails = group.map(s => s.email);
        console.log("Creating group with:", studentEmails);

        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: studentEmails }),
          }
        );
        if (!res.ok) {
          console.error(`Failed to create group`, await res.text());
        } else {
          const data = await res.json();
          console.log("Group created:", data);
        }
      }

    } catch (err) {
      console.error("Failed to fetch roster:", err);
      alert("Could not fetch class roster.");
      return;
    }



  };




  return (
    <div className={styles.container}>
      {user?.is_teacher && (
        <button
          onClick={deleteAssignment}
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          Delete Assignment
        </button>
      )}
      <ProfStats assignmentId={assignmentId} />
      <h2>Groups for {assignmentName || `Assignment #${assignmentId}`}</h2>
      {user.is_teacher && extensions.length > 0 && (
        <div
          style={{
            background: "#fff3cd",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "4px",
            border: "1px solid #ffc107",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Deadline Extensions</h3>
          <ul style={{ marginBottom: 0 }}>
            {extensions.map((ext) => (
              <li key={ext.id}>
                {ext.user ? (
                  <>
                    <strong>{ext.user.name}</strong> ({ext.user.email})
                  </>
                ) : (
                  <strong>Entire Class</strong>
                )}
                {" - Extended to: "}
                <strong>
                  {new Date(ext.extended_submission_deadline).toLocaleString()}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user.is_teacher && (
        <button
          onClick={() =>
            navigate("/create-group", {
              state: {
                user,
                assignmentId,
                classId: location.state?.classId ?? paramClassId,   // fallback to URL if needed
              },
            })
          }
        >
          Create Group
        </button>
      )}

      <button
        onClick={handleAutoCreateGroups}
      >
        Auto-Create Random Groups
      </button>

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
                      user: user,
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
