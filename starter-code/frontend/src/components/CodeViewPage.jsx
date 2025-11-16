import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Navbar from "./Navbar";
import CodeViewer from "./CodeViewer";

import styles from "../styles/CodeViewPage.module.css";

// Main interface to view peer code and comments for a submission.
// Fetches group members and peer submissions dynamically.
// Props received through `location.state`: user, assignmentId,
// displayedUserId, submissionId, submissionFileId, code.

export default function CodeViewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const loggedInUser = location.state?.user;
  const assignmentId = location.state?.assignmentId;
  const initialDisplayedUserId = location.state?.displayedUserId;
  const initialSubmissionId = location.state?.submissionId;
  const initialSubmissionFileId = location.state?.submissionFileId;
  const initialCode = location.state?.code;

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/", { replace: true });
    }
  }, [loggedInUser, navigate]);

  const [groupMembers, setGroupMembers] = useState([]);

  const [displayedUserId, setDisplayedUserId] = useState(
    initialDisplayedUserId || null
  );
  const [displayedUserName, setDisplayedUserName] = useState("");
  const [submissionId, setSubmissionId] = useState(initialSubmissionId || null);
  const [submissionFileId, setSubmissionFileId] = useState(
    initialSubmissionFileId || null
  );
  const [code, setCode] = useState(initialCode || "");

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentClass, setCurrentClass] = useState("CSC-120");
  const [currentProject, setCurrentProject] = useState("Project 1");
  const [currentStudent, setCurrentStudent] = useState(
    loggedInUser?.name || ""
  );

  useEffect(() => {
    if (!loggedInUser || !assignmentId) return;

    const fetchGroupAndMembers = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/?student=${loggedInUser.id}`
        );
        const groupData = await res.json();
        const groupId = groupData[0]?.id;
        if (!groupId) throw new Error("No group found");

        const membersRes = await fetch(
          `http://127.0.0.1:8000/api/groups/${groupId}/`
        );
        const membersJson = await membersRes.json();
        const users = membersJson.users || [];
        setGroupMembers(users);

        if (!displayedUserId && users.length > 0) {
          setDisplayedUserId(users[0].id);
          setDisplayedUserName(users[0].name);
        } else {
          const found = users.find((u) => u.id === displayedUserId);
          if (found) setDisplayedUserName(found.name);
        }
      } catch (err) {
        console.error("Failed to fetch group members:", err);
      }
    };

    fetchGroupAndMembers();
  }, [loggedInUser, assignmentId, displayedUserId]);

  useEffect(() => {
    const fetchPeerSubmission = async () => {
      if (!displayedUserId) return;

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${displayedUserId}&current=true`
        );
        const data = await res.json();
        if (!data.length) {
          setSubmissionId(null);
          setSubmissionFileId(null);
          setCode("");
          return;
        }
        const submission = data[0];
        setSubmissionId(submission.id);

        const file = submission.files?.[0];
        if (!file) {
          setSubmissionFileId(null);
          setCode("");
          return;
        }
        setSubmissionFileId(file.id);

        const fileRes = await fetch(
          `http://127.0.0.1:8000/api/addfile/${file.id}/`
        );
        if (!fileRes.ok) throw new Error("Cannot fetch file content");
        const fileJson = await fileRes.json();
        setCode(fileJson.content);
      } catch (err) {
        console.error("Failed to load peer code:", err);
        setSubmissionId(null);
        setSubmissionFileId(null);
        setCode("");
      }
    };

    if (groupMembers.length > 0 && displayedUserId) {
      const found = groupMembers.find((u) => u.id === displayedUserId);
      if (found) setDisplayedUserName(found.name);
    }

    fetchPeerSubmission();
  }, [displayedUserId, groupMembers, assignmentId]);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <Topbar onToggleSidebar={toggleSidebar} classTitle={currentClass} />

      <Navbar
        students={groupMembers.map((u) => ({ id: u.id, name: u.name }))}
        currentStudentId={displayedUserId}
        onSelectStudent={(id) => setDisplayedUserId(id)}
      />

      <div className={styles.main}>
        {sidebarVisible && (
          <Sidebar
            user={loggedInUser}
            currentClass={currentClass}
            setCurrentClass={setCurrentClass}
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
          />
        )}

        <div className={styles.content}>
          <CodeViewer
            code={code || "No code available."}
            displayedUserId={displayedUserId}
            displayedUserName={displayedUserName}
            submissionId={submissionId}
            submissionFileId={submissionFileId}
            currentUserId={loggedInUser?.id}
          />
        </div>
      </div>
    </div>
  );
}
