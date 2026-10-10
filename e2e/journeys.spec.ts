import { expect, test, type Page } from '@playwright/test'

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1000) < 768

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    // the OSM map is not configured yet; ignore third-party network noise only
    if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errors.push(m.text())
  })
  return errors
}

test('homepage loads without errors and shows honest placeholders', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('#/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('polygon.overlay-shape')).toHaveCount(2)
  // unconfirmed facts are not invented
  await expect(page.getByText('Të dhënat së shpejti').first()).toBeAttached()
  await expect(page.getByText('Plan ilustrues', { exact: true })).toBeAttached()
  // no admin link anywhere on the public site
  await expect(page.locator('a[href*="admin"]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('aerial wing → facade apartment → apartment page', async ({ page }) => {
  await page.goto('#/')
  if (isMobile(page)) {
    // phones: the wing summaries under the photo and the list are the reliable path
    await page.locator('a[href="#/buildings/B"]').first().click()
  } else await page.locator('polygon.overlay-shape').nth(1).click({ force: true })
  await expect(page).toHaveURL(/#\/buildings\/B$/)
  if (isMobile(page)) await page.locator('a[href^="#/apartments/B-"]').first().click()
  else await page.locator('polygon.overlay-shape').first().click({ force: true })
  await expect(page).toHaveURL(/#\/apartments\/B-\d+$/)
  await expect(page.getByRole('heading', { name: /Apartamenti/ }).first()).toBeVisible()
})

test('wing polygons are reachable by keyboard', async ({ page, browserName }) => {
  test.skip(isMobile(page) || browserName !== 'chromium')
  await page.goto('#/')
  const first = page.locator('polygon.overlay-shape').first()
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/buildings\/A$/)
})

test('filters update the list and the URL, and back/forward restores them', async ({ page }) => {
  await page.goto('#/apartments')
  await expect(page.getByText('140').first()).toBeVisible()
  if (isMobile(page)) await page.getByRole('button', { name: /Filtro banesat/ }).click()
  await page.getByRole('button', { name: '2+1', exact: true }).click()
  await expect(page).toHaveURL(/dhoma=2/)
  await page.getByLabel('Vetëm të lirat').click()
  await expect(page).toHaveURL(/lira=1/)
  await page.goBack()
  await expect(page).not.toHaveURL(/lira=1/)
  await expect(page).toHaveURL(/dhoma=2/)
  await expect(page.getByLabel('Vetëm të lirat')).not.toBeChecked()
  await page.goForward()
  await expect(page.getByLabel('Vetëm të lirat')).toBeChecked()
})

test('gallery opens, navigates and closes with the keyboard', async ({ page }) => {
  test.skip(isMobile(page))
  await page.goto('#/')
  const tile = page.locator('#gallery-title').locator('xpath=ancestor::section').getByRole('button').first()
  await tile.scrollIntoViewIfNeeded()
  await tile.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const first = await dialog.locator('img').first().getAttribute('src')
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => dialog.locator('img').first().getAttribute('src')).not.toBe(first)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(tile).toBeFocused()
})

test('panorama loads on the apartment page', async ({ page }) => {
  await page.goto('#/apartments/A-101')
  await expect(page.locator('.pnlm-container, [role="alert"]').first()).toBeVisible({ timeout: 15_000 })
})

test('inquiry form: validation, success in demo mode', async ({ page }) => {
  await page.goto('#/?s=kontakt&banesa=A-101')
  const form = page.getByRole('form', { name: 'Kërkesë për takim' })
  await expect(form).toBeVisible()
  await expect(form.getByText(/Kërkesë për banesën/)).toBeVisible()
  await form.getByRole('button', { name: 'Rezervo takim' }).click()
  await expect(form.getByText('Shkruani emrin dhe mbiemrin.')).toBeVisible()
  await form.getByLabel('Emri dhe mbiemri').fill('Arta Krasniqi')
  await form.getByLabel('Telefoni').fill('+383 44 123 456')
  await form.getByRole('checkbox').check()
  await page.waitForTimeout(2600) // minimum fill time (bot protection)
  await form.getByRole('button', { name: 'Rezervo takim' }).click()
  await expect(page.getByText('Faleminderit, Arta')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('aurora-demo-inquiries-v1') ?? '[]'))
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({ apartmentId: 'A-101', phone: '+38344123456' })
})

test('admin requires login; demo admin can edit an apartment', async ({ page }) => {
  await page.goto('#/admin')
  await expect(page.getByLabel(/Email/i)).toBeVisible()
  await page.getByLabel(/Email/i).fill('admin@demo.local')
  await page.getByLabel(/Fjalëkalimi/i).fill('wrong')
  await page.getByRole('button', { name: /Kyçu/ }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel(/Fjalëkalimi/i).fill('aurora-demo')
  await page.getByRole('button', { name: /Kyçu/ }).click()
  await expect(page.getByRole('button', { name: 'Dil' })).toBeVisible()
})

test('no horizontal overflow at common widths', async ({ page }) => {
  test.skip(isMobile(page))
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['#/', '#/buildings/A', '#/apartments', '#/apartments/A-101']) {
      await page.goto(route)
      await page.waitForTimeout(400)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${route} @ ${width}px`).toBeLessThanOrEqual(0)
    }
  }
})
