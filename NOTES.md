بعد تشغيل docker-compose:
- افتح http://localhost:3000 للواجهة
- API على http://localhost:4000

لإنشاء مستخدم admin اختباري:
- يمكنك إرسال طلب POST إلى /auth/register مع role=admin
  body: { fullName, phone, password, role:'admin' }