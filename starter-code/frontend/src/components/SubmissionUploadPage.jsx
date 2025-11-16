import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Upload or replace a student's submission for a given assignment.
// Handles file input, preview, deadline restrictions, and submission API calls.
// Props received through useParams and location.state.

export default function SubmissionUploadPage() {
  const { assignmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const loggedInUser = location.state?.user;
  useEffect(() => {
    if (!loggedInUser) {
      navigate("/", { replace: true });
    }
  }, [loggedInUser, navigate]);

  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [existingFile, setExistingFile] = useState(null);

  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");

  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assignmentId || !loggedInUser) return;

    async function fetchData() {
      try {
        const resA = await fetch(`/api/assignments/${assignmentId}/`);
        if (!resA.ok) throw new Error("Failed to load assignment");
        const dataA = await resA.json();
        setAssignment(dataA);

        const deadline = new Date(dataA.submission_deadline);
        setIsPastDeadline(deadline < new Date());

        const resS = await fetch(
          `/api/assignments/${assignmentId}/submissions/?student=${loggedInUser.id}&current=true`
        );
        if (!resS.ok) throw new Error("Failed to load submission");
        const subs = await resS.json();
        if (subs.length > 0) {
          const sub = subs[0];
          setExistingSubmission(sub);

          const resF = await fetch(`/api/addfile/?submission=${sub.id}`);
          if (!resF.ok) throw new Error("Failed to load file");
          const files = await resF.json();
          if (files.length > 0) {
            const f = files[0];
            setExistingFile(f);
            setFileName(f.name);
            setFileContent(f.content);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [assignmentId, loggedInUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target.result);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    setUploading(true);
    setError("");

    try {
      let submissionIdToUse;

      if (!existingSubmission) {
        const payloadSub = {
          assignment: parseInt(assignmentId, 10),
          user: loggedInUser.id,
          is_current: true,
        };
        const resCreate = await fetch("/api/submit/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadSub),
        });
        if (!resCreate.ok) {
          throw new Error("Failed to create submission");
        }
        const newSub = await resCreate.json();
        submissionIdToUse = newSub.id;
        setExistingSubmission(newSub);
      } else {
        submissionIdToUse = existingSubmission.id;
      }

      if (existingFile) {
        const payloadFile = {
          submission: submissionIdToUse,
          name: fileName,
          content: fileContent,
        };
        const resUpdate = await fetch(`/api/addfile/${existingFile.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFile),
        });
        if (!resUpdate.ok) {
          throw new Error("Failed to replace file");
        }
        const updatedFile = await resUpdate.json();
        setExistingFile(updatedFile);
      } else {
        const payloadFile = {
          submission: submissionIdToUse,
          name: fileName,
          content: fileContent,
        };
        const resCreateFile = await fetch("/api/addfile/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFile),
        });
        if (!resCreateFile.ok) {
          throw new Error("Failed to upload file");
        }
        const newFile = await resCreateFile.json();
        setExistingFile(newFile);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading…</div>;
  }
  if (error) {
    return <div style={{ padding: "1rem", color: "red" }}>Error: {error}</div>;
  }
  if (!assignment) {
    return <div style={{ padding: "1rem" }}>Assignment not found.</div>;
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>{assignment.name}</h2>
      <p>{assignment.description}</p>
      <p>
        <strong>Released:</strong>{" "}
        {new Date(assignment.release_date).toLocaleString()}
      </p>
      <p>
        <strong>Due:</strong>{" "}
        {new Date(assignment.submission_deadline).toLocaleString()}
      </p>

      {existingSubmission && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Existing Submission</h3>
          {existingFile ? (
            <div>
              <p>
                <strong>File Name:</strong> {existingFile.name}
              </p>
              <pre
                style={{
                  background: "#f7f7f7",
                  padding: "0.5rem",
                  whiteSpace: "pre-wrap",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {existingFile.content}
              </pre>
            </div>
          ) : (
            <p>No file attached yet.</p>
          )}
        </div>
      )}

      {isPastDeadline ? (
        <p style={{ color: "red", marginTop: "1rem" }}>
          The due date has passed. You can no longer upload or replace a
          submission.
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          <h3>{existingFile ? "Replace File" : "Upload File"}</h3>
          <input
            type="file"
            accept=".txt,.py,.js,.java,.cpp"
            onChange={handleFileChange}
          />
          {fileContent && (
            <div style={{ marginTop: "0.5rem" }}>
              <p>
                <strong>Preview:</strong>
              </p>
              <pre
                style={{
                  background: "#f7f7f7",
                  padding: "0.5rem",
                  whiteSpace: "pre-wrap",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {fileContent}
              </pre>
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || !fileContent}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              cursor: uploading || !fileContent ? "not-allowed" : "pointer",
              background: "#dbaa48",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {uploading
              ? "Uploading…"
              : existingFile
              ? "Replace Submission"
              : "Upload Submission"}
          </button>
        </div>
      )}
    </div>
  );
}
