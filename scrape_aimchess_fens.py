"""
Aimchess FEN Scraper
Scrapes FEN positions from Aimchess training module
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json
import time
import csv
import re
import os

class AimchessFENScraper:
    def __init__(self, accounts, output_file="aimchess_fens.csv"):
        self.accounts = accounts  # List of (email, password) tuples
        self.current_account_index = 0
        self.output_file = output_file
        self.fens = []
        self.answers = []  # Store answers for each position
        self.correct_answers = []  # Store which answer was correct (1 or 2)
        self.api_responses = []
    
    @property
    def current_email(self):
        return self.accounts[self.current_account_index][0]
    
    @property
    def current_password(self):
        return self.accounts[self.current_account_index][1]
    
    def switch_account(self):
        """Switch to the next account"""
        if self.current_account_index < len(self.accounts) - 1:
            self.current_account_index += 1
            print(f"\n[INFO] Switching to account {self.current_account_index + 1}/{len(self.accounts)}: {self.current_email}")
            return True
        else:
            print("\n[ERROR] No more accounts available!")
            return False
        
    def intercept_api_responses(self, route):
        """Intercept API responses to extract FEN data"""
        if '/api/lessons/get_next/' in route.request.url:
            response = route.fetch()
            try:
                body = response.json()
                self.api_responses.append(body)
                print(f"[DEBUG] API Response keys: {list(body.keys())}")
                # Debug: print full response structure (first 500 chars)
                response_str = json.dumps(body, indent=2)
                print(f"[DEBUG] API Response structure (first 500 chars): {response_str[:500]}")
                # Try to extract FEN from response - check various possible locations
                fen = None
                if 'fen' in body:
                    fen = body['fen']
                elif 'position' in body:
                    if isinstance(body['position'], str):
                        fen = body['position']
                    elif isinstance(body['position'], dict) and 'fen' in body['position']:
                        fen = body['position']['fen']
                elif 'data' in body:
                    if isinstance(body['data'], dict):
                        if 'fen' in body['data']:
                            fen = body['data']['fen']
                        elif 'position' in body['data']:
                            fen = body['data']['position']
                    elif isinstance(body['data'], str) and len(body['data']) > 20:
                        fen = body['data']
                
                # Also check if FEN is in the response text directly
                if not fen:
                    response_text = response.text()
                    import re
                    fen_match = re.search(r'"fen"\s*:\s*"([^"]+)"', response_text)
                    if fen_match:
                        fen = fen_match.group(1)
                
                if fen:
                    self.fens.append(fen)
                    print(f"[OK] FEN extracted: {fen[:60]}...")
                else:
                    print(f"[WARN] No FEN found in response. Checking data structure...")
                    # Check the 'data' field more carefully
                    if 'data' in body and isinstance(body['data'], dict):
                        data = body['data']
                        print(f"[INFO] Data keys: {list(data.keys())}")
                        # Check common FEN locations in data
                        if 'fen' in data:
                            fen = data['fen']
                            self.fens.append(fen)
                            print(f"[OK] FEN found in data.fen: {fen[:60]}...")
                        elif 'position' in data:
                            pos = data['position']
                            if isinstance(pos, str):
                                fen = pos
                            elif isinstance(pos, dict) and 'fen' in pos:
                                fen = pos['fen']
                            if fen:
                                self.fens.append(fen)
                                print(f"[OK] FEN found in data.position: {fen[:60]}...")
            except Exception as e:
                print(f"Error parsing API response: {e}")
        route.continue_()
    
    def extract_fen_from_page(self, page):
        """Try to extract FEN from the page using JavaScript"""
        try:
            # Try multiple methods to get FEN
            fen = page.evaluate("""
                () => {
                    // Method 1: Check React DevTools
                    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                        try {
                            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
                            const renderers = hook.renderers;
                            if (renderers && renderers.size > 0) {
                                const renderer = Array.from(renderers.values())[0];
                                const roots = renderer.getFiberRoots(1);
                                if (roots && roots.size > 0) {
                                    const root = Array.from(roots.values())[0];
                                    let fiber = root.current;
                                    const walk = (node, depth = 0) => {
                                        if (depth > 30 || !node) return null;
                                        if (node.memoizedProps?.fen) return node.memoizedProps.fen;
                                        if (node.memoizedState) {
                                            const state = node.memoizedState;
                                            if (state.fen) return state.fen;
                                            if (state.position?.fen) return state.position.fen;
                                        }
                                        if (node.child) {
                                            const r = walk(node.child, depth + 1);
                                            if (r) return r;
                                        }
                                        if (node.sibling) {
                                            const r = walk(node.sibling, depth + 1);
                                            if (r) return r;
                                        }
                                        return null;
                                    };
                                    const result = walk(fiber);
                                    if (result) return result;
                                }
                            }
                        } catch(e) {}
                    }
                    
                    // Method 2: Check window state
                    for (let key in window) {
                        try {
                            const obj = window[key];
                            if (obj && typeof obj === 'object' && obj.fen) {
                                if (typeof obj.fen === 'string' && obj.fen.match(/^[rnbqkpRNBQKP1-8\\/\\s]+[wb]\\s+/)) {
                                    return obj.fen;
                                }
                                if (typeof obj.fen === 'function') {
                                    const fen = obj.fen();
                                    if (fen && typeof fen === 'string') return fen;
                                }
                            }
                        } catch(e) {}
                    }
                    
                    return null;
                }
            """)
            
            if fen and isinstance(fen, str) and len(fen) > 10:
                return fen
        except Exception as e:
            print(f"Error extracting FEN: {e}")
        
        return None
    
    def scrape_fens(self, num_positions=300):
        """Main method to scrape FEN positions"""
        print(f"\n{'='*60}")
        print(f"Aimchess FEN Scraper")
        print(f"{'='*60}\n")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, slow_mo=100)
            context = browser.new_context(viewport={'width': 1920, 'height': 1080})
            page = context.new_page()
            
            # Set up API response interception
            page.route('**/api/**', self.intercept_api_responses)
            
            try:
                # Navigate to login page
                print("Navigating to login page...")
                page.goto("https://aimchess.com/auth/login", wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)
                
                # Login
                print(f"Logging in with account: {self.current_email}...")
                # Wait for email input to be visible
                email_input = page.wait_for_selector('input[type="email"], input[name*="email" i], input[placeholder*="email" i], input[type="text"]', timeout=10000)
                email_input.fill(self.current_email)
                print("  [OK] Filled email")
                time.sleep(0.5)
                
                # Wait for password input
                password_input = page.wait_for_selector('input[type="password"], input[name*="password" i]', timeout=10000)
                password_input.fill(self.current_password)
                print("  [OK] Filled password")
                time.sleep(0.5)
                
                # Click sign in button - try multiple selectors
                print("  [INFO] Looking for sign in button...")
                sign_in_button = None
                try:
                    # Try the specific class name first
                    sign_in_button = page.query_selector('button._143x34l6, button[class*="_143x34l6"]')
                    if sign_in_button:
                        print("  [INFO] Found sign in button by class name")
                    else:
                        # Try exact text match
                        sign_in_button = page.query_selector('button:has-text("Sign in")')
                        if not sign_in_button:
                            sign_in_button = page.query_selector('button:has-text("Sign In")')
                        if not sign_in_button:
                            sign_in_button = page.query_selector('button[type="submit"]:not([disabled])')
                        if not sign_in_button:
                            # Try to find any button with "Sign" in text
                            all_buttons = page.query_selector_all('button')
                            for btn in all_buttons:
                                text = btn.inner_text().strip()
                                if "sign" in text.lower() and "in" in text.lower():
                                    sign_in_button = btn
                                    print(f"  [INFO] Found sign in button with text: '{text}'")
                                    break
                    
                    if sign_in_button:
                        print("  [OK] Found sign in button, clicking...")
                        # Check if button is disabled
                        is_disabled = sign_in_button.is_disabled()
                        print(f"  [INFO] Button disabled: {is_disabled}")
                        if is_disabled:
                            print("  [WARN] Button is disabled, waiting for it to enable...")
                            page.wait_for_function("() => !document.querySelector('button:has-text(\"Sign in\")')?.disabled", timeout=5000)
                        
                        sign_in_button.click()
                        print("  [OK] Clicked sign in button")
                        
                        # Wait a moment for any loading or error messages
                        time.sleep(2)
                        
                        # Check for error messages
                        error_elements = page.query_selector_all('[class*="error"], [class*="Error"]')
                        if error_elements:
                            for err in error_elements:
                                err_text = err.inner_text()
                                if err_text and ("incorrect" in err_text.lower() or "invalid" in err_text.lower() or "wrong" in err_text.lower()):
                                    print(f"  [ERROR] Error message found: {err_text}")
                    else:
                        print("  [ERROR] Could not find sign in button!")
                        # Take a screenshot for debugging
                        page.screenshot(path="login_page_debug.png")
                        raise Exception("Sign in button not found")
                except Exception as e:
                    print(f"  [ERROR] Error finding/clicking sign in button: {e}")
                    raise
                
                # Wait for login to complete - check for navigation
                print("Waiting for login to complete...")
                try:
                    # Wait for URL to change from login page
                    page.wait_for_url("**/home**", timeout=30000)
                    print("  [OK] Login successful! Redirected to home.")
                except:
                    # Check if we're already logged in or on a different page
                    time.sleep(5)  # Wait longer for redirect
                    current_url = page.url
                    print(f"  [INFO] Current URL after wait: {current_url}")
                    
                    # Check for any visible error messages
                    page_text = page.inner_text('body')
                    if "incorrect" in page_text.lower() or "invalid" in page_text.lower() or "error" in page_text.lower():
                        print("  [ERROR] Error message detected on page")
                        # Try to find and print error
                        error_elements = page.query_selector_all('*')
                        for elem in error_elements[:20]:  # Check first 20 elements
                            text = elem.inner_text()
                            if text and ("incorrect" in text.lower() or "invalid" in text.lower()):
                                print(f"  [ERROR] Found error text: {text[:100]}")
                    
                    if "/login" in current_url:
                        print("  [ERROR] Still on login page. Login may have failed.")
                        print("  [INFO] Taking screenshot for debugging...")
                        page.screenshot(path="login_failed_debug.png")
                        # Don't raise exception, try to continue anyway
                        print("  [WARN] Continuing anyway - may already be logged in from previous session")
                    else:
                        print("  [OK] Appears to be logged in (not on login page)")
                
                time.sleep(2)
                
                # Navigate to training page
                print("Navigating to training page...")
                page.goto("https://aimchess.com/training", wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)
                
                # Navigate to specific training
                print("Navigating to training 4...")
                page.goto("https://aimchess.com/training/4/description", wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)
                
                # Click start
                print("Clicking start...")
                try:
                    # Wait a bit for page to fully load
                    time.sleep(3)
                    
                    # Try multiple ways to find the start button
                    start_button = None
                    try:
                        start_button = page.wait_for_selector('button:has-text("start"), button:has-text("Start"), button:has-text("START")', timeout=10000)
                    except:
                        # Try finding by class or other attributes
                        all_buttons = page.query_selector_all('button')
                        print(f"  [INFO] Found {len(all_buttons)} buttons on page")
                        for btn in all_buttons:
                            text = btn.inner_text().strip().lower()
                            if 'start' in text:
                                start_button = btn
                                print(f"  [INFO] Found start button with text: '{btn.inner_text()}'")
                                break
                    
                    if start_button:
                        start_button.click()
                        print("  [OK] Clicked start button")
                        # Wait for training to start
                        page.wait_for_url("**/training/4**", timeout=15000)
                        print("  [OK] Training started")
                    else:
                        print("  [ERROR] Start button not found")
                        # Take screenshot for debugging
                        page.screenshot(path="start_button_debug.png")
                        raise Exception("Start button not found")
                except Exception as e:
                    print(f"  [ERROR] Could not click start: {e}")
                    raise
                time.sleep(3)
                
                print(f"\nStarting to collect {num_positions} FEN positions...")
                print(f"{'='*60}\n")
                
                # Test save to verify file writing works
                print("[TEST] Testing file save functionality...")
                self.save_fens()
                print("[TEST] Test save completed. Check if file was created/updated.")
                
                position_count = 0
                consecutive_failures = 0
                max_failures = 5
                
                while position_count < num_positions:
                    try:
                        # Step 1: Wait for position to load (chess board visible)
                        print(f"\nWaiting for position {position_count + 1} to load...")
                        page.wait_for_selector('svg', timeout=10000)
                        time.sleep(2)  # Wait for API response
                        
                        # Step 2: Extract FEN from API response (interceptor should have captured it)
                        initial_fen_count = len(self.fens)
                        print(f"[DEBUG] Initial FEN count: {initial_fen_count}, API responses: {len(self.api_responses)}")
                        time.sleep(2)  # Give API response time to be intercepted
                        
                        # Also check the latest API response directly
                        if self.api_responses:
                            latest_response = self.api_responses[-1]
                            print(f"[DEBUG] Checking latest API response: {type(latest_response)}")
                            if isinstance(latest_response, dict):
                                print(f"[DEBUG] Latest response keys: {list(latest_response.keys())}")
                                # Try to extract FEN from latest response
                                if 'data' in latest_response:
                                    data = latest_response['data']
                                    print(f"[DEBUG] Data type: {type(data)}")
                                    if isinstance(data, dict):
                                        print(f"[DEBUG] Data dict keys: {list(data.keys())}")
                                        if 'fen' in data:
                                            fen_val = data['fen']
                                            print(f"[DEBUG] Found FEN in data.fen: {fen_val[:60]}...")
                                            if fen_val and (len(self.fens) == 0 or fen_val != self.fens[-1]):
                                                self.fens.append(fen_val)
                                                print(f"[OK] FEN extracted from latest API response: {fen_val[:60]}...")
                                        # Also check for position in data
                                        elif 'position' in data:
                                            pos = data['position']
                                            print(f"[DEBUG] Found position in data: {type(pos)}, value: {str(pos)[:60] if pos else 'None'}...")
                                            if isinstance(pos, str) and len(pos) > 20:
                                                if len(self.fens) == 0 or pos != self.fens[-1]:
                                                    self.fens.append(pos)
                                                    print(f"[OK] FEN extracted from data.position: {pos[:60]}...")
                                        else:
                                            print(f"[DEBUG] No 'fen' or 'position' in data. Full data: {json.dumps(data)[:300]}")
                                    elif isinstance(data, str):
                                        print(f"[DEBUG] Data is string: {data[:60]}...")
                                        if len(data) > 20 and '/' in data:
                                            if len(self.fens) == 0 or data != self.fens[-1]:
                                                self.fens.append(data)
                                                print(f"[OK] FEN extracted as data string: {data[:60]}...")
                        
                        fen = None
                        print(f"[DEBUG] FEN count after extraction attempt: {len(self.fens)}")
                        if len(self.fens) > initial_fen_count:
                            fen = self.fens[-1]
                            position_count += 1
                            consecutive_failures = 0
                            print(f"[OK] Position {position_count}/{num_positions}: {fen[:60]}...")
                            
                            # Ensure answers list matches fens list length
                            while len(self.answers) < len(self.fens):
                                self.answers.append(["", ""])
                            while len(self.correct_answers) < len(self.fens):
                                self.correct_answers.append(None)
                            
                            # Save to file after each position (real-time)
                            print(f"  [SAVE] Saving position {position_count} to file...")
                            self.save_fens()
                            print(f"  [SAVE] Saved! Total positions in file: {len(self.fens)}")
                        else:
                            # Try to extract FEN from page as fallback
                            fen = self.extract_fen_from_page(page)
                            if fen and len(fen) > 20:
                                self.fens.append(fen)
                                position_count += 1
                                consecutive_failures = 0
                                print(f"[OK] Position {position_count}/{num_positions} (from page): {fen[:60]}...")
                                
                                # Ensure answers list matches fens list length
                                while len(self.answers) < len(self.fens):
                                    self.answers.append(["", ""])
                                while len(self.correct_answers) < len(self.fens):
                                    self.correct_answers.append(None)
                                
                                # Save to file after each position (real-time)
                                print(f"  [SAVE] Saving position {position_count} to file...")
                                self.save_fens()
                                print(f"  [SAVE] Saved! Total positions in file: {len(self.fens)}")
                            else:
                                consecutive_failures += 1
                                print(f"[WARN] Warning: Could not extract FEN (attempt {consecutive_failures})")
                                # Even if FEN extraction fails, try to save what we have
                                if len(self.fens) > 0:
                                    print(f"[SAVE] Saving {len(self.fens)} positions even though current FEN extraction failed...")
                                    self.save_fens()
                                if consecutive_failures >= max_failures:
                                    print("Too many consecutive failures. Continuing anyway...")
                                    consecutive_failures = 0
                        
                        # Step 3: Capture answer buttons and click one
                        print("Looking for answer buttons...")
                        move_buttons_list = []
                        move_button = None
                        try:
                            # Wait for move buttons to appear
                            page.wait_for_selector('button:not([disabled])', timeout=5000)
                            
                            # Try to find move buttons by text content
                            all_buttons = page.query_selector_all('button:not([disabled])')
                            print(f"Found {len(all_buttons)} enabled buttons")
                            
                            # Collect all move buttons (answers)
                            for btn in all_buttons:
                                text = btn.inner_text().strip()
                                # Check if it looks like a chess move
                                if text and (re.match(r'^[O0]-[O0](-[O0])?$', text) or 
                                           re.match(r'^[RNBQK]?[a-h]?x?[a-h][1-8](=[RNBQ])?[+#]?$', text) or
                                           re.match(r'^[a-h][1-8](=[RNBQ])?[+#]?$', text)):
                                    move_buttons_list.append(text)
                                    if not move_button:
                                        move_button = btn
                                        print(f"  [OK] Found move button: {text}")
                            
                            # Store answers (up to 2) with the FEN
                            clicked_answer_index = None
                            if move_buttons_list:
                                # Take first 2 answers
                                answers = move_buttons_list[:2]
                                # Pad with empty strings if less than 2
                                while len(answers) < 2:
                                    answers.append("")
                                self.answers.append(answers)
                                print(f"  [INFO] Recorded answers: {answers}")
                                
                                # Click the first move button found
                                if move_button:
                                    clicked_answer_index = 1  # First answer (index 1)
                                    move_button.click()
                                    print(f"  [OK] Clicked move button: {answers[0]}")
                                    time.sleep(2)  # Wait for result to show
                            else:
                                # No move buttons found, add empty answers
                                self.answers.append(["", ""])
                                print("  [WARN] No move buttons found")
                            
                            # Check if the clicked answer was correct
                            correct_answer = None
                            try:
                                page_text = page.inner_text('body')
                                # Look for "Correct" or "Incorrect" message
                                if "correct" in page_text.lower() and "incorrect" not in page_text.lower():
                                    # Check which button shows as correct/active
                                    result_elements = page.query_selector_all('button[class*="active"], button[class*="correct"], [class*="Correct"]')
                                    if result_elements:
                                        # Try to find which answer was correct
                                        for i, btn in enumerate(result_elements):
                                            btn_text = btn.inner_text().strip()
                                            if btn_text in move_buttons_list:
                                                correct_answer = move_buttons_list.index(btn_text) + 1  # 1 or 2
                                                break
                                    
                                    if not correct_answer and clicked_answer_index:
                                        # If we clicked and got correct, that's the right one
                                        correct_answer = clicked_answer_index
                                    
                                    print(f"  [INFO] Correct answer detected: Answer {correct_answer}")
                                elif "incorrect" in page_text.lower():
                                    # Wrong answer - the other one must be correct
                                    if clicked_answer_index == 1:
                                        correct_answer = 2
                                    elif clicked_answer_index == 2:
                                        correct_answer = 1
                                    print(f"  [INFO] Incorrect answer clicked, correct is: Answer {correct_answer}")
                            except Exception as e:
                                print(f"  [WARN] Could not determine correct answer: {e}")
                            
                            # Store correct answer (1 or 2, or None if unknown)
                            self.correct_answers.append(correct_answer)
                            
                            # If no move button was found earlier, try clicking any button
                            if not move_button:
                                print("  [WARN] No move button found, trying first available button...")
                                if all_buttons:
                                    all_buttons[0].click()
                                    time.sleep(2)
                        except Exception as e:
                            print(f"  [ERROR] Error clicking move button: {e}")
                            # Add empty answers if error
                            if len(self.answers) < len(self.fens):
                                self.answers.append(["", ""])
                            if len(self.correct_answers) < len(self.fens):
                                self.correct_answers.append(None)
                        
                        # Step 4: Wait for result screen and click "Next" button
                        print("Looking for Next button...")
                        next_button = None
                        try:
                            # Wait for result to appear (might show "Correct" or "Incorrect")
                            time.sleep(1)
                            
                            # Try to find "Next" button - it appears after clicking an answer
                            # The user mentioned a specific button class
                            next_button = page.query_selector(
                                'button:has-text("Next"):not([disabled]), button:has-text("NEXT"):not([disabled])'
                            )
                            
                            # Also try the specific class mentioned by user
                            if not next_button:
                                next_button = page.query_selector(
                                    'button[class*="MuiButtonBase-root"][class*="MuiButton-root"][class*="MuiLoadingButton-root"][class*="MuiButton-kit"][class*="MuiButton-kitPrimary"]:not([disabled])'
                                )
                            
                            if next_button:
                                print(f"  [OK] Found Next button, clicking...")
                                next_button.click()
                                time.sleep(2)  # Wait for next position to load
                            else:
                                print("  [WARN] Next button not found yet, waiting...")
                                # Wait a bit more and try again
                                time.sleep(2)
                                next_button = page.query_selector('button:has-text("Next"):not([disabled])')
                                if next_button:
                                    next_button.click()
                                    time.sleep(2)
                                else:
                                    print("  [ERROR] Next button still not found")
                        except Exception as e:
                            print(f"  [ERROR] Error clicking Next button: {e}")
                        
                        # Small delay before next iteration
                        time.sleep(1)
                        
                    except PlaywrightTimeout:
                        print("Timeout waiting for element. Continuing...")
                        consecutive_failures += 1
                        if consecutive_failures >= max_failures:
                            print("Too many timeouts. Exiting...")
                            break
                        time.sleep(2)
                    except Exception as e:
                        print(f"Error: {e}")
                        consecutive_failures += 1
                        if consecutive_failures >= max_failures:
                            print("Too many errors. Exiting...")
                            break
                        time.sleep(2)
                
                # Ensure answers list matches fens list length before final save
                while len(self.answers) < len(self.fens):
                    self.answers.append(["", ""])
                while len(self.correct_answers) < len(self.fens):
                    self.correct_answers.append(None)
                
                # Final save
                self.save_fens()
                
                print(f"\n{'='*60}")
                print(f"Scraping Complete!")
                print(f"{'='*60}")
                print(f"Total positions collected: {len(self.fens)}")
                print(f"Total answers recorded: {len(self.answers)}")
                print(f"Output file: {self.output_file}")
                print(f"{'='*60}\n")
                
            except Exception as e:
                print(f"Fatal error: {e}")
            finally:
                browser.close()
    
    def save_fens(self):
        """Save FENs and answers to CSV file"""
        try:
            with open(self.output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['Index', 'FEN', 'Answer1', 'Answer2', 'CorrectAnswer'])
                for i, fen in enumerate(self.fens):
                    # Get corresponding answers, or empty if not available
                    if i < len(self.answers):
                        answers = self.answers[i]
                    else:
                        answers = ["", ""]
                    # Get correct answer (1 or 2, or empty if unknown)
                    correct = ""
                    if i < len(self.correct_answers) and self.correct_answers[i]:
                        correct = f"Answer{self.correct_answers[i]}"
                    writer.writerow([i + 1, fen, answers[0], answers[1], correct])
            print(f"[SAVE SUCCESS] Saved {len(self.fens)} positions to {self.output_file}")
        except Exception as e:
            print(f"[SAVE ERROR] Failed to save: {e}")


def main():
    # Load credentials from environment variables to avoid hardcoding secrets
    email = os.environ.get("AIMCHESS_EMAIL")
    password = os.environ.get("AIMCHESS_PASSWORD")

    accounts = []
    if email and password:
        accounts.append((email, password))
    else:
        print("[WARN] AIMCHESS_EMAIL or AIMCHESS_PASSWORD environment variables not set. Scraper will likely fail to login.")
    
    scraper = AimchessFENScraper(accounts, "aimchess_fens.csv")
    scraper.scrape_fens(num_positions=500)


if __name__ == "__main__":
    main()

