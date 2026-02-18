from playwright.sync_api import Page, expect, sync_playwright
import time

def test_feeding_nutrition(page: Page):
    # 1. Login
    page.goto("http://localhost:5173/login")
    page.fill("input[type='email']", "admin@nutricare.com")
    page.fill("input[type='password']", "password")
    page.click("button[type='submit']")

    # Wait for dashboard or redirection
    page.wait_for_url("**/dashboard", timeout=10000)

    # 2. Navigate to Feeding & Nutrition page
    # Assuming there is a sidebar or navigation link. I'll try direct navigation first.
    page.goto("http://localhost:5173/feeding-nutrition")

    # 3. Wait for data to load
    # I look for the "Total Students" stat card or similar.
    expect(page.get_by_text("Total Students")).to_be_visible(timeout=10000)

    # 4. Check for console logs (optional, but good for verification)
    # I can attach a console listener, but for screenshot verification, just seeing the page loaded is good.

    # 5. Take screenshot
    time.sleep(2) # Give it a moment for any animations or data fetching to settle
    page.screenshot(path="verification_feeding_nutrition.png")
    print("Screenshot saved to verification_feeding_nutrition.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            test_feeding_nutrition(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_screenshot.png")
        finally:
            browser.close()
