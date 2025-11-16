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

  const user = location.state?.user;
  const assignmentId = location.state?.assignmentId;
  const initialDisplayedUserId = location.state?.displayedUserId;
  const initialSubmissionId = location.state?.submissionId;
  const initialSubmissionFileId = location.state?.submissionFileId;
  const initialCode = location.state?.code;
  const selectedCommentId = location.state?.selectedCommentId;
  const commentingDeadline = location.state?.commentingDeadline;

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

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
  const [currentClass, setCurrentClass] = useState("");
  const [currentAssignment, setCurrentAssignment] = useState("Assignment 1");
  const [currentStudent, setCurrentStudent] = useState(user?.name || "");

  useEffect(() => {
    if (!user || !assignmentId) return;

    const fetchGroupAndMembers = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/?student=${user.id}`
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
    if (!user?.is_teacher) {
      fetchGroupAndMembers();
    }
  }, [user, assignmentId, displayedUserId]);

  useEffect(() => {
    const load = async () => {
      if (!displayedUserId) return;

      // If we were passed a specific submission/file (from StudentCommentsPage), prefer that.
      if (submissionId && submissionFileId) {
        if (!code) {
          try {
            const fileRes = await fetch(`http://127.0.0.1:8000/api/addfile/${submissionFileId}/`);
            if (fileRes.ok) {
              const fileJson = await fileRes.json();
              setCode(fileJson.content || "");
            }
          } catch (_) {}
        }
        return;
      }

      // Fallback: load the student's current submission
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${displayedUserId}&current=true&requester=${user?.id}`
        );
        if (res.status === 403) {
          setSubmissionId(null);
          setSubmissionFileId(null);
          setCode("Access restricted: You have an active deadline extension. You can only view your own code until all deadlines have passed.");
          return;
        }
        const data = await res.json();
        if (!data.length) { setSubmissionId(null); setSubmissionFileId(null); setCode(""); return; }
        const sub = data[0];
        setSubmissionId(sub.id);
        const file = sub.files?.[0];
        if (!file) { setSubmissionFileId(null); setCode(""); return; }
        setSubmissionFileId(file.id);
        const fileRes = await fetch(`http://127.0.0.1:8000/api/addfile/${file.id}/`);
        if (!fileRes.ok) throw new Error("Cannot fetch file content");
        const fileJson = await fileRes.json();
        setCode(fileJson.content);
      } catch (err) {
        console.error("Failed to load peer code:", err);
        setSubmissionId(null); setSubmissionFileId(null); setCode("");
      }
    };

    if (groupMembers.length > 0 && displayedUserId) {
      const found = groupMembers.find((u) => u.id === displayedUserId);
      if (found) setDisplayedUserName(found.name);
    }

    load();
  }, [displayedUserId, groupMembers, assignmentId, submissionId, submissionFileId]);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  // ADD USER TO TOPBAR

  return (
    <div className={styles.container}>
      <Topbar onToggleSidebar={toggleSidebar} title={currentClass} />

      <Navbar
        students={groupMembers.map((u) => ({ id: u.id, name: u.name }))}
        currentStudentId={displayedUserId}
        onSelectStudent={(id) => setDisplayedUserId(id)}
      />

      <div className={styles.main}>
        {sidebarVisible && (
          <Sidebar
            user={user}
            currentClass={currentClass}
            setCurrentClass={setCurrentClass}
            currentAssignment={currentAssignment}
            setCurrentAssignment={setCurrentAssignment}
          />
        )}

        <div className={styles.content}>
          <CodeViewer
            isTeacher={user?.is_teacher}
            code={code || "No code available."}
            displayedUserId={displayedUserId}
            displayedUserName={displayedUserName}
            submissionId={submissionId}
            submissionFileId={submissionFileId}
            currentUserId={user?.id}
            commentingDeadline={commentingDeadline}
            assignmentId={assignmentId}
            selectedCommentId={selectedCommentId}
          />
        </div>
      </div>
    </div>
  );
}
