from playwright.sync_api import Page, expect, sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda msg: print(f"Page Error: {msg}"))

    try:
        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:5173/")

        # Wait for inputs to be visible
        expect(page.locator("input[type='email']")).to_be_visible(timeout=5000)

        print("Filling login form...")
        page.fill("input[type='email']", "admin@nutricare.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        # Wait for navigation to dashboard
        print("Waiting for dashboard...")
        page.wait_for_url("**/dashboard", timeout=10000)
        print("Dashboard loaded.")

        # 2. Navigate to Feeding & Nutrition page
        print("Navigating to /feeding...")
        page.goto("http://localhost:5173/feeding")

        # 3. Wait for data to load
        # Look for the "Total Students" stat card
        print("Waiting for 'Total Students'...")
        expect(page.get_by_text("Total Students")).to_be_visible(timeout=10000)

        # Wait a bit for async data fetching and console logs
        time.sleep(3)

        # 4. Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification_feeding.png")
        print("Screenshot saved to verification_feeding.png")

        # Verify Reports page as well since we modified it
        print("Navigating to /reports...")
        page.goto("http://localhost:5173/reports")
        expect(page.get_by_text("Total Students")).to_be_visible(timeout=10000)
        time.sleep(3)
        page.screenshot(path="verification_reports.png")
        print("Screenshot saved to verification_reports.png")

        # Verify Management page as well since we modified it
        print("Navigating to /management...")
        page.goto("http://localhost:5173/management")
        expect(page.get_by_text("Total Students")).to_be_visible(timeout=10000)
        time.sleep(3)
        page.screenshot(path="verification_management.png")
        print("Screenshot saved to verification_management.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
