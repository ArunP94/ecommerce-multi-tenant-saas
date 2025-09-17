import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SignInPage from "@/app/signin/page"
import { signIn } from "next-auth/react"

// jsdom can render React; ensure ts-jest compiles TSX by jsx: react-jsx in Jest config

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

describe("SignInPage", () => {
  it("disables submit when invalid and enables when valid", async () => {
    render(<SignInPage />)
    const button = screen.getByRole("button", { name: /sign in/i }) as HTMLButtonElement
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass" } })

    await waitFor(() => expect(button.disabled).toBe(false))
  })

  it("calls signIn with credentials", async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: true })
    render(<SignInPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } })
    const button = screen.getByRole("button", { name: /sign in/i }) as HTMLButtonElement
    await waitFor(() => expect(button.disabled).toBe(false))
    fireEvent.click(button)

    await waitFor(() => expect(signIn).toHaveBeenCalled())
  })
})
