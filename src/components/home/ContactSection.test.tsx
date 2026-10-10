import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactSection from './ContactSection'

const submitInquiry = vi.fn()
vi.mock('../../data/DataContext', () => ({
  useData: () => ({
    buildings: [{ id: 'A', name: 'Lamela A' }],
    apartments: [{ id: 'A-302', buildingId: 'A', floor: 3, number: '302', rooms: 2 }],
    submitInquiry,
  }),
}))
// no minimum fill time in tests
vi.mock('../../lib/inquiry', async (orig) => ({ ...(await orig<typeof import('../../lib/inquiry')>()), MIN_FILL_MS: 0 }))

const setup = (url = '/') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ContactSection />
    </MemoryRouter>,
  )

function fillValid() {
  fireEvent.input(screen.getByLabelText('Emri dhe mbiemri'), { target: { value: 'Arta Krasniqi' } })
  fireEvent.input(screen.getByLabelText('Telefoni'), { target: { value: '+383 44 123 456' } })
  fireEvent.click(screen.getByRole('checkbox'))
}
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Rezervo takim' }))

describe('contact form', () => {
  beforeEach(() => {
    submitInquiry.mockReset()
  })

  it('shows inline errors and does not submit invalid data', async () => {
    setup()
    send()
    expect(await screen.findByText('Shkruani emrin dhe mbiemrin.')).toBeTruthy()
    expect(screen.getByText(/Duhet të pranoni/)).toBeTruthy()
    expect(screen.getByLabelText('Emri dhe mbiemri').getAttribute('aria-invalid')).toBe('true')
    expect(submitInquiry).not.toHaveBeenCalled()
  })

  it('submits valid data with the apartment from the URL and shows success', async () => {
    submitInquiry.mockResolvedValue(undefined)
    setup('/?s=kontakt&banesa=A-302')
    expect(screen.getByText(/Kërkesë për banesën/).textContent).toContain('302')
    fillValid()
    send()
    expect(await screen.findByText('Faleminderit, Arta')).toBeTruthy()
    expect(submitInquiry).toHaveBeenCalledTimes(1)
    expect(submitInquiry.mock.calls[0][0]).toMatchObject({ name: 'Arta Krasniqi', phone: '+38344123456', apartmentId: 'A-302', buildingId: 'A', rooms: 2 })
  })

  it('shows the error and never a success message when storing fails', async () => {
    submitInquiry.mockImplementation(async () => {
      throw new Error('Kërkesa nuk u dërgua. Kontrolloni lidhjen dhe provoni përsëri.')
    })
    setup()
    fillValid()
    send()
    expect((await screen.findByRole('alert')).textContent).toMatch(/nuk u dërgua/)
    expect(screen.queryByText(/Faleminderit/)).toBeNull()
    // retrying reuses the same client id, so the server can de-duplicate
    send()
    await waitFor(() => expect(submitInquiry).toHaveBeenCalledTimes(2))
    expect(submitInquiry.mock.calls[0][0].clientId).toBe(submitInquiry.mock.calls[1][0].clientId)
  })
})
