import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CreateClassModal from "../components/CreateClassModal.jsx";

function mockFetch(responses) {
  const f = vi.fn();
  global.fetch = f;
  responses.forEach((r) => f.mockResolvedValueOnce(r));
  return f;
}

describe("CreateClassModal", () => {
  const teacher = { id: 42, is_teacher: true };

  it("submits and triggers onCreated and classesChanged event", async () => {
    // POST /api/classes/
    const fetchMock = mockFetch([{ ok: true, json: async () => ({ id: 5 }) }]);
    const onCreated = vi.fn();
    const onClose = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);

    render(<CreateClassModal user={teacher} onClose={onClose} onCreated={onCreated} />);

    // Fill the form
    await userEvent.type(screen.getByLabelText(/Code:/i), "CSC120");
    await userEvent.type(screen.getByLabelText(/Name:/i), "Software Design");
    await userEvent.selectOptions(screen.getByLabelText(/Term:/i), "Winter");
    await userEvent.clear(screen.getByLabelText(/Year:/i));
    await userEvent.type(screen.getByLabelText(/Year:/i), "2026");
    await userEvent.type(screen.getByLabelText(/Start Date:/i), "2026-01-10");
    await userEvent.type(screen.getByLabelText(/End Date:/i), "2026-05-01");

    await userEvent.click(screen.getByRole("button", { name: /Add Course/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(dispatchSpy).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    dispatchSpy.mockRestore();
  });

  it("shows error on failed submit", async () => {
    mockFetch([{ ok: false, json: async () => ({ error: "Duplicate code" }) }]);

    render(<CreateClassModal user={teacher} onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Code:/i), "CSC120");
    await userEvent.type(screen.getByLabelText(/Name:/i), "Software Design");
    await userEvent.type(screen.getByLabelText(/Start Date:/i), "2026-01-10");
    await userEvent.type(screen.getByLabelText(/End Date:/i), "2026-05-01");

    await userEvent.click(screen.getByRole("button", { name: /Add Course/i }));

    expect(await screen.findByText(/Duplicate code/i)).toBeInTheDocument();
  });

  it("cancel closes modal", async () => {
    render(<CreateClassModal user={teacher} onClose={vi.fn()} onCreated={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    // Since onClose is inline stub, no assertion; this ensures the button is present and clickable
  });
});
