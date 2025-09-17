import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ResetPasswordPage from "@/app/reset-password/page"

// mock fetch
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = (jest.fn().mockResolvedValue({ ok: true } as Response) as unknown) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
})

describe("ResetPasswordPage", () => {
  it("disables submit when invalid and enables when valid", async () => {
    render(<ResetPasswordPage />)
    const button = screen.getByRole("button", { name: /update password/i }) as HTMLButtonElement
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "password-123" } })
    await waitFor(() => expect(button.disabled).toBe(false))
  })

  it("calls fetch on submit", async () => {
    render(<ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "password-123" } })
    const btn = screen.getByRole("button", { name: /update password/i }) as HTMLButtonElement
    await waitFor(() => expect(btn.disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
