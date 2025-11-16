import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ExtendDeadlineModal from "../components/ExtendDeadlineModal.jsx";

function setupFetchSequence(responses) {
  const fetchMock = vi.fn();
  global.fetch = fetchMock;
  responses.forEach((res) => fetchMock.mockResolvedValueOnce(res));
  return fetchMock;
}

const iso = (s) => new Date(s).toISOString();

describe("ExtendDeadlineModal", () => {
  const assignmentId = 7;
  const classId = 3;
  const originalDeadline = iso("2025-11-10T00:00:00Z");

  it("loads roster and lists students", async () => {
    setupFetchSequence([
      { ok: true, json: async () => ([{ id: 1, name: "Alice", email: "a@x.com" }, { id: 2, name: "Bob", email: "b@x.com" }]) },
    ]);

    render(
      <ExtendDeadlineModal
        assignmentId={assignmentId}
        classId={classId}
        originalDeadline={originalDeadline}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(await screen.findByText(/Alice \(a@x.com\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob \(b@x.com\)/i)).toBeInTheDocument();
  });

  it("apply to entire class sends { all: true } and closes", async () => {
    const fetchMock = setupFetchSequence([
      { ok: true, json: async () => ([]) }, // roster
      { ok: true, json: async () => ({ ok: true }) }, // create extension
    ]);

    const onSaved = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <ExtendDeadlineModal
        assignmentId={assignmentId}
        classId={classId}
        originalDeadline={originalDeadline}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    await userEvent.click(await screen.findByLabelText(/Apply to entire class/i));

  const input = container.querySelector('input[type="datetime-local"]');
  expect(input).not.toBeNull();
    await userEvent.clear(input);
    await userEvent.type(input, "2025-12-01T00:00");

    await userEvent.click(screen.getByRole("button", { name: /Save Extension/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.all).toBe(true);
    expect(body.extended_deadline).toBe(new Date("2025-12-01T00:00").toISOString());
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("selecting students sends { students: [...] }", async () => {
    const fetchMock = setupFetchSequence([
      { ok: true, json: async () => ([{ id: 1, name: "Alice", email: "a@x.com" }, { id: 2, name: "Bob", email: "b@x.com" }]) },
      { ok: true, json: async () => ({ ok: true }) },
    ]);

    const { container } = render(
      <ExtendDeadlineModal
        assignmentId={assignmentId}
        classId={classId}
        originalDeadline={originalDeadline}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    // Select Alice only
    const list = await screen.findByText(/Alice \(a@x.com\)/i);
    await userEvent.click(list);

    const input = container.querySelector('input[type="datetime-local"]');
    expect(input).not.toBeNull();
    await userEvent.clear(input);
    await userEvent.type(input, "2025-12-05T09:30");

    await userEvent.click(screen.getByRole("button", { name: /Save Extension/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.students).toEqual([1]);
    expect(body.all).toBeUndefined();
  });

  it("cancel closes modal", async () => {
    setupFetchSequence([
      { ok: true, json: async () => ([]) }, // roster
    ]);

    const onClose = vi.fn();
    render(
      <ExtendDeadlineModal
        assignmentId={assignmentId}
        classId={classId}
        originalDeadline={originalDeadline}
        onClose={onClose}
        onSaved={vi.fn()}
      />
    );

    await userEvent.click(await screen.findByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
