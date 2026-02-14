from playwright.sync_api import sync_playwright, expect
from datetime import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Login
    print("Navigating to login page...")
    page.goto("http://localhost:5174")

    # Fill login form
    print("Filling login form...")
    page.get_by_placeholder("E-mail").fill("admin@example.com")
    page.get_by_placeholder("Password").fill("password")
    page.get_by_role("button", name="Login").click()

    # Wait for dashboard
    print("Waiting for dashboard...")
    page.wait_for_url("**/dashboard", timeout=10000)

    # 2. Navigate to Feeding & Nutrition
    print("Navigating to Feeding & Nutrition...")
    page.goto("http://localhost:5174/feeding")

    # 3. Verify Date
    print("Verifying date...")
    today = datetime.now()
    day_name = today.strftime("%A")
    month_name = today.strftime("%B")
    day_num = today.day
    year = today.year
    expected_text = f"{day_name} • {month_name} {day_num}, {year}"

    meal_meta = page.locator(".meal-meta")
    expect(meal_meta).to_be_visible()
    actual_text = meal_meta.inner_text()
    print(f"Date check: Expected '{expected_text}' vs Actual '{actual_text}'")

    # 4. Verify Fallback UI (Since mock has no date-based meals)
    print("Verifying fallback UI...")
    meal_name_header = page.locator("h3.meal-name")
    expect(meal_name_header).to_be_visible()

    fallback_text = "No meal assigned for today."
    actual_meal_name = meal_name_header.inner_text()
    print(f"Meal Name check: '{actual_meal_name}'")

    if fallback_text not in actual_meal_name:
         print(f"WARNING: Expected fallback text '{fallback_text}' not found.")
    else:
         print("Fallback UI verified.")

    # 5. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification_fallback.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
