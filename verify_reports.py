from playwright.sync_api import sync_playwright
import time

def verify_reports():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:5174/")
        page.fill("input[type='email']", "admin@nutricare.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        # Wait for dashboard
        print("Waiting for dashboard...")
        page.wait_for_url("**/dashboard", timeout=10000)

        # 2. Go to Reports
        print("Navigating to Reports...")
        page.click("a[href='/reports']") # Assuming sidebar link exists
        # Or direct navigation: page.goto("http://localhost:5173/reports")
        page.wait_for_url("**/reports")

        # Wait for data load
        print("Waiting for data to load...")
        page.wait_for_selector(".stat-card-value", state="visible")
        # Wait until "..." is gone
        page.wait_for_function("document.querySelector('.stat-card-value').innerText !== '...'")

        # 3. Select Grade 6
        print("Selecting Grade 6...")
        # Check if Grade 6 tab exists. Assuming it's a button with text "Grade 6"
        # GradeTabs uses buttons.
        page.click("button:has-text('Grade 6')")
        time.sleep(1) # Wait for filter to apply

        # 4. Check Severely Wasted Card Count
        sw_card = page.locator(".stat-card:has-text('Severely Wasted')")
        sw_count = sw_card.locator(".stat-card-value").inner_text()
        print(f"Severely Wasted Count for Grade 6: {sw_count}")

        # 5. Click Severely Wasted Card
        print("Clicking Severely Wasted card...")
        sw_card.click()
        time.sleep(1)

        # 6. Check Active State
        is_active = "active" in sw_card.get_attribute("class")
        print(f"Card Active State: {is_active}")
        if not is_active:
             print("ERROR: Card should be active")

        # 7. Check Table Filters
        print("Checking table...")
        # Get all rows in tbody
        rows = page.locator("table.data-table tbody tr")
        row_count = rows.count()
        print(f"Table Row Count: {row_count}")

        # Check if first row has Severely Wasted status
        if row_count > 0:
            status_cell = rows.first.locator("td:nth-child(3)") # Status is 3rd column
            status_text = status_cell.inner_text()
            print(f"First row status: {status_text}")
            if "Severely Wasted" not in status_text and "SEVERELY WASTED" not in status_text:
                 print("ERROR: Table not filtered correctly")

        # 8. Check Cards still have counts (Summary should act on Grade 6, not Grade 6 + Status)
        # Verify 'Normal' card count is NOT 0 (unless there are truly 0 normal students in Grade 6)
        normal_card = page.locator(".stat-card:has-text('Normal')")
        normal_count = normal_card.locator(".stat-card-value").inner_text()
        print(f"Normal Count (should be > 0 likely): {normal_count}")

        if normal_count == "0" and row_count > 0 and sw_count != "0":
             # If we have SW students, and we filtered by SW, Normal should still show the Normal count for Grade 6
             # If it shows 0, it might mean the Summary is being filtered by the Status too (Regression)
             # But wait, if there are 0 Normal students in Grade 6, then 0 is correct.
             # We assume there is some data.
             print("Warning: Normal count is 0. Check if this is expected.")

        # Screenshot
        screenshot_path = "verification_reports.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_reports()
