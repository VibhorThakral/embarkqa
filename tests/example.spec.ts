import { test, expect, Locator, defineConfig, devices } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial' });

// Testing for Existing Applicant

test('Login into the application', async ({ page, context }) => {
  await page.goto('https://sample.test-embark.com/login/', {waitUntil: 'domcontentloaded'});
  // Wait for page to open
  await page.waitForLoadState('networkidle');
  // Wait for page to load 
  await page.fill('input[name="email"]', 'hello+automatedtest@embark.com');
  await page.fill('input[name="password"]', 'Pass@123');
  await page.click('button[type="submit"]');
  // Verify we're on the apply page in the same tab
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  await expect(page).toHaveURL('https://sample.test-embark.com/apply/dashboard');
  // Go to the application page
  await page.goto('https://sample.test-embark.com/apply/automatedtest', {waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveURL(/^https:\/\/sample\.test-embark\.com\/apply\/automatedtest\?responseId=[^&]+(&.*)?$/);
  
  // Save the authentication state
  await context.storageState({ path: 'auth.json' });
 });

// Check Global Data like First Name, Last Name, Email
test('Check Global Data', async ({ browser }) => {
  // Create a new context with the saved authentication state
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();
  
  await page.goto('https://sample.test-embark.com/apply/automatedtest', {waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/^https:\/\/sample\.test-embark.com\/apply\/automatedtest\?responseId=[^&]+(&.*)?$/);
  await page.waitForLoadState('networkidle');
  // Check global data
  await expect(page.locator('input[aria-label="First Name"]')).toHaveValue('Automated Test');
  await expect(page.locator('input[aria-label="Last Name"]')).toHaveValue('Embark Account');
  await expect(page.locator('input[aria-label="Email"]')).toHaveValue('hello+automatedtest@embark.com');  
});

// Fill in the application form
test('Fill in the application form', async ({ browser }) => {
  // Create a new context with the saved authentication state
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();
  
  await page.goto('https://sample.test-embark.com/apply/automatedtest', {waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/^https:\/\/sample\.test-embark\.com\/apply\/automatedtest\?responseId=[^&]+(&.*)?$/);
  // Fill in the form
  
  // Short Field
  const shortField = page.locator('input[aria-label="Short Field"]');
  await shortField.clear();
  await page.fill('input[aria-label="Short Field"]', 'Short Field Value');
  
  // Long Field
  const longField = page.locator('textarea[aria-label="Long Field"]');
  await longField.clear();
  await page.fill('textarea[aria-label="Long Field"]', 'Long Field Value');

  // Code Area Field
  const codeAreaField = page.locator('textarea[aria-label="Code Area Field"]');
  await codeAreaField.clear();
  await page.fill('textarea[aria-label="Code Area Field"]', 'Code Area Field Value');
  
  // Picklist Field
    // Find the picklist field and type the first few letters
  const picklistField = page.locator('input[aria-autocomplete="list"]');
    // Clear the field first and focus on it
  await picklistField.clear();
  await picklistField.focus();
    // Type slowly to trigger the suggestions
  await picklistField.type('R');
  await page.waitForTimeout(500);
  await picklistField.type('o');
  await page.waitForTimeout(500);
  await picklistField.type('b');
    // Wait for suggestions to appear with multiple selectors
  try {
    await page.waitForSelector('id=suggestons', { timeout: 3000 });
  } catch {
    // Try alternative selectors if the first one doesn't work
    try {
      await page.waitForSelector('[role="listbox"]', { timeout: 3000 });
    } catch {
      await page.waitForSelector('.suggestions, .dropdown, [data-testid*="suggestion"]', { timeout: 3000 });
    }
  }
    // Select the first option from the dropdown (Robert Baratheon)
  await page.click('text=Robert Baratheon');
  await expect(picklistField).toHaveValue('Robert Baratheon');

  // Dropdown Field
  const dropdownField = page.locator('select[aria-label="Dropdown Field"]');
  await dropdownField.selectOption('1: Yes');

  // Checkbox Field
  await page.check('input[aria-label="Checkbox Field"]');
  await page.uncheck('input[aria-label="Checkbox Field"]');

  // Radio Button Field
  await page.click('input[type="radio"][aria-label="Yes"][id="radioButtonField.Yes"]');
  await page.click('input[type="radio"][aria-label="No"][id="radioButtonField.No"]');

  // Multi Select Field
  const multiSelectField_0 = page.locator('input[type="checkbox"][value="Robert Baratheon"]');
  const multiSelectField_1 = page.locator('input[type="checkbox"][value="Jaime Lannister"]');
  const multiSelectField_2 = page.locator('input[type="checkbox"][value="Robb Stark"]');
  await multiSelectField_0.check();
  await multiSelectField_1.check();
  await multiSelectField_2.check();
  await multiSelectField_0.uncheck(); 
  await multiSelectField_1.uncheck(); 
  await multiSelectField_2.uncheck();

// Date Field 
  const dateField = page.getByLabel('Date Field').first();
  const mmddyyyy = '10/12/2025'; 
  await dateField.click({ force: true });
  await dateField.clear();
  await dateField.type(mmddyyyy, { delay: 15 });
  await dateField.blur();

//Decimal Field
  const decimalField = page.locator('input[aria-label="Decimal Field"]');
  await decimalField.clear();
  await decimalField.fill('1234.56');
  await expect(decimalField).toHaveValue('1234.56');
 
// Upload Files Fields

const fx = (filename: string) => path.resolve(__dirname, 'fixtures', filename);

const section = (heading: string) =>
  page.getByText(heading).first()
    .locator('xpath=ancestor::*[self::div or self::section][1]');

const trashLinks = (container: Locator) =>
  container.locator('a.pull-right:has(span.sr-only:has-text("Remove File"))');

async function waitStagesDone(container: Locator, totalTimeout = 30_000) {
  const start = Date.now();
  const remain = () => Math.max(1000, totalTimeout - (Date.now() - start));
  const stage = container.getByText(/Uploading|Converting/i);

  await stage.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
  await stage.waitFor({ state: 'hidden',  timeout: remain() }).catch(() => {});
}

async function clearAllByTrash(container: Locator) {
  for (let i = 0; i < 30; i++) { // safety cap
    const n = await trashLinks(container).count();
    if (n === 0) break;

    await trashLinks(container).first().click();
    await expect(trashLinks(container)).toHaveCount(n - 1, { timeout: 10_000 });
    await waitStagesDone(container, 15_000);
  }
  await expect(trashLinks(container)).toHaveCount(0, { timeout: 10_000 });
}

// Single File Upload
{
  const single = section('Image or Doc Single');
  const singleInput = single.locator('input[aria-label="Image or Doc Single Upload File Field"]');

  await clearAllByTrash(single);

  await singleInput.setInputFiles(fx('sample3.pdf'));

  await waitStagesDone(single);
  await expect(trashLinks(single)).toHaveCount(1, { timeout: 15_000 });
}

// Multiple File Upload
{
  const multi = section('Image or Doc Multiple');
  const multiInput = multi.locator('input[aria-label="Image or Doc Multiple Upload File Field"]');

  await clearAllByTrash(multi);

  await multiInput.setInputFiles([
    fx('sample1.docx'),
    fx('sample3.pdf'),
  ]);

  await waitStagesDone(multi);
  await expect(trashLinks(multi)).toHaveCount(2, { timeout: 15_000 });
}

// VIDEO RECORDING FIELD  

// Helper: locate the section by heading
const sectionByHeading = (page: any, heading: string) =>
  page.getByText(heading).first()
    .locator('xpath=ancestor::*[self::div or self::section][1]');

// Helper: wait for “Your video is processing...” to appear (if it does) then disappear
async function waitProcessing(container: Locator, totalTimeout = 30_000) {
  const t0 = Date.now();
  const left = () => Math.max(1000, totalTimeout - (Date.now() - t0));
  const msg = container.getByText(/^Your video is processing\.\.\.$/i);
  await msg.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {}); // may be brief or absent
  await msg.waitFor({ state: 'hidden',  timeout: left() }).catch(() => {});
}

{
  const videoBlock = sectionByHeading(page, 'Video Recording Field');
  await videoBlock.scrollIntoViewIfNeeded().catch(() => {});

  // Buttons (accept both exact labels and data-testids)
  const startBtn = videoBlock
    .getByRole('button', { name: /^start recording$/i })
    .or(videoBlock.locator('[data-testid="start-recording"], button:has-text("Start Recording")'));

  const stopBtn = videoBlock
    .getByRole('button', { name: /^stop recording$/i })
    .or(videoBlock.locator('[data-testid="stop-recording"], button:has-text("Stop Recording")'));

  const reRecordBtn = videoBlock
    .getByRole('button', { name: /^rerecord$/i })
    .or(videoBlock.locator('[data-testid="re-record"], button:has-text("Rerecord")'));

  const processing = videoBlock
    .getByText(/^Your video is processing\.\.\.$/i)
    .or(videoBlock.locator('[aria-live="polite"]:has-text("Your video is processing..."), [data-testid="video-processing"]'));

  const previewVid = videoBlock.locator('video, video[controls]');

  // Make sure camera/mic permissions are in place (especially if this test creates its own context)
  await context.grantPermissions(['camera', 'microphone'], { origin: 'https://sample.test-embark.com' });

  // ---- State-aware start logic ----
  if (await reRecordBtn.first().isVisible().catch(() => false)) {
    // Rerecord auto-starts recording → expect Stop to appear
    await reRecordBtn.first().click();
    await expect(stopBtn.first()).toBeVisible({ timeout: 15_000 });
  } else {
    // Fresh state → click Start Recording, then expect Stop
    await expect(startBtn.first()).toBeVisible({ timeout: 15_000 });
    await startBtn.first().click();
    await expect(stopBtn.first()).toBeVisible({ timeout: 15_000 });
  }

  // Let it capture for ~2s
  await page.waitForTimeout(2000);

  // Stop recording
  await stopBtn.first().click();

  // Processing → done
  await processing.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  await processing.first().waitFor({ state: 'hidden',  timeout: 25_000 }).catch(() => {});
  // or: await waitProcessing(videoBlock);

  // Preview appears and Rerecord is available again
  await expect(previewVid).toBeVisible({ timeout: 10_000 });
  await expect(reRecordBtn.first()).toBeVisible();

  // Optional: try to play; don’t hard-fail if autoplay is blocked in headless/fake media
  const played = await previewVid.first().evaluate(async (v: HTMLVideoElement) => {
    try {
      await v.play();
      await new Promise(r => setTimeout(r, 500));
      return !v.paused;
    } catch {
      return false;
    }
  });
  
}


// Click on the Save and Next button
  await page.click('button[id="save-and-next"]');
  await page.waitForTimeout(5000);
  await expect(page).toHaveTitle('Automated Testing Application - Review');
  

  // Number Field
  // await page.fill('input[aria-label="Number Field"]', '1234567890');
  
  // Clean up
  await context.close();
});