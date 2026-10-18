# SuperAdmin

نسخة إدارة العضويات: Backend Express/Sequelize وFrontend Next.js.

## Backend

```powershell
cd SuperAdmin-Backend-ES5
npm ci
# Create a local .env using .env.example and your existing database/accounting settings.
node index.js
```

البورت الافتراضي 5000. `npm start` يستخدم nodemon للتطوير؛ للتشغيل الفعلي استخدم خدمة مناسبة مع `node index.js`.

يجب ضبط `DATABASE_URL` و`SECRET_KEY` محليًا. لا توجد بيانات اتصال أو كلمة مرور افتراضية ضمن المستودع. إذا كانت قاعدة البيانات تحتوي المستخدمين، استخدم حساباتهم الحالية؛ `SUPERADMIN_INITIAL_PASSWORD` اختياري ومخصص لتهيئة جدول مستخدمين فارغ فقط. لا تشغل التطبيق على قاعدة بيانات حقيقية لأول مرة قبل مراجعة المزامنة والـseeding في `index.js` وأخذ نسخة احتياطية.

## Frontend

```powershell
cd SuperAdmin-front-gezira
npm ci
npm run build
npm start
```

التشغيل الفعلي الافتراضي على 5001، أو `npm run dev -- -p 3000` للتطوير.

عنوان Backend في شاشات النسخة الحالية مثبت في استدعاءات `app` على عنوان الشبكة المحلية `http://10.1.1.115:5000`. راجع هذه العناوين وإعدادات CORS قبل نشرها على جهاز أو نطاق مختلف. `API_URL` في `.env.example` يخص ربط ERP، وليس تغيير جميع روابط Backend. إعدادات ERP لا تتضمن كلمات مرور في الكود المنشور.

## قاعدة البيانات

ملفات `apply-superadmin-updates.sql` و`SuperAdmin-membership-renewal-fields.sql` تحديثات على قاعدة موجودة، وليست نسخة بيانات. لا يتضمن المستودع نسخ الداتابيز أو سكربتات المزامنة المستخرجة من بيانات العملاء أو ملفات المقارنة واللوجات.

نظام بصمة السيرفر والترخيص الموقّع في هذه النسخة خاص بمشروع `Server`؛ لم يتم نقله تلقائيًا إلى SuperAdmin.
