import { test, expect } from '@playwright/test'

test('선생님: 알림장 작성 → AI 요약 → 발송 플로우', async ({ page }) => {
  test.skip(!!process.env.CI, 'Skip in CI — requires manual Google OAuth')
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

test('보호자: 피드 확인 버튼', async ({ page }) => {
  test.skip(!!process.env.CI, 'Skip in CI — requires manual Google OAuth')
  await page.goto('/feed')
  await expect(page.locator('body')).toBeVisible()
})
