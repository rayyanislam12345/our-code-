import { Routes, Route } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import AssignmentInfoPage from "./components/AssignmentInfoPage";
import SubmissionUploadPage from "./components/SubmissionUploadPage";
import CodeViewPage from "./components/CodeViewPage";
import GroupPage from "./components/GroupPage";
import CreateGroupPage from "./components/CreateGroupPage";
import AssignmentGroupsPage from "./components/AssignmentGroupsPage";
import StudentCommentsPage from "./components/StudentCommentsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/assignments/:id" element={<AssignmentInfoPage />} />
      <Route
        path="/assignments/:assignmentId/submit"
        element={<SubmissionUploadPage />}
      />
      <Route path="/code-view" element={<CodeViewPage />} />
      <Route path="/group-comments" element={<GroupPage />} />
      <Route
        path="/assignments/:assignmentId/groups"
        element={<AssignmentGroupsPage />}
        
      />

            <Route
        path="/assignments/:assignmentId"
        element={<AssignmentInfoPage />}
      />

      <Route path="/create-group" element={<CreateGroupPage />} />
      <Route
        path="/student-comments/:studentId"
        element={<StudentCommentsPage />}
      />
    </Routes>
  );
}

export default App;
