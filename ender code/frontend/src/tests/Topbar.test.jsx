import { describe, expect, test, vi } from "vitest";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Topbar from "../components/Topbar.jsx";
import { MemoryRouter } from "react-router-dom";

describe("Topbar tests", () => {
    const setUser = vi.fn();
    const onToggleSidebar = vi.fn();

    test("Test that Topbar appears.", () => {
        render(
            <MemoryRouter>
                <Topbar
                    onToggleSidebar={onToggleSidebar}
                    title={"Test"}
                    setUser={setUser}
                />
            </MemoryRouter>
        );
        const content = screen.getByRole('banner');
        expect(content).toHaveTextContent("Test");
    });

    test("Test that sidebar button calls the function to toggle the sidebar.", async () => {
        render(
            <MemoryRouter>
                <Topbar
                    onToggleSidebar={onToggleSidebar}
                    title={"Test"}
                    setUser={setUser}
                />
            </MemoryRouter>
        );
        await userEvent.click(screen.getByRole('button', {name: /☰/i}));
        expect(onToggleSidebar).toHaveBeenCalledOnce();
    });

    test("Test that logout button displays when profile icon clicked.", async () => {
        render(
            <MemoryRouter>
                <Topbar
                    onToggleSidebar={onToggleSidebar}
                    title={"Test"}
                    setUser={setUser}
                />
            </MemoryRouter>
        );
        const content = screen.getByRole('banner');
        await userEvent.click(screen.getByTestId('action-bar'));
        expect(content).toHaveTextContent("Log Out");
    });

    test("Test that logout button logs the user out when clicked.", async () => {
        render(
            <MemoryRouter>
                <Topbar
                    onToggleSidebar={onToggleSidebar}
                    title={"Test"}
                    setUser={setUser}
                />
            </MemoryRouter>
        );
        await userEvent.click(screen.getByTestId('action-bar'));
        await userEvent.click(screen.getByTestId('logout'));
        expect(setUser).toHaveBeenCalledWith(null);
    });

});