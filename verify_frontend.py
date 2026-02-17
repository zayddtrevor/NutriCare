from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:5173/")

        # Login
        page.fill("input[type='email']", "admin@nutricare.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        print("Logging in...")
        page.wait_for_url("**/dashboard")
        print("Logged in, on Dashboard.")

        # 1. Dashboard Verification
        time.sleep(2) # Wait for fetch
        page.screenshot(path="dashboard.png")

        content = page.content()
        # Verify student count is 0
        # The stat card for Total Students should have value 0
        if "Total Students" in content and '<div class="stat-value">0</div>' in content:
             print("Dashboard: Total Students is 0 - SUCCESS")
        else:
             print("Dashboard: Total Students check FAILED or markup different")

        # 2. Student & Teacher Verification (/management)
        print("Navigating to Student & Teacher (/management)...")
        page.click("a[href='/management']")
        page.wait_for_url("**/management")
        time.sleep(2)
        page.screenshot(path="student_teacher.png")

        content = page.content()
        if "No students found." in content:
            print("Student & Teacher: 'No students found.' present - SUCCESS")
        else:
            print("Student & Teacher: 'No students found.' NOT found")

        # 3. Feeding & Nutrition Verification (/feeding)
        print("Navigating to Feeding & Nutrition (/feeding)...")
        page.click("a[href='/feeding']")
        page.wait_for_url("**/feeding")
        time.sleep(2)
        page.screenshot(path="feeding.png")

        content = page.content()
        if "No students found" in content:
            print("Feeding: 'No students found' present - SUCCESS")
        else:
            print("Feeding: 'No students found' NOT found")

        # 4. Reports Verification (/reports)
        print("Navigating to Reports (/reports)...")
        page.click("a[href='/reports']")
        page.wait_for_url("**/reports")
        time.sleep(2)
        page.screenshot(path="reports.png")

        content = page.content()
        if "No records found matching your filters." in content:
             print("Reports: 'No records found matching your filters.' present - SUCCESS")
        else:
             print("Reports: Empty state message NOT found")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
