import { Routes, Route } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import ProjectInfoPage from "./components/ProjectInfoPage";
import SubmissionUploadPage from "./components/SubmissionUploadPage";
import CodeViewPage from "./components/CodeViewPage";
import GroupPage from "./components/GroupPage";
import AssignmentGroupsPage from "./components/AssignmentGroupsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/projects/:id" element={<ProjectInfoPage />} />
      <Route
        path="/projects/:assignmentId/submit"
        element={<SubmissionUploadPage />}
      />
      <Route path="/code-view" element={<CodeViewPage />} />
      <Route path="/group-comments" element={<GroupPage />} />
      <Route
        path="/assignments/:assignmentId/groups"
        element={<AssignmentGroupsPage />}
      />
    </Routes>
  );
}

export default App;
