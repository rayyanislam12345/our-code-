import { useState, useEffect } from "react";

// Assignment creation modal
// Props:
// - user: current user (should be a teacher)
// - defaultCourseId: pre-select this course if provided
// - onClose: function to call to close modal
// - onCreated: function called after successful creation

export default function AssignmentCreationModal({
  user,
  defaultCourseId,
  onClose,
  onCreated,
}) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(defaultCourseId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [commentingDeadline, setCommentingDeadline] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // load courses for this teacher
    async function loadCourses() {
      try {
        if (!user?.is_teacher) return;
        const res = await fetch(`http://127.0.0.1:8000/api/classes/?teacher=${user.id}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        setCourses(json);
        // do not auto-select the first course if defaultCourseId is not provided
        // keep courseId as defaultCourseId or blank
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      }
    }
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (defaultCourseId) setCourseId(defaultCourseId);
  }, [defaultCourseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!courseId) return setError("Please select a class");
    if (!name) return setError("Please provide a name");

    const payload = {
      course: courseId,
      name,
      description,
      release_date: releaseDate || null,
      submission_deadline: submissionDeadline || null,
      commenting_deadline: commentingDeadline || null,
    };

    try {
      setSubmitting(true);
      const res = await fetch("http://127.0.0.1:8000/api/assignments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create failed: ${res.status} ${txt}`);
      }
      const json = await res.json();
      onCreated && onCreated(json);
      // Notify other parts of the app (like Sidebar) that assignments changed
      try {
        window.dispatchEvent(new CustomEvent("assignmentsChanged", { detail: { courseId } }));
      } catch (e) {
        // ignore if window not available
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>Create Assignment</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!user?.is_teacher ? (
          <div>
            <p>Only teachers can create assignments.</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label>Class</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">-- Select class --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={fieldStyle}>
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div style={fieldStyle}>
              <label>Release Date</label>
              <input
                type="datetime-local"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>

            <div style={fieldStyle}>
              <label>Submission Deadline</label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
              />
            </div>

            <div style={fieldStyle}>
              <label>Commenting Deadline</label>
              <input
                type="datetime-local"
                value={commentingDeadline}
                onChange={(e) => setCommentingDeadline(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "1rem 1.25rem",
  borderRadius: "6px",
  width: "480px",
  maxWidth: "95%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  marginBottom: "0.75rem",
};
