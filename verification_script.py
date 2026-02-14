import os
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:5173")
        # Wait for either login inputs or dashboard redirect
        try:
            page.wait_for_selector("input[type='email']", timeout=5000)
            print("Logging in with mock credentials...")
            page.fill("input[type='email']", "admin@school.edu")
            page.fill("input[type='password']", "password123")
            # Find the submit button. It might be generic.
            page.click("button")
            page.wait_for_url("**/dashboard")
        except:
            print("Already logged in or redirected.")

        page.wait_for_load_state("networkidle")

        # 2. Dashboard Verification
        print("Verifying Dashboard...")
        page.goto("http://localhost:5173/dashboard")
        page.wait_for_load_state("networkidle")
        time.sleep(2) # Allow React to settle
        page.screenshot(path="verification_dashboard.png")

        stats = page.locator(".stat-value").all_text_contents()
        print(f"Dashboard Stats: {stats}")

        # 3. Student & Teacher Verification
        print("Verifying Student & Teacher...")
        page.goto("http://localhost:5173/management")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path="verification_management.png")
        rows = page.locator(".data-table tbody tr").count()
        print(f"Management Rows: {rows}")

        # 4. Feeding & Nutrition Verification
        print("Verifying Feeding & Nutrition...")
        page.goto("http://localhost:5173/feeding")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path="verification_feeding.png")
        rows_feeding = page.locator(".data-table tbody tr").count()
        print(f"Feeding Rows: {rows_feeding}")

        # 5. Reports Verification
        print("Verifying Reports...")
        page.goto("http://localhost:5173/reports")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path="verification_reports.png")
        rows_reports = page.locator(".data-table tbody tr").count()
        print(f"Reports Rows: {rows_reports}")

        browser.close()

if __name__ == "__main__":
    run()
