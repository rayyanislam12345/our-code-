import { useState, useEffect } from "react";

import styles from "../styles/ProfStats.module.css";

// When a professor clicks on an assignment, this component is rendered.
// Displays three statistics: Number of submissions, number of unique students who have commented, and total number of comments

const getSubmissions = async (id, setSubmissions) => {
  const url =
    "http://127.0.0.1:8000/api/assignments/" +
    id.assignmentId +
    "/submissions/";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Status ${response.status}`);
  const json = await response.json();
  setSubmissions(json);
};

const getComments = (submissions) => {
  return submissions.reduce((totalComments, submission) => {
    return totalComments + submission.comments.length;
  }, 0);
};

const getUniqueComments = (comments) => {
  let ids = [];
  comments.map((comment) => {
    if (!ids.includes(comment.user)) {
      ids.push(comment.user);
    }
  });
  return ids.length;
};

function ProfStats(assignmentId) {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    getSubmissions(assignmentId, setSubmissions);
  }, [assignmentId]);

  return (
    <div className={styles.ProfStats}>
      <div className={styles.statBlock}>
        <h1 className={styles.number}>
          {submissions.length /* total number of submissions */}
        </h1>
        <p className={styles.description}>Submissions</p>
      </div>
      <div className={styles.statBlock}>
        <h1 className={styles.number}>
          {
            submissions.length === 0
              ? 0
              : getUniqueComments(
                  submissions
                ) /* number of students who have commented*/
          }
        </h1>
        <p className={styles.description}>Students have commented</p>
      </div>
      <div className={styles.statBlock}>
        <h1 className={styles.number}>
          {
            submissions.length === 0
              ? 0
              : getComments(submissions) /* total number of comments */
          }
        </h1>
        <p className={styles.description}>Total comments</p>
      </div>
    </div>
  );
}

export default ProfStats;
