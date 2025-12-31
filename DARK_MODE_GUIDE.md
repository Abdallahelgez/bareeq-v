# دليل الدارك مود - Dark Mode Guide

## 📋 الفرق بين الطريقتين

### 1️⃣ `[data-theme="dark"]` - التحكم اليدوي

**المميزات:**
- ✅ تحكم كامل من المطور/المستخدم
- ✅ يمكن حفظ التفضيل في localStorage
- ✅ يمكن إضافة زر تبديل
- ✅ أولوية أعلى من `@media`

**العيوب:**
- ❌ يحتاج JavaScript
- ❌ يحتاج كود إضافي

**متى تستخدمه:**
- عندما تريد إعطاء المستخدم خيار التبديل
- عندما تريد حفظ تفضيل المستخدم
- عندما تريد تحكم كامل في الوضع

---

### 2️⃣ `@media (prefers-color-scheme: dark)` - تلقائي

**المميزات:**
- ✅ يعمل تلقائياً بدون JavaScript
- ✅ يتبع إعدادات النظام
- ✅ تجربة مستخدم أفضل
- ✅ لا يحتاج كود إضافي

**العيوب:**
- ❌ لا يمكن التحكم فيه يدوياً
- ❌ لا يمكن حفظ التفضيل
- ❌ أولوية أقل من `[data-theme]`

**متى تستخدمه:**
- عندما تريد تجربة بسيطة
- عندما تريد اتباع إعدادات النظام فقط
- عندما لا تحتاج تحكم يدوي

---

## 🏆 الحل الأمثل: الجمع بينهما

**لماذا؟**
- `[data-theme="dark"]` للتحكم اليدوي (أولوية عالية)
- `@media` للوضع التلقائي (يعمل فقط إذا لم يكن هناك تحكم يدوي)

**كيف يعمل:**
```css
/* التحكم اليدوي - أولوية عالية */
[data-theme="dark"] {
  --card-background-color: #1a1a1a;
}

/* التلقائي - يعمل فقط إذا لم يكن هناك data-theme */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --card-background-color: #1a1a1a;
  }
}
```

---

## 💻 طريقة الاستخدام

### الطريقة 1: [data-theme="dark"]

#### تفعيل الدارك مود:
```javascript
// على body
document.body.setAttribute('data-theme', 'dark');

// أو على html
document.documentElement.setAttribute('data-theme', 'dark');
```

#### إيقاف الدارك مود:
```javascript
document.body.removeAttribute('data-theme');
// أو
document.body.setAttribute('data-theme', 'light');
```

#### التبديل:
```javascript
function toggleDarkMode() {
  const currentTheme = document.body.getAttribute('data-theme');
  
  if (currentTheme === 'dark') {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
}
```

#### حفظ التفضيل:
```javascript
// عند التبديل
localStorage.setItem('theme', 'dark');

// عند تحميل الصفحة
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
}
```

---

### الطريقة 2: @media (prefers-color-scheme: dark)

**لا يحتاج JavaScript!** يعمل تلقائياً.

#### مراقبة التغييرات (اختياري):
```javascript
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

darkModeQuery.addEventListener('change', (e) => {
  if (e.matches) {
    console.log('النظام على دارك مود');
  } else {
    console.log('النظام على وضع فاتح');
  }
});
```

---

## 🎯 مثال كامل

### HTML:
```html
<button id="darkModeToggle">🌙 تبديل الدارك مود</button>
```

### JavaScript:
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('darkModeToggle');
  
  // استرجاع التفضيل المحفوظ
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  }
  
  // التبديل
  toggleBtn.addEventListener('click', function() {
    const currentTheme = document.body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      toggleBtn.textContent = '🌙 تفعيل الدارك مود';
    } else {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      toggleBtn.textContent = '☀️ إيقاف الدارك مود';
    }
  });
});
```

---

## 📝 ملاحظات مهمة

1. **الأولوية:**
   - `[data-theme="dark"]` له أولوية أعلى
   - إذا كان موجود، `@media` لن يعمل

2. **`:root:not([data-theme])`:**
   - يضمن أن `@media` يعمل فقط إذا لم يكن هناك `data-theme`
   - هذا يمنع التعارض

3. **المتغيرات:**
   - نفس أسماء المتغيرات في الوضعين
   - القيم تتغير تلقائياً حسب الوضع

4. **الأداء:**
   - CSS Variables سريعة جداً
   - لا تأثير على الأداء

---

## 🔧 التخصيص

### إضافة متغيرات جديدة:
```css
:root {
  --my-custom-color: #ffffff;
}

[data-theme="dark"] {
  --my-custom-color: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --my-custom-color: #1a1a1a;
  }
}
```

### استخدام المتغيرات:
```css
.my-element {
  background-color: var(--my-custom-color);
}
```

---

## ✅ الخلاصة

- **استخدم `[data-theme="dark"]`** عندما تريد تحكم يدوي
- **استخدم `@media`** للوضع التلقائي
- **اجمع بينهما** للحصول على أفضل تجربة
- **احفظ التفضيل** في localStorage للتحكم اليدوي

