import React, { useState } from "react";
import styles from "../styles/ClassView.module.css";

const TERMS = ["Winter", "Spring", "Fall"];

export default function CreateClassModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    term: TERMS[0],
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, teacher: user.id };
      const res = await fetch("http://127.0.0.1:8000/api/classes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Status ${res.status}`);
      }
      onCreated && onCreated();
      // Notify other parts of the app that classes changed (so Sidebar can refresh)
      try {
        window.dispatchEvent(new Event("classesChanged"));
      } catch (e) {
        // ignore in non-browser environments
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalPane}>
        <h2>Add a Course</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Code:
            <input name="code" value={form.code} onChange={handleChange} required />
          </label>
          <label>
            Name:
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Term:
            <select name="term" value={form.term} onChange={handleChange} required>
              {TERMS.map((term) => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </label>
          <label>
            Year:
            <input name="year" type="number" value={form.year} onChange={handleChange} required />
          </label>
          <label>
            Start Date:
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
          </label>
          <label>
            End Date:
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.modalActions}>
            <button type="submit" disabled={loading}>Add Course</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
