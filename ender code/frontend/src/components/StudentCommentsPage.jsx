import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import styles from "../styles/StudentCommentsPage.module.css";

export default function StudentCommentsPage() {
	const navigate = useNavigate();
	const { studentId } = useParams();
	const { user, assignmentId } = useLocation().state || {};

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [comments, setComments] = useState([]);
	const [assignmentName, setAssignmentName] = useState("");
	const [courseName, setCourseName] = useState("");
	const [names, setNames] = useState({});
	const [page, setPage] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		if (!user || !assignmentId) navigate("/", { replace: true });
	}, [user, assignmentId, navigate]);

	useEffect(() => {
		(async () => {
			try {
				const [u, a] = await Promise.all([
					fetch("/api/users/"),
					assignmentId ? fetch(`/api/assignments/${assignmentId}/`) : null,
				]);
				if (u?.ok) {
					const users = await u.json();
					setNames(Object.fromEntries(users.map((x) => [x.id, x.name])));
				}
				if (a?.ok) {
					const aJson = await a.json();
					setAssignmentName(aJson.name || "");
					if (aJson.course) {
						const c = await fetch(`/api/classes/${aJson.course}/`);
						if (c.ok) setCourseName((await c.json()).name || "");
					}
				}
			} catch (_) {}
		})();
	}, [assignmentId]);

	useEffect(() => {
		(async () => {
			if (!assignmentId || !studentId) return;
			try {
				setLoading(true); setError(null);
				const r = await fetch(`/api/assignments/${assignmentId}/submissions/?student=${studentId}&requester=${user?.id}`);
				if (r.status === 403) { setError("Access restricted."); return; }
				const subs = await r.json();
				if (!subs?.length) { setComments([]); return; }
				const all = (await Promise.all(
					subs.map(async (s) => {
						try {
							const d = await (await fetch(`/api/submit/${s.id}/`)).json();
							return (d.comments || [])
								.filter((c) => c.user === Number(studentId))
								.map((c) => ({
									id: c.id,
									text: c.comment,
									startLine: c.start_line,
									endLine: c.end_line,
									timestamp: c.created_at || c.timestamp,
									submissionId: s.id,
									submissionFileId: c.submission_file,
								}));
						} catch { return []; }
					})
				)).flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
				setComments(all); setPage(1);
			} catch { setError("Failed to load data."); }
			finally { setLoading(false); }
		})();
	}, [assignmentId, studentId, user]);

	const open = (c) => navigate("/code-view", {
		state: {
			user,
			assignmentId,
			displayedUserId: Number(studentId),
			submissionId: c.submissionId,
			submissionFileId: c.submissionFileId,
			selectedCommentId: c.id,
		},
	});

	const total = Math.ceil(comments.length / pageSize);
	return (
		<div className={styles.container}>
			<h2 className={styles.title}>Comments by {names[studentId] || "Student"}</h2>
			{loading && <p>Loading…</p>}
			{error && <p className={styles.error}>{error}</p>}
			{!loading && !error && !comments.length && <p>No comments.</p>}
			{!loading && !error && comments.length > 0 && (
				<div className={styles.pagination}>
					<span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, comments.length)} of {comments.length}</span>
					<div className={styles.pageButtons}>
						<button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
						{[...Array(total)].map((_, i) => (
							<button key={i} className={i + 1 === page ? styles.pageActive : ""} onClick={() => setPage(i + 1)}>
								{i + 1}
							</button>
						))}
						<button disabled={page >= total} onClick={() => setPage(page + 1)}>Next</button>
					</div>
				</div>
			)}
			<ul className={styles.list}>
				{comments.slice((page - 1) * pageSize, page * pageSize).map((c) => (
					<li key={c.id} className={styles.item} onClick={() => open(c)}>
						<div className={styles.meta}>
							<span>Lines {c.startLine}–{c.endLine}</span>
							<span>{c.timestamp}</span>
						</div>
						<div className={styles.assignmentMeta}>
							{courseName} &gt; {assignmentName} &gt; {names[studentId] || "Student"}
						</div>
						<p>{c.text}</p>
					</li>
				))}
			</ul>
			<div className={styles.actions}>
				<button onClick={() => navigate(-1)}>Back</button>
			</div>
		</div>
	);
}

