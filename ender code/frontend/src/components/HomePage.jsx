import { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AssignmentView from "./AssignmentView";
import ClassView from "./ClassView";
import CodeViewer from "./CodeViewer";
import CreateClassModal from "./CreateClassModal";
import styles from "../styles/HomePage.module.css";

// The main dashboard after login.
// Displays a sidebar and toggles between assignment, info, code, and class views.
// Props received through `location.state`: user.

export default function HomePage() {
  const location = useLocation();
  var [user, setUser] = useState(location.state?.user);

  const [currentClass, setCurrentClass] = useState(null);

  const [currentAssignment, setCurrentAssignment] = useState(null);

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [page, setPage] = useState();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleClick = (pageState) => {
    setPage(pageState);
  };

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  if (!user) {
    return(<Navigate to="/"/>)
  };

  return (
    <div className={styles.container}>
      <Topbar
        onToggleSidebar={toggleSidebar}
        classTitle={
          currentClass
            ? `${currentClass.code}: ${currentClass.name}`
            : "Select a class"
        }
        setUser={setUser}
      />

      <div className={styles.main}>
        {sidebarVisible && (
          <Sidebar
            user={user}
            currentClass={currentClass?.id}
            setCurrentClass={setCurrentClass}
            currentAssignment={currentAssignment}
            setCurrentAssignment={setCurrentAssignment}
            setPage={setPage}
            setShowCreateModal={setShowCreateModal}
          />
        )}

        {(() => {
          switch (page) {
            case "assignment":
              return (
                <AssignmentView courseId={currentClass?.id} swap={handleClick} user={user} />
              );

            case "info":
              return <AssignmentView handleClick={handleClick} />;

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
        {user.is_teacher && showCreateModal && (
          <CreateClassModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              // Optionally refresh classes here
            }}
          />
        )}
      </div>
    </div>
  );
}
