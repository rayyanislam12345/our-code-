import { useState, useEffect } from "react";

import styles from "../styles/ClassView.module.css";

// Fetches and displays a list of classes associated with the user (teacher or student).
// Props:
// - is_Teacher: boolean indicating user role.
// - courseId: user ID used to fetch classes.
// - swap: function to change the view/page.
// - setCurrentClass: function to set the selected class.



const getClass = async (setClass, is_Teacher, id) => {
  const user = is_Teacher ? "teacher" : "student";
  const url = `http://127.0.0.1:8000/api/classes/?${user}=${id}`;
  console.log("Fetching classes from:", url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const json = await response.json();
  console.log("Class JSON:", json);
  setClass(json);
};

function ClassView({ is_Teacher, courseId, swap, setCurrentClass }) {
  const [classes, setClass] = useState([]);

  useEffect(() => {
    getClass(setClass, is_Teacher, courseId);
  }, [is_Teacher, courseId]);

  const titleItems = classes.map((title) => (
    <li key={title.id} data-testid="title" className={styles.child}>
      <h2 className={styles.title}>
        {title.code}: {title.name}
      </h2>
      <p className={styles.term}>
        Term: {title.term} {title.year}
      </p>
      <button
        className={styles.viewmore}
        onClick={() => {
          setCurrentClass(title);
          swap("project");
        }}
      >
        View Details
      </button>
    </li>
  ));

  return <ul className={styles.container}>{titleItems}</ul>;
}

export default ClassView;