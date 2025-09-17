import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { DeleteStoreButton } from "@/components/admin/delete-store-button"

// mock fetch
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = (jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response) as unknown) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
})

describe("DeleteStoreButton", () => {
  it("requires matching name before delete", async () => {
    render(<DeleteStoreButton storeId="s_123" storeName="Acme" />)

    fireEvent.click(screen.getByRole("button", { name: /delete/i }))
    const dialog = await screen.findByRole('dialog')
    const input = within(dialog).getByLabelText(/store name/i)

    // incorrect name
    fireEvent.change(input, { target: { value: "Wrong" } })
    const submitBtn1 = within(dialog).getByRole("button", { name: /delete/i }) as HTMLButtonElement
    expect(submitBtn1).toBeDisabled()
    fireEvent.click(submitBtn1)

    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled())

    // correct name
    fireEvent.change(input, { target: { value: "Acme" } })
    const submitBtn2 = within(dialog).getByRole("button", { name: /delete/i }) as HTMLButtonElement
    await waitFor(() => expect(submitBtn2.disabled).toBe(false))
    fireEvent.click(submitBtn2)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
