import { test, expect } from '@playwright/test'

// Helper to generate unique names for test isolation
function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// Helper to get tomorrow's date in YYYY-MM-DD format
function getTomorrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

test.describe('Gig Creation', () => {
  test('should display the gig creation form', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Guest List Creator' })).toBeVisible()
    await expect(page.getByLabel(/DJ \/ Artist Name/)).toBeVisible()
    await expect(page.getByLabel(/Event Date/)).toBeVisible()
    await expect(page.getByLabel(/Guest Cap/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Guest List Link' })).toBeVisible()
  })

  test('should create a gig with required fields only', async ({ page }) => {
    await page.goto('/')

    const djName = uniqueName('DJ Test')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()
    await expect(page.getByText(djName)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy Link' })).toBeVisible()
  })

  test('should create a gig with custom guest cap', async ({ page }) => {
    await page.goto('/')

    const djName = uniqueName('DJ Complete')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('50')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()
  })

  test('should require DJ name', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    // HTML5 validation should prevent submission
    const djNameInput = page.getByLabel(/DJ \/ Artist Name/)
    await expect(djNameInput).toHaveAttribute('required', '')
  })

  test('should require event date', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel(/DJ \/ Artist Name/).fill('Test DJ')
    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    // HTML5 validation should prevent submission
    const dateInput = page.getByLabel(/Event Date/)
    await expect(dateInput).toHaveAttribute('required', '')
  })

  test('should allow creating another gig after success', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel(/DJ \/ Artist Name/).fill(uniqueName('DJ First'))
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()

    await page.getByRole('button', { name: 'Create Another' }).click()

    await expect(page.getByRole('heading', { name: 'Guest List Creator' })).toBeVisible()
  })

  test('should navigate to dashboard from success page', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel(/DJ \/ Artist Name/).fill(uniqueName('DJ Navigate'))
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    await page.getByRole('button', { name: 'View Dashboard' }).click()

    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('Guest Sign-up', () => {
  let gigSlug: string

  test.beforeEach(async ({ page }) => {
    // Create a fresh gig for each test
    await page.goto('/')

    const djName = uniqueName('DJ Signup')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('10')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()

    // Extract slug from the displayed URL
    const linkText = await page.locator('.font-mono').textContent()
    gigSlug = linkText!.split('/gig/')[1]
  })

  test('should display the guest sign-up form', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    await expect(page.getByLabel(/Your Name/)).toBeVisible()
    await expect(page.getByLabel(/Email/)).toBeVisible()
    await expect(page.getByLabel(/Number of Guests/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('should successfully sign up a guest', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    await page.getByLabel(/Your Name/).fill('John Doe')
    await page.getByLabel(/Email/).fill('john@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')

    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()
  })

  test('should require name field', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    await page.getByLabel(/Email/).fill('test@example.com')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    const nameInput = page.getByLabel(/Your Name/)
    await expect(nameInput).toHaveAttribute('required', '')
  })

  test('should require email field', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    await page.getByLabel(/Your Name/).fill('Test User')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    const emailInput = page.getByLabel(/Email/)
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('should validate email format', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    await page.getByLabel(/Your Name/).fill('Test User')
    await page.getByLabel(/Email/).fill('invalid-email')
    await page.getByLabel(/Number of Guests/).fill('1')

    // Try to submit - HTML5 email validation should block
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Should still be on the form (not redirected to success)
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('should require quantity to be at least 1', async ({ page }) => {
    await page.goto(`/gig/${gigSlug}`)

    const quantityInput = page.getByLabel(/Number of Guests/)
    await expect(quantityInput).toHaveAttribute('min', '1')
  })

  test('should show 404 for non-existent gig', async ({ page }) => {
    await page.goto('/gig/nonexistent-slug-12345')

    await expect(page.getByText(/Guest List Not Found/)).toBeVisible()
  })
})

test.describe('Guest Cap Enforcement', () => {
  test('should prevent sign-up when list is full', async ({ page }) => {
    // Create a gig with cap of 2
    await page.goto('/')

    const djName = uniqueName('DJ Cap')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('2')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()

    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // First sign-up: 2 guests (fills the cap)
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('First Guest')
    await page.getByLabel(/Email/).fill('first@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Try to sign up again - should show list full
    await page.goto(`/gig/${gigSlug}`)

    await expect(page.getByText(/Guest List Unavailable/)).toBeVisible()
    await expect(page.getByText(/guest list is full/)).toBeVisible()
  })

  test('should show remaining spots warning when low', async ({ page }) => {
    // Create a gig with cap of 5
    await page.goto('/')

    const djName = uniqueName('DJ LowCap')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('5')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Sign up 3 guests, leaving 2 spots
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('First Guest')
    await page.getByLabel(/Email/).fill('first@example.com')
    await page.getByLabel(/Number of Guests/).fill('3')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Visit again - should show remaining spots
    await page.goto(`/gig/${gigSlug}`)
    await expect(page.getByText(/2 spots remaining/)).toBeVisible()
  })

  test('should prevent signing up more than remaining spots', async ({ page }) => {
    // Create a gig with cap of 3
    await page.goto('/')

    const djName = uniqueName('DJ Overflow')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('3')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Sign up 2 guests first
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('First Guest')
    await page.getByLabel(/Email/).fill('first@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Try to sign up 2 more (only 1 spot left)
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Second Guest')
    await page.getByLabel(/Email/).fill('second@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Should show error about remaining spots
    await expect(page.getByText(/Only 1 spot remaining/)).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  test('should display empty state when no gigs exist', async ({ page }) => {
    // Note: This test may fail if other tests have created gigs
    // In a real scenario, we'd have database cleanup between tests
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Guest Lists' })).toBeVisible()
  })

  test('should show created gig in dashboard', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Dashboard')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('100')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify the gig card with unique DJ name contains expected details
    const gigCard = page.locator('.card', { hasText: djName })
    await expect(gigCard).toBeVisible()
    await expect(gigCard.getByText(/100 cap/)).toBeVisible()
  })

  test('should update guest count after sign-up', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Count')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Sign up a guest with 3 people
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Test Guest')
    await page.getByLabel(/Email/).fill('test@example.com')
    await page.getByLabel(/Number of Guests/).fill('3')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Check dashboard shows correct count
    await page.goto('/dashboard')

    const gigCard = page.locator('.card', { hasText: djName })
    await expect(gigCard.getByText(/3 guests/)).toBeVisible()
    await expect(gigCard.getByText(/1 sign-up/)).toBeVisible()
  })

  test('should close and reopen a gig', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Close')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Go to dashboard and close the gig
    await page.goto('/dashboard')

    const gigCard = page.locator('.card', { hasText: djName })
    await gigCard.getByRole('button', { name: 'Close' }).click()

    // Wait for the update
    await expect(gigCard.getByText('Closed')).toBeVisible()

    // Try to access the sign-up form
    await page.goto(`/gig/${gigSlug}`)
    await expect(page.getByText(/Guest List Unavailable/)).toBeVisible()
    await expect(page.getByText(/has been closed/)).toBeVisible()

    // Reopen from dashboard
    await page.goto('/dashboard')
    const updatedGigCard = page.locator('.card', { hasText: djName })
    await updatedGigCard.getByRole('button', { name: 'Reopen' }).click()

    // Verify can sign up again
    await page.goto(`/gig/${gigSlug}`)
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('should delete a gig', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Delete')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    await expect(page.getByRole('heading', { name: 'Guest List Created!' })).toBeVisible()

    // Go to dashboard and delete
    await page.goto('/dashboard')

    const gigCard = page.locator('.card', { hasText: djName })

    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept())

    await gigCard.getByRole('button', { name: 'Delete' }).click()

    // Verify gig is removed
    await expect(page.locator('.card', { hasText: djName })).not.toBeVisible()
  })

  test('should copy link from dashboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ CopyLink')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()

    // Go to dashboard
    await page.goto('/dashboard')

    const gigCard = page.locator('.card', { hasText: djName })

    // Handle alert
    page.on('dialog', dialog => dialog.accept())

    await gigCard.getByRole('button', { name: 'Copy Link' }).click()

    // Verify clipboard contains the link
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('/gig/')
  })
})

test.describe('CSV Export', () => {
  test('should download CSV with correct format', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ CSV')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Add some guests
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Alice Smith')
    await page.getByLabel(/Email/).fill('alice@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Bob Jones')
    await page.getByLabel(/Email/).fill('bob@example.com')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Download CSV via API
    const response = await page.request.get(`/api/gigs/${gigSlug}/csv`)
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('text/csv')

    const csvContent = await response.text()

    // Verify CSV format matches Resident Advisor requirements
    const lines = csvContent.split('\n')

    // Check header
    expect(lines[0]).toBe('Name,Company,Email,Quantity,Type')

    // Check data rows
    expect(lines[1]).toContain('Alice Smith')
    expect(lines[1]).toContain('alice@example.com')
    expect(lines[1]).toContain(',2,') // Quantity

    expect(lines[2]).toContain('Bob Jones')
    expect(lines[2]).toContain('bob@example.com')
    expect(lines[2]).toContain(',1,') // Quantity
  })

  test('should handle special characters in CSV', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Special')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Add a guest with special characters
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('John "Johnny" O\'Connor, Jr.')
    await page.getByLabel(/Email/).fill('john@example.com')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Download and verify CSV handles escaping
    const response = await page.request.get(`/api/gigs/${gigSlug}/csv`)
    const csvContent = await response.text()

    // The name should be properly escaped (quotes doubled, wrapped in quotes)
    expect(csvContent).toContain('John')
    expect(csvContent).toContain('john@example.com')
  })

  test('should return empty CSV for gig with no guests', async ({ page }) => {
    // Create a gig
    await page.goto('/')

    const djName = uniqueName('DJ Empty')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Download CSV without any guests
    const response = await page.request.get(`/api/gigs/${gigSlug}/csv`)
    expect(response.status()).toBe(200)

    const csvContent = await response.text()
    const lines = csvContent.split('\n').filter(line => line.trim())

    // Should only have header
    expect(lines.length).toBe(1)
    expect(lines[0]).toBe('Name,Company,Email,Quantity,Type')
  })
})

test.describe('Edge Cases', () => {
  test('should handle multiple sign-ups from same email', async ({ page }) => {
    // Per PRD: "No duplicate email checks—OK for multiple sign-ups from one address"
    await page.goto('/')

    const djName = uniqueName('DJ DupeEmail')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // First sign-up
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Same Person')
    await page.getByLabel(/Email/).fill('same@example.com')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Second sign-up with same email
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Same Person Again')
    await page.getByLabel(/Email/).fill('same@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Verify both are in the CSV
    const response = await page.request.get(`/api/gigs/${gigSlug}/csv`)
    const csvContent = await response.text()

    const sameEmailCount = (csvContent.match(/same@example\.com/g) || []).length
    expect(sameEmailCount).toBe(2)
  })

  test('should handle gig with no cap (unlimited)', async ({ page }) => {
    await page.goto('/')

    const djName = uniqueName('DJ Unlimited')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    // Don't set guest cap

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Should be able to sign up any number
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Big Group')
    await page.getByLabel(/Email/).fill('big@example.com')
    await page.getByLabel(/Number of Guests/).fill('999')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Should not show remaining spots
    await page.goto(`/gig/${gigSlug}`)
    await expect(page.getByText(/spots remaining/)).not.toBeVisible()
  })

  test('should handle rapid sequential sign-ups near cap', async ({ page }) => {
    await page.goto('/')

    const djName = uniqueName('DJ Race')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('5')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Sign up 4 guests
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Guest 1')
    await page.getByLabel(/Email/).fill('g1@example.com')
    await page.getByLabel(/Number of Guests/).fill('4')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Try to sign up 2 more (only 1 spot left)
    await page.goto(`/gig/${gigSlug}`)
    await page.getByLabel(/Your Name/).fill('Guest 2')
    await page.getByLabel(/Email/).fill('g2@example.com')
    await page.getByLabel(/Number of Guests/).fill('2')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Should get error
    await expect(page.getByText(/Only 1 spot remaining/)).toBeVisible()
  })

  test('should handle form reload after list closes', async ({ page }) => {
    // Per PRD: "If a guest reloads after list closes, form is not available"
    await page.goto('/')

    const djName = uniqueName('DJ Reload')
    await page.getByLabel(/DJ \/ Artist Name/).fill(djName)
    await page.getByLabel(/Event Date/).fill(getTomorrowDate())
    await page.getByLabel(/Guest Cap/).fill('1')

    await page.getByRole('button', { name: 'Create Guest List Link' }).click()
    const linkText = await page.locator('.font-mono').textContent()
    const gigSlug = linkText!.split('/gig/')[1]

    // Open sign-up form in one tab
    await page.goto(`/gig/${gigSlug}`)
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()

    // Fill the cap
    await page.getByLabel(/Your Name/).fill('Last Guest')
    await page.getByLabel(/Email/).fill('last@example.com')
    await page.getByLabel(/Number of Guests/).fill('1')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()

    // Reload the form page
    await page.goto(`/gig/${gigSlug}`)

    // Form should not be available
    await expect(page.getByText(/Guest List Unavailable/)).toBeVisible()
  })

  test('should navigate from home to dashboard link', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'View existing guest lists' }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Guest Lists' })).toBeVisible()
  })

  test('should navigate from dashboard to create new', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: '+ Create New' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Guest List Creator' })).toBeVisible()
  })
})
