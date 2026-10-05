"""Screenshot and interaction review of the running Wormstone simulator."""
import json, os, time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
out=Path(__file__).parent
options=webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--window-size=1600,1400')
options.set_capability('goog:loggingPrefs',{'browser':'ALL'})
service=Service(executable_path=os.environ['CHROMEDRIVER']) if os.environ.get('CHROMEDRIVER') else Service()
driver=webdriver.Chrome(service=service,options=options)
logs=[]
try:
    start=time.monotonic()
    driver.get('http://127.0.0.1:8000/?review=final')
    wait=WebDriverWait(driver,120)
    wait.until(lambda d:'faces' in d.find_element(By.ID,'status').text)
    print('Default ready in',round(time.monotonic()-start,2),'seconds',flush=True)
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-stone.png'))
    driver.save_screenshot(str(out/'final-app.png'))
    logs+=driver.get_log('browser')
    driver.execute_script("document.querySelector('#viewport canvas').dispatchEvent(new WheelEvent('wheel',{deltaY:-140,bubbles:true,cancelable:true}));")
    time.sleep(.35)
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-closeup.png'))
    driver.find_element(By.ID,'home').click()
    canvas=driver.find_element(By.CSS_SELECTOR,'#viewport canvas')
    ActionChains(driver).move_to_element(canvas).click_and_hold().move_by_offset(180,30).release().perform()
    time.sleep(.4)
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-rotated.png'))
    driver.find_element(By.ID,'home').click()
    driver.find_element(By.ID,'wire-toggle').click()
    assert driver.find_element(By.ID,'surface').get_attribute('value')=='wire'
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-wireframe.png'))
    driver.find_element(By.ID,'wire-toggle').click()
    assert driver.find_element(By.ID,'surface').get_attribute('value')=='dry'
    Select(driver.find_element(By.ID,'surface')).select_by_value('wet')
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-wet.png'))
    Select(driver.find_element(By.ID,'surface')).select_by_value('dry')
    driver.find_element(By.CSS_SELECTOR,'[data-mode="sleeve"]').click()
    driver.find_element(By.ID,'rings').click()
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-sleeve.png'))
    driver.find_element(By.CSS_SELECTOR,'[data-mode="2d"]').click()
    frame=driver.find_element(By.ID,'curve-frame')
    assert frame.is_displayed()
    driver.execute_script("const e=document.getElementById('radius');e.value=1.25;e.dispatchEvent(new Event('input'));")
    assert driver.execute_script("return document.getElementById('curve-frame').contentDocument.querySelector('[data-id=radius]').value")=='1.25'
    driver.find_element(By.ID,'stage').screenshot(str(out/'final-profile.png'))
    driver.find_element(By.CSS_SELECTOR,'[data-mode="stone"]').click()
    wait.until(lambda d:'faces' in d.find_element(By.ID,'status').text)
    start=time.monotonic()
    driver.execute_script("const e=document.getElementById('count');e.value=800;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'));")
    wait.until(lambda d:d.find_element(By.ID,'viewport').get_attribute('data-rendered-count')=='800')
    print('First visible update in',round(time.monotonic()-start,2),'seconds',flush=True)
    wait.until(lambda d:'faces' in d.find_element(By.ID,'status').text)
    driver.set_window_size(390,844)
    driver.save_screenshot(str(out/'final-mobile.png'))
    logs+=driver.get_log('browser')
    (out/'browser-console.json').write_text(json.dumps(logs,indent=2))
    assert not [log for log in logs if log['level']=='SEVERE'],logs
    print('PASS: default, zoom, orbit, wireframe, wet finish, sleeve, profile sync, live update, mobile. Console:',logs,flush=True)
finally:
    driver.quit()
