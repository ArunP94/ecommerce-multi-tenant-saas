import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InviteUserForm } from "@/components/domain/forms/invite-user-form";

const originalFetch = global.fetch;

describe("InviteUserForm", () => {
  beforeEach(() => {
    global.fetch = (jest.fn().mockResolvedValue({ ok: true } as Response) as unknown) as typeof fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("disables submit when invalid and enables when valid", async () => {
    render(<InviteUserForm stores={[{ id: "s1", name: "Store One" }]} />);

    const button = screen.getByRole("button", { name: /send invite/i }) as HTMLButtonElement;
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    // store defaults to first, role defaults to STAFF

    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it("submits expected payload", async () => {
    render(<InviteUserForm stores={[{ id: "s1", name: "Store One" }]} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    const submit = screen.getByRole("button", { name: /send invite/i });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(options.body);
    expect(body).toEqual({ email: "user@example.com", role: "STAFF", storeId: "s1" });
  });
});
