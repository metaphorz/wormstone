"""Read browser console and check the local simulator with Selenium."""
import json
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--window-size=1440,1100')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
# Supply a cached, matching driver to avoid network-based driver downloads.
driver_path = os.environ.get('CHROMEDRIVER')
service = Service(executable_path=driver_path) if driver_path else Service()
driver = None
try:
    driver = webdriver.Chrome(service=service, options=options)
    driver.get('http://127.0.0.1:8000/')
    try:
        WebDriverWait(driver, 90).until(lambda d: 'faces' in d.find_element(By.ID, 'status').text or 'error' in d.find_element(By.ID, 'status').text.lower())
    finally:
        print('Status:', driver.find_element(By.ID, 'status').text)
        print('Console:', json.dumps(driver.get_log('browser'), indent=2))
        driver.save_screenshot(str(Path(__file__).parent / 'selenium-stone.png'))
    driver.find_element(By.ID, 'wire-toggle').click()
    assert driver.find_element(By.ID, 'surface').get_attribute('value') == 'wire'
    driver.find_element(By.ID, 'wire-toggle').click()
    driver.execute_script("const el=document.getElementById('count');el.value=120;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));")
    WebDriverWait(driver, 90).until(lambda d: d.find_element(By.ID, 'status').text.startswith('120 passages') and 'faces' in d.find_element(By.ID, 'status').text)
    print('After edit:', driver.find_element(By.ID, 'status').text)
    print('Final console:', json.dumps(driver.get_log('browser'), indent=2))
finally:
    if driver:
        driver.quit()
