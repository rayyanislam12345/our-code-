import { useState, useRef, useEffect, useMemo } from "react";
import styles from "../styles/CodeViewer.module.css";

// Displays code with line numbers and allows inline comment annotations.
// Supports nested comment threads and text highlighting.
// Props:
// - code, displayedUserId, displayedUserName, submissionId,
//   submissionFileId, currentUserId.

export default function CodeViewer({
  code,
  displayedUserId,
  displayedUserName,
  submissionId,
  submissionFileId,
  currentUserId,
}) {
  const lines = (code || "").split("\n");
  const lineHeight = 24;
  const codeBlockRef = useRef(null);

  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [showAddButton, setShowAddButton] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [selectedText, setSelectedText] = useState("");

  const [commentMap, setCommentMap] = useState({});
  const comments = commentMap[displayedUserId] || [];

  const [activeReplyTo, setActiveReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

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
        setShowAddButton(true);
      } else {
        setShowAddButton(false);
      }
    };

    const el = codeBlockRef.current;
    el.addEventListener("mouseup", handleMouseUp);
    return () => el.removeEventListener("mouseup", handleMouseUp);
  }, []);

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
        const res = await fetch(`/api/addcomment/`);
        const allComments = await res.json();

        const filtered = allComments.filter((c) => {
          return (
            c.submission_file === submissionFileId &&
            c.submission === submissionId
          );
        });

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

        setCommentMap((prev) => ({
          ...prev,
          [displayedUserId]: nested,
        }));
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    }

    fetchComments();
  }, [submissionFileId, submissionId, displayedUserId]);

  const getLineIndex = (node) => {
    let el = node;
    while (el && el.tagName !== "LI") el = el.parentElement;
    return el?.dataset.line != null ? parseInt(el.dataset.line, 10) : null;
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
      const newComment = await res.json();

      setCommentMap((prev) => {
        const prevComments = prev[displayedUserId] || [];
        const commentShape = {
          id: newComment.id,
          text: newComment.comment,
          timestamp: newComment.created_at || newComment.timestamp,
          startLine: newComment.start_line,
          endLine: newComment.end_line,
          startOffset: newComment.start_offset,
          endOffset: newComment.end_offset,
          topOffset:
            typeof newComment.top_offset === "number"
              ? newComment.top_offset
              : newComment.start_line * lineHeight,
          parent: null,
          user: newComment.user,
          replies: [],
        };
        return {
          ...prev,
          [displayedUserId]: [...prevComments, commentShape],
        };
      });
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
      const reply = await res.json();

      setCommentMap((prev) => {
        const updated = (prev[displayedUserId] || []).map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  ...(c.replies || []),
                  {
                    id: reply.id,
                    text: reply.comment,
                    timestamp: reply.created_at || reply.timestamp,
                    startLine: reply.start_line,
                    endLine: reply.end_line,
                    startOffset: reply.start_offset,
                    endOffset: reply.end_offset,
                    topOffset:
                      typeof reply.top_offset === "number"
                        ? reply.top_offset
                        : reply.start_line * lineHeight,
                    parent: reply.parent,
                    user: reply.user,
                    replies: [],
                  },
                ],
              }
            : c
        );
        return { ...prev, [displayedUserId]: updated };
      });
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
              style={{ top: buttonPos.y, left: buttonPos.x }}
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
              style={{ top: buttonPos.y + 20, left: buttonPos.x }}
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
            style={{ top: c.adjustedTop }}
            onClick={() => {
              const hl = document.getElementById(`highlight-${c.id}`);
              if (hl)
                hl.scrollIntoView({ behavior: "smooth", block: "center" });
              setActiveCommentId(c.id);
            }}
          >
            <p>{c.text}</p>
            <small>{c.timestamp}</small>
            <button
              className={styles.replyButton}
              onClick={() => setActiveReplyTo(c.id)}
            >
              Reply
            </button>
            {c.replies.length > 0 && (
              <div className={styles.repliesContainer}>
                {c.replies.map((r) => (
                  <div key={r.id} className={styles.replyBubble}>
                    <p>{r.text}</p>
                    <small>{r.timestamp}</small>
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
          </div>
        ))}
      </div>
    </div>
  );
}
