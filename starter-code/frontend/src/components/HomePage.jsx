import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ProjectView from "./ProjectView";
import ClassView from "./ClassView";
import CodeViewer from "./CodeViewer";
import styles from "../styles/HomePage.module.css";

// The main dashboard after login.
// Displays a sidebar and toggles between project, info, code, and class views.
// Props received through `location.state`: user.

export default function HomePage() {
  const location = useLocation();
  const user = location.state?.user;

  const [currentClass, setCurrentClass] = useState(null);

  const [currentProject, setCurrentProject] = useState(null);

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [page, setPage] = useState();

  const handleClick = (pageState) => {
    setPage(pageState);
  };

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  if (!user) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>Error: No user found</h2>
        <p>Please go back to the login screen and select a user.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Topbar
        onToggleSidebar={toggleSidebar}
        classTitle={
          currentClass
            ? `${currentClass.code}: ${currentClass.name}`
            : "Select a class"
        }
      />

      <div className={styles.main}>
        {sidebarVisible && (
          <Sidebar
            user={user}
            currentClass={currentClass?.id}
            setCurrentClass={setCurrentClass}
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
            setPage={setPage}
          />
        )}

        {(() => {
          switch (page) {
            case "project":
              return (
                <ProjectView
                  courseId={currentClass.id}
                  swap={handleClick}
                />
              );

            case "info":
              return <ProjectView handleClick={handleClick} />;

            case "code":
              return <CodeViewer handleClick={handleClick} />;

            default:
              return (
                <ClassView
                  is_Teacher={user.is_teacher}
                  courseId={user.id}
                  swap={handleClick}
                  setCurrentClass={setCurrentClass}
                />
              );
          }
        })()}
      </div>
    </div>
  );
}