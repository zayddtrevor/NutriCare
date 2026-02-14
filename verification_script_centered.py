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

    # 3. Verify Fallback UI (Since mock has no date-based meals)
    print("Verifying fallback UI...")

    # Verify Image container is GONE
    print("Checking for absence of image container...")
    meal_right = page.locator(".meal-right")
    expect(meal_right).not_to_be_visible()
    print("Image container correctly hidden.")

    # Verify Text Centering
    print("Checking text centering...")
    meal_left = page.locator(".meal-left")
    expect(meal_left).to_be_visible()

    # Check style attribute
    style_attr = meal_left.get_attribute("style")
    print(f"Style attribute: {style_attr}")
    if "text-align: center" in style_attr and "width: 100%" in style_attr:
        print("Text centering style verified.")
    else:
        print("WARNING: Text centering style mismatch.")

    # Verify "No meal assigned" text
    meal_name_header = page.locator("h3.meal-name")
    expect(meal_name_header).to_be_visible()
    actual_text = meal_name_header.inner_text()
    if "No meal assigned for today." in actual_text:
        print("Fallback text verified.")
    else:
        print(f"WARNING: Fallback text mismatch: '{actual_text}'")

    # 5. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification_centered.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
