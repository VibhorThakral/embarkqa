import { test, expect } from '@playwright/test';

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
  // await page.fill('input[aria-label="Date Field"]', '01/01/2025');
  
// Date Field 
const dateField = page.getByLabel('Date Field').first();
const mmddyyyy = '10/12/2025'; 

await dateField.click({ force: true });

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
await dateField.press(`${mod}+KeyA`);
await dateField.press('Delete');

await dateField.type(mmddyyyy, { delay: 15 });

await dateField.blur();


//Decimal Field
const decimalField = page.locator('input[aria-label="Decimal Field"]');
await decimalField.fill('1234.56');
await expect(decimalField).toHaveValue('1234.56');
 


  // Click on the Save and Next button
  await page.click('button[id="save-and-next"]');
  await page.waitForTimeout(5000);
  await expect(page).toHaveTitle('Automated Testing Application - Review');
  
  
  
  // Date Field
  // await page.fill('input[aria-label="Date Field"]', '01/01/2025');
  // 
  // Number Field
  // await page.fill('input[aria-label="Number Field"]', '1234567890');
  
  // Clean up
  await context.close();
});