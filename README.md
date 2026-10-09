# วิธีรันสคริปต์อัปเดต Patch

เปิด PowerShell แล้วรัน:

```powershell
cd C:\Users\iTservice\Downloads\SPN_update
npm run test:update-loop
```

คำสั่งนี้รันเฉพาะ `tests/function/TC03.spec.ts` และเปิดเบราว์เซอร์ให้เห็นการทำงาน โดยล็อกอินหน้า QA ด้วยบัญชีที่ตั้งค่าไว้ในสคริปต์ แล้วอัปเดตสูงสุด **3 patch ต่อการรัน** ตามลำดับที่ระบบอนุญาต

แต่ละรอบจะ:

1. ชี้เมาส์ที่ปุ่ม Update ค้าง 2.5 วินาที และอ่าน URL เต็ม
2. เก็บ ID, วันที่, ชื่อ, ระดับ และรายละเอียดของ patch
3. กด Update แล้วรอ `Update Status: Success` และปุ่ม Back พร้อมกด สูงสุด 5 นาที
4. บันทึกผลและภาพหน้าจอ แล้วกด Back เพื่อทำรอบถัดไป

สคริปต์หยุดเมื่อครบ 3 รอบหรือ patch หมด หากอัปเดตผิดพลาดหรือมี patch ที่ติดเงื่อนไขจนไม่มีปุ่ม Update จะหยุดและรายงานข้อผิดพลาด โดยไม่คลิกซ้ำอัตโนมัติ

## ไฟล์ผลลัพธ์

ผลของแต่ละครั้งอยู่ในโฟลเดอร์:

```text
C:\Users\iTservice\Downloads\SPN_update\patch-results\<เวลาที่รัน>\
```

- `patch-updates.json` — ข้อมูล patch และสถานะของแต่ละรอบ
- `patch-updates.csv` — ข้อมูลสำหรับเปิดใน Excel
- `round-<รอบ>-patch-<ID>.png` — ภาพหน้าจออัปเดตสำเร็จ

รายงานมี URL ที่ปิดบังค่า session `UCODE` และบันทึกเวลาเป็น ISO UTC

หากต้องการดูรายงาน Playwright หลังรัน:

```powershell
npm run report
```

## เตรียมเครื่องครั้งแรกเท่านั้น

ต้องติดตั้ง Node.js และ npm ก่อน หากยังไม่มี dependencies หรือเบราว์เซอร์ Playwright ให้รันในโฟลเดอร์ `SPN_update`:

```powershell
npm ci
npx playwright install chromium
```

จากนั้นรัน `npm run test:update-loop` ได้ตามปกติ การรันแต่ละครั้งจะกดอัปเดต patch ที่พร้อมใช้งานจริงสูงสุด 3 รายการ

ค่า Process เช่น 2 / 3 อาจเป็นลำดับส่วนของ patch จึงบันทึกในรายงานโดยไม่บังคับให้ตัวเลขเท่ากัน การรันปกติยังจำกัดสูงสุด 3 รอบ สามารถตั้ง SPN_MAX_ROUNDS เป็น 1 หรือ 2 เพื่อทดสอบจำนวนรอบน้อยลงได้

## เปลี่ยน URL สำหรับแต่ละระบบ
ตั้ง SPN_BASE_URL เป็นโฟลเดอร์ของเว็บหรือ URL เต็มของ login.php ก่อนรัน สคริปต์ตรวจหน้าจากข้อความและปุ่ม ไม่บังคับ domain/path เดิม แต่ยังอ่าน PATCHID จากลิงก์เพื่อเลือก patch และบันทึกข้อมูล

Mac:
SPN_BASE_URL='https://your-host/path/spn/' npm run test:update-loop

PowerShell:
$env:SPN_BASE_URL = 'https://your-host/path/spn/'
npm run test:update-loop

หน้าของระบบปลายทางต้องมี iframe และปุ่มตามโครงสร้างเดียวกัน หากบัญชีต่างกัน ตั้ง SPN_USERNAME และ SPN_PASSWORD ก่อนรันด้วย

ไม่จำเป็นต้องมีข้อความ Successful Update หรือรายละเอียด Process หากแสดง Update Status: Success และปุ่ม Back พร้อมกด สคริปต์จะทำรอบถัดไปได้ ค่า Process ที่ไม่มีจะบันทึกเป็น null ใน JSON และช่องว่างใน CSV
