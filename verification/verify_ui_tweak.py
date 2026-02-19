import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to capture the full layout
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Login - Go to root
        print("Navigating to login page...")
        page.goto('http://localhost:5173/')

        # Wait for login inputs
        page.wait_for_selector('input[type="email"]')

        print("Logging in...")
        page.fill('input[type="email"]', 'admin@nutricare.com')
        page.fill('input[type="password"]', 'password')
        page.click('button:has-text("Login")')

        # Wait for redirect to dashboard
        page.wait_for_url('**/dashboard')

        # Navigate to Student & Teacher page
        print("Navigating to Management page...")
        page.click('a[href="/management"]')
        page.wait_for_url('**/management*')

        # Wait for data to load - LOOK FOR .data-table and .grade-tab
        print("Waiting for data table...")
        page.wait_for_selector('.data-table', state='visible')
        print("Waiting for grade tabs...")
        page.wait_for_selector('.grade-tab', state='visible')

        # Wait a bit for animations to settle
        page.wait_for_timeout(2000)

        # Screenshot the Filter Section (Grade Chips) and Table Header/Rows
        page.screenshot(path='verification/student_management_final.png')

        print("Verification screenshot captured: verification/student_management_final.png")
        browser.close()

if __name__ == '__main__':
    run()
