import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import CodeViewer from "./components/CodeViewer";

import styles from "./styles/HomePage.module.css";
import student from "../data/student.json";

function HomePage() {
  const [currentClass, setCurrentClass] = useState("CSC-120");
  const [currentAssignment, setCurrentAssignment] = useState("Assignment 1");
  const [currentStudent, setCurrentStudent] = useState("Student A");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  const selectedStudent = student.find((s) => s.name === currentStudent);

  return (
    <div className={styles.container}>
      <Topbar onToggleSidebar={toggleSidebar} classTitle={currentClass} />
      <Navbar
        students={student.map((s) => s.name)}
        currentStudent={currentStudent}
        onSelectStudent={setCurrentStudent}
      />

      <div className={styles.main}>
        {sidebarVisible && (
          <Sidebar
            currentClass={currentClass}
            setCurrentClass={setCurrentClass}
            currentAssignment={currentAssignment}
            setCurrentAssignment={setCurrentAssignment}
          />
        )}

        <div className={styles.content}>
          <CodeViewer
            code={selectedStudent?.code || "No code available."}
            studentId={currentStudent}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
