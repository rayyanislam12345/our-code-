import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignmentCreationModal from "../components/AssignmentCreationModal.jsx";
import { vi } from "vitest";

function setupFetchMocks() {
  const fetchMock = vi.fn();
  global.fetch = fetchMock;
  return fetchMock;
}

describe("AssignmentCreationModal", () => {
  const teacher = { id: 1, is_teacher: true };

  it("renders for teacher and loads classes", async () => {
    const fetchMock = setupFetchMocks();
    // classes list
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 10, code: "CS101", name: "Intro" }]) });

    render(<AssignmentCreationModal user={teacher} onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(await screen.findByText(/Create Assignment/i)).toBeInTheDocument();
    // Class select should have option from fetch
    expect(await screen.findByRole("option", { name: /CS101: Intro/i })).toBeInTheDocument();
  });

  it("validates required fields before submit", async () => {
    const fetchMock = setupFetchMocks();
    // classes list
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 10, code: "CS101", name: "Intro" }]) });

    render(<AssignmentCreationModal user={teacher} onClose={vi.fn()} onCreated={vi.fn()} />);

    const createBtn = await screen.findByRole("button", { name: /Create/i });
    await userEvent.click(createBtn);

    expect(await screen.findByText(/Please select a class/i)).toBeInTheDocument();

  await userEvent.selectOptions(screen.getByRole("combobox"), ["10"]);
    await userEvent.click(createBtn);
  expect(await screen.findByText(/Please provide a name/i)).toBeInTheDocument();
  });

  it("submits and calls onCreated, dispatches event", async () => {
    const fetchMock = setupFetchMocks();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 10, code: "CS101", name: "Intro" }]) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 99 }) });

  const onCreated = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);

    render(<AssignmentCreationModal user={teacher} onClose={vi.fn()} onCreated={onCreated} />);

  // Wait for options to arrive from async fetch
  await screen.findByRole("option", { name: /CS101: Intro/i });
  await userEvent.selectOptions(screen.getByRole("combobox"), ["10"]);
  // The first textbox is the Name input 
  const [nameInput] = screen.getAllByRole("textbox");
  await userEvent.type(nameInput, "HW1");

    await userEvent.click(await screen.findByRole("button", { name: /Create/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(dispatchSpy).toHaveBeenCalled();

    dispatchSpy.mockRestore();
  });

  it("cancel closes modal", async () => {
    const fetchMock = setupFetchMocks();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ([])});

    const onClose = vi.fn();
    render(<AssignmentCreationModal user={teacher} onClose={onClose} />);

    await userEvent.click(await screen.findByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
