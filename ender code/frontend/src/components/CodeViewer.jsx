import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/CodeViewer.module.css";

// Displays code with line numbers and allows inline comment annotations.
// Supports nested comment threads and text highlighting.
// Props:
// - code, displayedUserId, displayedUserName, submissionId,
//   submissionFileId, currentUserId.

export default function CodeViewer({
  isTeacher,
  code,
  displayedUserId,
  displayedUserName,
  submissionId,
  submissionFileId,
  currentUserId,
  commentingDeadline,
  assignmentId,
  selectedCommentId,
}) {
  const navigate = useNavigate();
  const lines = (code || "").split("\n");
  const lineHeight = 24;
  const codeBlockRef = useRef(null);

  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [showAddButton, setShowAddButton] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [selectedText, setSelectedText] = useState("");

  const [comments, setComments] = useState([]);
  const [names, setNames] = useState([]);

  const [activeReplyTo, setActiveReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [activeEdit, setActiveEdit] = useState(null);
  const [editText, setEditText] = useState("");

  const [activeCommentId, setActiveCommentId] = useState(null);
  const commentRefs = useRef({});

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setShowAddButton(false);
        return;
      }
      if (codeBlockRef.current.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const blockRect = codeBlockRef.current.getBoundingClientRect();
        setButtonPos({
          x: rect.right - blockRect.left,
          y: rect.top - blockRect.top - 30,
        });
        setSelectionRange(range);
        // Deadlines don't affect professors
        const canComment =
          isTeacher || new Date() < new Date(commentingDeadline);
        setShowAddButton(canComment);
      } else {
        setShowAddButton(false);
      }
    };

    const el = codeBlockRef.current;
    el.addEventListener("mouseup", handleMouseUp);
    return () => el.removeEventListener("mouseup", handleMouseUp);
  }, [commentingDeadline, isTeacher]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isHighlight = e.target.closest('[id^="highlight-"]');
      const isComment = e.target.closest('[id^="comment-"]');
      if (!isHighlight && !isComment) {
        setActiveCommentId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchComments() {
      if (!submissionFileId || !submissionId) return;

      try {
        const res = await fetch(`/api/submit/${submissionId}/`);
        const response = await res.json();
        const allComments = response.comments;

        const filtered = allComments.filter(
          (c) => c.submission_file === submissionFileId
        );

        const structured = filtered.map((c) => {
          const fallbackTop = c.start_line * lineHeight;
          const topOffset =
            typeof c.top_offset === "number" ? c.top_offset : fallbackTop;

          return {
            id: c.id,
            text: c.comment,
            timestamp: c.created_at || c.timestamp,
            startLine: c.start_line,
            endLine: c.end_line,
            startOffset: c.start_offset,
            endOffset: c.end_offset,
            topOffset,
            parent: c.parent,
            user: c.user,
            replies: [],
          };
        });

        const nested = [];
        const lookup = {};
        structured.forEach((comment) => {
          lookup[comment.id] = comment;
        });
        structured.forEach((comment) => {
          if (comment.parent) {
            const parent = lookup[comment.parent];
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(comment);
            }
          } else {
            nested.push(comment);
          }
        });

        setComments(nested);
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    }

    fetchComments();
  }, [submissionFileId, submissionId, displayedUserId]);

  // If a specific comment was selected from elsewhere, scroll to it and highlight
  useEffect(() => {
    if (!selectedCommentId || comments.length === 0) return;
    setActiveCommentId(selectedCommentId);
    const el =
      document.getElementById(`comment-${selectedCommentId}`) ||
      document.getElementById(`highlight-${selectedCommentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedCommentId, comments]);

  // Get users' names to add to comments
  useEffect(() => {
    const getNames = async () => {
      const response = await fetch(`http://localhost:8000/api/users/`);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const users = await response.json();
      const namesMap = {};
      users.forEach((user) => {
        namesMap[user.id] = user.name;
      });
      setNames(namesMap);
    };
    getNames();
  }, []);

  const getLineIndex = (node) => {
    let el = node;
    while (el && el.tagName !== "LI") el = el.parentElement;
    return el?.dataset.line != null ? parseInt(el.dataset.line, 10) : null;
  };

  const deleteComment = async (commentToDelete, isReply) => {
    try {
      if (commentToDelete.replies.length !== 0) {
        const res = await fetch(`/api/addcomment/${commentToDelete.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: "[removed]",
          }),
        });
        if (!res.ok) {
          throw new Error(
            `Failed to delete comment. Response status: ${res.status}`
          );
        }

        const newComments = comments.map((c) => {
          if (c.id === commentToDelete.id) {
            return { ...c, text: "[removed]" };
          }
          return c;
        });
        // console.log(newComments);

        setComments(newComments);
      } else {
        const res = await fetch(`/api/addcomment/${commentToDelete.id}/`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error(
            `Failed to delete comment. Response status: ${res.status}`
          );
        }
        let newComments;
        if (isReply) {
          newComments = comments.map((c) => {
            const newReplies = c.replies.filter(
              (r) => r.id !== commentToDelete.id
            );
            return { ...c, replies: newReplies };
          });
        } else {
          newComments = comments.filter((c) => c.id !== commentToDelete.id);
        }

        setComments(newComments);
      }
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const submitComment = async () => {
    if (!selectedText.trim() || !commentText.trim()) return;

    const rect = selectionRange.getBoundingClientRect();
    const blockRect = codeBlockRef.current.getBoundingClientRect();
    const topOffset = rect.top - blockRect.top;

    const startLine = getLineIndex(selectionRange.startContainer);
    const endLine = getLineIndex(selectionRange.endContainer);
    const startOffset = selectionRange.startOffset;
    const endOffset = selectionRange.endOffset;

    const payload = {
      submission: submissionId,
      submission_file: submissionFileId,
      user: currentUserId,
      comment: commentText.trim(),
      start_line: startLine,
      end_line: endLine,
      start_offset: startOffset,
      end_offset: endOffset,
      parent: null,
    };

    try {
      const res = await fetch("/api/addcomment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const newComment = {
        id: data.id,
        text: data.comment,
        timestamp: data.created_at || data.timestamp,
        startLine: data.start_line,
        endLine: data.end_line,
        startOffset: data.start_offset,
        endOffset: data.end_offset,
        topOffset:
          typeof data.top_offset === "number"
            ? data.top_offset
            : data.start_line * lineHeight,
        parent: null,
        user: data.user,
        replies: [],
      };

      setComments([...comments, newComment]);
    } catch (err) {
      console.error("Failed to submit comment", err);
    }

    setShowCommentBox(false);
    setShowAddButton(false);
    setCommentText("");
    setSelectedText("");
    window.getSelection().removeAllRanges();
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return;

    const payload = {
      submission: submissionId,
      submission_file: submissionFileId,
      user: currentUserId,
      comment: replyText.trim(),
      start_line: 0,
      end_line: 0,
      start_offset: 0,
      end_offset: 0,
      parent: parentId,
    };

    try {
      const res = await fetch("/api/addcomment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      const newComments = comments.map((c) => {
        if (c.id === parentId) {
          const newReply = {
            id: data.id,
            text: data.comment,
            timestamp: data.created_at || data.timestamp,
            startLine: data.start_line,
            endLine: data.end_line,
            startOffset: data.start_offset,
            endOffset: data.end_offset,
            topOffset:
              typeof data.top_offset === "number"
                ? data.top_offset
                : data.start_line * lineHeight,
            parent: data.parent,
            user: data.user,
            replies: [],
          };

          const newReplies = [...c.replies];
          newReplies.push(newReply);

          return {
            ...c,
            replies: newReplies,
          };
        }
        // else return original comment
        return c;
      });
      setComments(newComments);
    } catch (err) {
      console.error("Failed to submit reply", err);
    }

    setActiveReplyTo(null);
    setReplyText("");
  };

  const cancelReply = () => {
    setActiveReplyTo(null);
    setReplyText("");
  };

  const submitEdit = async (id, isReply) => {
    try {
      const res = await fetch(`/api/addcomment/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: editText.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(`Response status: ${res.status}`);
      }

      let newComments;
      if (isReply) {
        newComments = comments.map((comment) => {
          const replyToUpdate = comment.replies.find((r) => r.id === id);

          if (replyToUpdate) {
            const newReplies = comment.replies.map((r) => {
              if (r.id === id) {
                return { ...r, text: editText.trim() };
              }
              return r;
            });

            return {
              ...comment,
              replies: newReplies,
            };
          }
          return comment;
        });
      } else {
        newComments = comments.map((comment) => {
          if (comment.id === id) {
            return {
              ...comment,
              text: editText.trim(),
            };
          }
          return comment;
        });
      }

      setComments(newComments);
    } catch (err) {
      console.error("Failed to submit reply", err);
    }

    setActiveEdit(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setActiveEdit(null);
    setEditText("");
  };

  const positionedComments = useMemo(() => {
    const sorted = [...comments].sort((a, b) => a.startLine - b.startLine);
    const buffer = 10;
    let lastBottom = 0;

    return sorted.map((c) => {
      const el = commentRefs.current[c.id];
      const height = el?.offsetHeight || 60;
      const fallbackOffset = c.startLine * lineHeight;

      const top = Math.max(fallbackOffset, lastBottom + buffer);
      lastBottom = top + height;
      return { ...c, adjustedTop: top };
    });
  }, [comments]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.codeBlock} ref={codeBlockRef}>
          <ol className={styles.lineNumbers}>
            {lines.map((line, i) => {
              const lineComments = comments.filter(
                (c) => i >= c.startLine && i <= c.endLine
              );
              const ranges = [];
              lineComments.forEach((c) => {
                const single = c.startLine === c.endLine;
                const start = single
                  ? c.startOffset
                  : i === c.startLine
                  ? c.startOffset
                  : 0;
                const end = single
                  ? c.endOffset
                  : i === c.endLine
                  ? c.endOffset
                  : line.length;
                if (start < end) {
                  ranges.push({ ...c, start, end });
                }
              });

              ranges.sort((a, b) => a.start - b.start);
              const merged = [];
              let lastEnd = -1;
              ranges.forEach((r) => {
                if (r.start < lastEnd) return;
                merged.push(r);
                lastEnd = r.end;
              });

              const segments = [];
              let cursor = 0;
              merged.forEach((r, idx) => {
                if (cursor < r.start)
                  segments.push(line.slice(cursor, r.start));
                segments.push(
                  <span
                    id={`highlight-${r.id}`}
                    key={`hl-${i}-${r.id}-${idx}`}
                    className={`${styles.highlight} ${
                      activeCommentId === r.id ? styles.activeHighlight : ""
                    }`}
                    onClick={() => {
                      const card = document.getElementById(`comment-${r.id}`);
                      if (card)
                        card.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      setActiveCommentId(r.id);
                    }}
                  >
                    {line.slice(r.start, r.end)}
                  </span>
                );
                cursor = r.end;
              });
              if (cursor < line.length) segments.push(line.slice(cursor));

              return (
                <li key={i} data-line={i}>
                  <code>{segments}</code>
                </li>
              );
            })}
          </ol>

          {showAddButton && !showCommentBox && (
            <button
              className={styles.addCommentButton}
              style={{
                "--btn-top": `${buttonPos.y}px`,
                "--btn-left": `${buttonPos.x}px`,
              }}
              onClick={() => {
                setSelectedText(window.getSelection().toString());
                setShowCommentBox(true);
              }}
            >
              +
            </button>
          )}

          {showCommentBox && (
            <div
              className={styles.commentBox}
              style={{
                "--box-top": `${buttonPos.y + 20}px`,
                "--box-left": `${buttonPos.x}px`,
              }}
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your comment…"
              />
              <div className={styles.commentActions}>
                <button onClick={submitComment}>Submit</button>
                <button
                  onClick={() => {
                    setShowCommentBox(false);
                    setShowAddButton(false);
                    setCommentText("");
                    setSelectedText("");
                    window.getSelection().removeAllRanges();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.commentArea}>
        {positionedComments.map((c) => (
          <div
            key={c.id}
            id={`comment-${c.id}`}
            ref={(el) => (commentRefs.current[c.id] = el)}
            className={`${styles.commentCard} ${
              activeCommentId === c.id ? styles.activeCard : ""
            }`}
            style={{ "--card-top": `${c.adjustedTop}px` }}
            onClick={() => {
              const hl = document.getElementById(`highlight-${c.id}`);
              if (hl)
                hl.scrollIntoView({ behavior: "smooth", block: "center" });
              setActiveCommentId(c.id);
            }}
          >
            <p>
              {isTeacher ? (
                <span
                  className={styles.linkButton}
                  onClick={() =>
                    navigate(`/student-comments/${c.user}`, {
                      state: {
                        user: { id: currentUserId, is_teacher: isTeacher },
                        assignmentId,
                      },
                    })
                  }
                >
                  {names[c.user]}
                </span>
              ) : (
                names[c.user]
              )}
            </p>

            {activeEdit === c.id ? (
              <div className={styles.replyBox}>
                <textarea
                  className={styles.replyTextarea}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className={styles.replyActions}>
                  <button onClick={() => submitEdit(c.id, false)}>
                    Submit
                  </button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <p>{c.text}</p>
            )}
            <small>{c.timestamp}</small>
            {c.replies.length > 0 && (
              <div className={styles.repliesContainer}>
                {c.replies.map((r) => (
                  <div key={r.id} className={styles.replyBubble}>
                    <p>
                      {isTeacher ? (
                        <span
                          className={styles.linkButton}
                          onClick={() =>
                            navigate(`/student-comments/${r.user}`, {
                              state: {
                                user: {
                                  id: currentUserId,
                                  is_teacher: isTeacher,
                                },
                                assignmentId,
                              },
                            })
                          }
                        >
                          {names[r.user]}
                        </span>
                      ) : (
                        names[r.user]
                      )}
                    </p>

                    {activeEdit === r.id ? (
                      <div className={styles.replyBox}>
                        <textarea
                          className={styles.replyTextarea}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className={styles.replyActions}>
                          <button onClick={() => submitEdit(r.id, true)}>
                            Submit
                          </button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p>{r.text}</p>
                    )}
                    <small>{r.timestamp}</small>
                    {(isTeacher ||
                      (r.user === currentUserId &&
                        new Date() < new Date(commentingDeadline))) && (
                      <button onClick={() => deleteComment(r, true)}>
                        Delete
                      </button>
                    )}
                    {r.user === currentUserId &&
                      (isTeacher ||
                        new Date() < new Date(commentingDeadline)) && (
                        <button
                          onClick={() => {
                            setActiveEdit(r.id);
                            setEditText(r.text);
                          }}
                        >
                          Edit
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
            {activeReplyTo === c.id && (
              <div className={styles.replyBox}>
                <textarea
                  className={styles.replyTextarea}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                />
                <div className={styles.replyActions}>
                  <button onClick={() => submitReply(c.id)}>Submit</button>
                  <button onClick={cancelReply}>Cancel</button>
                </div>
              </div>
            )}
            {(isTeacher || new Date() < new Date(commentingDeadline)) && (
              <button
                className={styles.replyButton}
                onClick={() => setActiveReplyTo(c.id)}
              >
                Reply
              </button>
            )}
            {(isTeacher ||
              (c.user === currentUserId &&
                new Date() < new Date(commentingDeadline))) && (
              <button onClick={() => deleteComment(c, false)}>Delete</button>
            )}
            {c.user === currentUserId &&
              (isTeacher || new Date() < new Date(commentingDeadline)) && (
                <button
                  onClick={() => {
                    setActiveEdit(c.id);
                    setEditText(c.text);
                  }}
                >
                  Edit
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
