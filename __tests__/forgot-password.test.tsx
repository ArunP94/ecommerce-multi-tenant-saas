import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ForgotPasswordPage from "@/app/forgot-password/page"

// mock fetch
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = (jest.fn().mockResolvedValue({ ok: true } as Response) as unknown) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
})

describe("ForgotPasswordPage", () => {
  it("disables submit when invalid and enables when valid", async () => {
    render(<ForgotPasswordPage />)
    const button = screen.getByRole("button", { name: /send reset link/i }) as HTMLButtonElement
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } })
    await waitFor(() => expect(button.disabled).toBe(false))
  })

  it("calls fetch on submit", async () => {
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } })
    const btn = screen.getByRole("button", { name: /send reset link/i }) as HTMLButtonElement
    await waitFor(() => expect(btn.disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
