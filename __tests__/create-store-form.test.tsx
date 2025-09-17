import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CreateStoreForm } from "@/components/admin/forms/create-store-form"

// mock fetch
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = (jest.fn().mockResolvedValue({ ok: true } as Response) as unknown) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
})

describe("CreateStoreForm", () => {
  it("normalizes customDomain and disables when invalid", async () => {
    render(<CreateStoreForm />)

    const submit = screen.getByRole("button", { name: /create/i }) as HTMLButtonElement
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Acme" } })
    fireEvent.change(screen.getByLabelText(/owner email/i), { target: { value: "owner@example.com" } })
    await waitFor(() => expect(submit.disabled).toBe(false))

    fireEvent.change(screen.getByLabelText(/custom domain/i), { target: { value: "https://www.example.com:3000/path" } })
    fireEvent.click(submit)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
