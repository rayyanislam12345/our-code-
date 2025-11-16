import { useState, useEffect } from "react";
import styles from "../styles/ExtendDeadlineModal.module.css";

export default function ExtendDeadlineModal({ assignmentId, classId, originalDeadline, onClose, onSaved }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [applyAll, setApplyAll] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRoster() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}/roster/`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Failed to load roster", err);
        setError("Failed to load students");
      }
    }
    if (classId) loadRoster();
  }, [classId]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (!deadline) {
      setError("Please choose a new deadline");
      return;
    }

    // Frontend validation: ensure extended deadline is after original
    const extendedDate = new Date(deadline);
    const originalDate = new Date(originalDeadline);
    if (extendedDate <= originalDate) {
      setError("Extended deadline must be after the original submission deadline");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        extended_deadline: extendedDate.toISOString(),
        ...(applyAll ? { all: true } : { students: selected })
      };

      const res = await fetch(`http://127.0.0.1:8000/api/assignments/${assignmentId}/extensions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Status ${res.status}`);
      }

      const data = await res.json();
      setLoading(false);
      if (onSaved) onSaved(data);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to create extension");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalPane}>
        <h3>Extend Submission Deadline</h3>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.section}>
          <label>
            New Deadline:
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              setError("");
            }}
            required
          />
          <div className={styles.originalInfo}>
            Original deadline: {new Date(originalDeadline).toLocaleString()}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.applyAllLabel}>
            <input
              type="checkbox"
              checked={applyAll}
              onChange={(e) => {
                setApplyAll(e.target.checked);
                if (e.target.checked) setSelected([]);
                setError("");
              }}
            />
            Apply to entire class
          </label>
        </div>

        {!applyAll && (
          <div className={styles.section}>
            <label>
              Select Students 
            </label>
            <div className={styles.studentList}>
              {students.map((s) => (
                <div
                  key={s.id}
                  className={`${styles.studentRow} ${selected.includes(s.id) ? styles.selected : ""}`}
                  onClick={() => toggle(s.id)}
                >
                  <label className={styles.studentLabel}>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                    />
                    {s.name} ({s.email})
                  </label>
                </div>
              ))}
            </div>
            {!applyAll && selected.length === 0 && (
              <div className={styles.noSelected}>
                No students selected
              </div>
            )}
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            onClick={() => onClose()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={loading || (!applyAll && selected.length === 0)}
          >
            {loading ? "Saving..." : "Save Extension"}
          </button>
        </div>
      </div>
    </div>
  );
}
