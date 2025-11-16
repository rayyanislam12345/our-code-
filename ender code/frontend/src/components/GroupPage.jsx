import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/GroupPage.module.css";

// Displays submission summaries and peer comment stats for a group.
// Handles both student and teacher views based on groupId presence.
// Props (fallback to location.state): user, assignmentId, groupId, navigate.

export default function GroupPage({
  user: propUser,
  assignmentId: propAssignmentId,
  groupId: propGroupId,
  navigate: propNavigate,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = propUser || location.state?.user;
  const assignmentId = propAssignmentId || location.state?.assignmentId;
  const groupId = propGroupId || location.state?.groupId;
  const navigationFunction = propNavigate || navigate;
  const commentingDeadline = location.state?.commentingDeadline;

  const [submissions, setSubmissions] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  useEffect(() => {
    if (!user || !assignmentId) {
      navigationFunction("/", { replace: true });
      return;
    }
    if (groupId) {
      fetchGroupForTeacher();
    } else {
      fetchGroupForStudent();
    }
  }, [user, assignmentId, groupId, navigationFunction]);

  const fetchGroupForStudent = async () => {
    try {
      setLoading(true);
      const groupResponse = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/?student=${user.id}`
      );
      if (!groupResponse.ok) throw new Error("Failed to fetch student’s group");
      const groupData = await groupResponse.json();
      const myGroupId = groupData[0]?.id;
      if (!myGroupId) throw new Error("You have no group on this assignment");

      const membersResponse = await fetch(
        `http://127.0.0.1:8000/api/groups/${myGroupId}/`
      );
      if (!membersResponse.ok) throw new Error("Failed to fetch group members");
      const membersData = await membersResponse.json();
      setGroupMembers(membersData.users || []);

      const submissionsResponse = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?requester=${user.id}`
      );
      if (!submissionsResponse.ok)
        throw new Error("Failed to fetch submissions");
      const submissionsData = await submissionsResponse.json();

      const memberIds = (membersData.users || []).map((u) => u.id);
      const groupSubs = submissionsData.filter((sub) =>
        memberIds.includes(sub.user)
      );

      const enhanced = await Promise.all(
        groupSubs.map(async (submission) => {
          const userRes = await fetch(
            `http://127.0.0.1:8000/api/users/${submission.user}/`
          );
          const userData = userRes.ok ? await userRes.json() : null;

          const commenterIds = [
            ...new Set((submission.comments || []).map((c) => c.user)),
          ];
          const commenters = await Promise.all(
            commenterIds.map(async (cid) => {
              const cRes = await fetch(
                `http://127.0.0.1:8000/api/users/${cid}/`
              );
              return cRes.ok ? await cRes.json() : null;
            })
          );

          return {
            ...submission,
            userName: userData?.name || `User ${submission.user}`,
            commenters: commenters.filter((c) => c !== null),
          };
        })
      );

      setSubmissions(enhanced);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupForTeacher = async () => {
    try {
      setLoading(true);
      const membersResponse = await fetch(
        `http://127.0.0.1:8000/api/groups/${groupId}/`
      );
      if (!membersResponse.ok) throw new Error("Failed to fetch group members");
      const membersData = await membersResponse.json();
      setGroupMembers(membersData.users || []);

      const submissionsResponse = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?requester=${user.id}`
      );
      if (!submissionsResponse.ok)
        throw new Error("Failed to fetch submissions");
      const submissionsData = await submissionsResponse.json();

      const memberIds = (membersData.users || []).map((u) => u.id);
      const groupSubs = submissionsData.filter((sub) =>
        memberIds.includes(sub.user)
      );

      const enhanced = await Promise.all(
        groupSubs.map(async (submission) => {
          const userRes = await fetch(
            `http://127.0.0.1:8000/api/users/${submission.user}/`
          );
          const userData = userRes.ok ? await userRes.json() : null;

          const commenterIds = [
            ...new Set((submission.comments || []).map((c) => c.user)),
          ];
          const commenters = await Promise.all(
            commenterIds.map(async (cid) => {
              const cRes = await fetch(
                `http://127.0.0.1:8000/api/users/${cid}/`
              );
              return cRes.ok ? await cRes.json() : null;
            })
          );

          return {
            ...submission,
            userName: userData?.name || `User ${submission.user}`,
            commenters: commenters.filter((c) => c !== null),
          };
        })
      );

      setSubmissions(enhanced);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserColor = (userId) => {
    return colors[userId % colors.length];
  };

  const handleViewCode = async (submission) => {
    try {
      const file = submission.files?.[0];
      if (!file) {
        alert("No file found for this submission.");
        return;
      }

      const fileRes = await fetch(
        `http://127.0.0.1:8000/api/addfile/${file.id}/`
      );
      if (!fileRes.ok) throw new Error("Failed to fetch file content");
      const fileJson = await fileRes.json();
      const fileText = fileJson.content;

      navigationFunction("/code-view", {
        state: {
          user: user,
          submissionId: submission.id,
          submissionFileId: file.id,
          code: fileText,
          assignmentId: assignmentId,
          commentingDeadline,
        },
      });
    } catch (err) {
      console.error("Failed to load peer code:", err);
      alert("Error loading submission file.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user || !assignmentId) return null;
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading group submissions...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Group Submissions</h2>
        <p>{groupMembers.length} members in this group</p>
      </div>

      <div className={styles.submissionsGrid}>
        {submissions.length === 0 ? (
          <div className={styles.noSubmissions}>
            No submissions found for your group.
          </div>
        ) : (
          submissions.map((submission) => (
            <div key={submission.id} className={styles.submissionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.submitterInfo}>
                  <div
                    className={styles.userCircle}
                    style={{ backgroundColor: getUserColor(submission.user) }}
                  >
                    {submission.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.submitterDetails}>
                    <h3>{submission.userName}</h3>
                    <p className={styles.submissionDate}>
                      Submitted {formatDate(submission.submitted_at)}
                    </p>
                  </div>
                </div>

                <div className={styles.commentersSection}>
                  <span className={styles.commentersLabel}>Commented by:</span>
                  <div className={styles.commentersCircles}>
                    {submission.commenters.length === 0 ? (
                      <span className={styles.noComments}>No comments yet</span>
                    ) : (
                      submission.commenters.map((commenter) => (
                        <div
                          key={commenter.id}
                          className={styles.commenterCircle}
                          style={{
                            backgroundColor: getUserColor(commenter.id),
                          }}
                          title={commenter.name}
                        >
                          {commenter.name.charAt(0).toUpperCase()}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.filesInfo}>
                  <span className={styles.commentsCount}>
                    {submission.comments?.length || 0} comment(s)
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.viewCodeButton}
                  onClick={() => handleViewCode(submission)}
                >
                  View Code
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
