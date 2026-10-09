# วิธีรันสคริปต์อัปเดต Patch

เปิด PowerShell แล้วรัน:

```powershell
cd C:\Users\iTservice\Downloads\SPN_update
npm run test:update-loop
```

คำสั่งนี้รันเฉพาะ `tests/function/TC03.spec.ts` และเปิดเบราว์เซอร์ให้เห็นการทำงาน โดยล็อกอินหน้า QA ด้วยบัญชีที่ตั้งค่าไว้ในสคริปต์ แล้วอัปเดตสูงสุด **3 patch ต่อการรัน** ตามลำดับที่ระบบอนุญาต

แต่ละรอบจะ:

1. ชี้เมาส์ที่ปุ่ม Update ค้าง 5 วินาที และตรวจ URL เต็ม
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
