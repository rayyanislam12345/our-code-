import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/SubmissionStatusPage.module.css";

// Displays group submission statistics for instructors.
// Shows submission progress bars and links to group views.
// Props (fallbacks to location.state): user, assignmentId, navigate.

export default function SubmissionStatusPage({
  user: propUser,
  assignmentId: propAssignmentId,
  navigate: propNavigate,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const loggedInUser = propUser || location.state?.user;
  const assignmentId = propAssignmentId || location.state?.assignmentId;
  const navigationFunction = propNavigate || navigate;

  const [groups, setGroups] = useState([]);
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
    if (!loggedInUser || !assignmentId) {
      if (!propUser && !propAssignmentId) {
        navigationFunction("/", { replace: true });
      }
      return;
    }

    if (loggedInUser.role !== "instructor") {
      if (!propUser) {
        navigationFunction("/", { replace: true });
      }
      return;
    }

    fetchGroupsData();
  }, [
    loggedInUser,
    assignmentId,
    navigationFunction,
    propUser,
    propAssignmentId,
  ]);

  const fetchGroupsData = async () => {
    try {
      setLoading(true);

      const groupsResponse = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`
      );

      if (!groupsResponse.ok) {
        throw new Error("Failed to fetch groups");
      }

      const groupsData = await groupsResponse.json();

      const submissionsResponse = await fetch(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?requester=${loggedInUser.id}`
      );

      if (!submissionsResponse.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const submissionsData = await submissionsResponse.json();

      const enhancedGroups = await Promise.all(
        groupsData.map(async (group) => {
          const membersResponse = await fetch(
            `http://127.0.0.1:8000/api/groups/${group.id}/`
          );
          const membersData = membersResponse.ok
            ? await membersResponse.json()
            : { students: [] };

          const membersWithDetails = await Promise.all(
            (membersData.students || []).map(async (member) => {
              const userResponse = await fetch(
                `http://127.0.0.1:8000/api/users/${member.id}/`
              );
              const userData = userResponse.ok
                ? await userResponse.json()
                : null;
              return {
                ...member,
                name: userData?.name || `User ${member.id}`,
                email: userData?.email || "",
              };
            })
          );

          const memberIds = membersWithDetails.map((member) => member.id);
          const groupSubmissions = submissionsData.filter((sub) =>
            memberIds.includes(sub.user)
          );

          const submittedMemberIds = [
            ...new Set(groupSubmissions.map((sub) => sub.user)),
          ];
          const submissionCount = submittedMemberIds.length;
          const totalMembers = membersWithDetails.length;
          const submissionPercentage =
            totalMembers > 0 ? (submissionCount / totalMembers) * 100 : 0;

          return {
            ...group,
            members: membersWithDetails,
            submissionCount,
            totalMembers,
            submissionPercentage,
            hasSubmissions: submissionCount > 0,
          };
        })
      );

      setGroups(enhancedGroups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserColor = (userId) => {
    return colors[userId % colors.length];
  };

  const handleViewGroup = (group) => {
    if (propNavigate) {
      console.log("View group clicked for group:", group.id);
    } else {
      navigationFunction("/group", {
        state: {
          user: loggedInUser,
          assignmentId: assignmentId,
          groupId: group.id,
        },
      });
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return "#28a745";
    if (percentage >= 50) return "#ffc107";
    return "#dc3545";
  };

  if (!loggedInUser || !assignmentId) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading group submission status...</div>
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
        <h2>Submission Status by Group</h2>
        <p>{groups.length} groups in this assignment</p>
      </div>

      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <h3>Total Groups</h3>
          <span className={styles.statNumber}>{groups.length}</span>
        </div>
        <div className={styles.statCard}>
          <h3>Complete Groups</h3>
          <span className={styles.statNumber}>
            {groups.filter((g) => g.submissionPercentage === 100).length}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Partial Submissions</h3>
          <span className={styles.statNumber}>
            {
              groups.filter(
                (g) =>
                  g.submissionPercentage > 0 && g.submissionPercentage < 100
              ).length
            }
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>No Submissions</h3>
          <span className={styles.statNumber}>
            {groups.filter((g) => g.submissionPercentage === 0).length}
          </span>
        </div>
      </div>

      <div className={styles.groupsGrid}>
        {groups.length === 0 ? (
          <div className={styles.noGroups}>
            No groups found for this assignment.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className={styles.groupCard}>
              <div className={styles.cardHeader}>
                <div className={styles.groupInfo}>
                  <h3>Group {group.id}</h3>
                  <p className={styles.memberCount}>
                    {group.totalMembers} member
                    {group.totalMembers !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className={styles.submissionStatus}>
                  <span className={styles.statusText}>
                    {group.submissionCount}/{group.totalMembers} submitted
                  </span>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${group.submissionPercentage}%`,
                        backgroundColor: getProgressBarColor(
                          group.submissionPercentage
                        ),
                      }}
                    />
                  </div>
                  <span className={styles.percentage}>
                    {Math.round(group.submissionPercentage)}%
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.membersSection}>
                  <span className={styles.membersLabel}>Group Members:</span>
                  <div className={styles.membersCircles}>
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className={styles.memberCircle}
                        style={{ backgroundColor: getUserColor(member.id) }}
                        title={`${member.name} (${member.email})`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.membersList}>
                  {group.members.map((member) => (
                    <div key={member.id} className={styles.memberItem}>
                      <div
                        className={styles.memberDot}
                        style={{ backgroundColor: getUserColor(member.id) }}
                      />
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberEmail}>{member.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.viewGroupButton}
                  onClick={() => handleViewGroup(group)}
                >
                  View Group
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
