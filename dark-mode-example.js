/**
 * ============================================
 * Dark Mode Implementation Examples
 * أمثلة تطبيق الدارك مود
 * ============================================
 */

/* ============================================
   الطريقة 1: [data-theme="dark"] - التحكم اليدوي
   ============================================ */

// تفعيل الدارك مود يدوياً
function enableDarkMode() {
  document.body.setAttribute('data-theme', 'dark');
  // أو على html element
  // document.documentElement.setAttribute('data-theme', 'dark');
  
  // حفظ التفضيل في localStorage
  localStorage.setItem('theme', 'dark');
}

// إيقاف الدارك مود
function disableDarkMode() {
  document.body.removeAttribute('data-theme');
  // أو
  // document.body.setAttribute('data-theme', 'light');
  
  localStorage.setItem('theme', 'light');
}

// التبديل بين الدارك مود والوضع العادي
function toggleDarkMode() {
  const currentTheme = document.body.getAttribute('data-theme');
  
  if (currentTheme === 'dark') {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

// استرجاع التفضيل المحفوظ عند تحميل الصفحة
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
}

// استدعاء عند تحميل الصفحة
// initTheme();

/* ============================================
   الطريقة 2: @media (prefers-color-scheme: dark) - تلقائي
   ============================================ */

// هذه الطريقة تعمل تلقائياً بدون JavaScript
// لكن يمكنك مراقبة التغييرات:

// مراقبة تغيير إعدادات النظام
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function handleDarkModeChange(e) {
  if (e.matches) {
    console.log('النظام على دارك مود');
    // يمكنك إضافة منطق إضافي هنا
  } else {
    console.log('النظام على وضع فاتح');
  }
}

// الاستماع للتغييرات
darkModeMediaQuery.addEventListener('change', handleDarkModeChange);

// التحقق من الوضع الحالي
if (darkModeMediaQuery.matches) {
  console.log('النظام حالياً على دارك مود');
}

/* ============================================
   الحل الأمثل: الجمع بين الطريقتين
   ============================================ */

class DarkModeController {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'auto';
    this.init();
  }

  init() {
    // تطبيق الوضع المحفوظ
    this.applyTheme();
    
    // مراقبة تغييرات النظام (إذا كان الوضع auto)
    if (this.theme === 'auto') {
      this.watchSystemPreference();
    }
  }

  applyTheme() {
    if (this.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else if (this.theme === 'light') {
      document.body.removeAttribute('data-theme');
    } else {
      // auto - اترك النظام يتحكم
      document.body.removeAttribute('data-theme');
      this.watchSystemPreference();
    }
  }

  watchSystemPreference() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (mediaQuery.matches) {
      // النظام على دارك مود، لكن لا نضيف data-theme
      // لأن CSS سيتعامل معه تلقائياً
    }
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  toggle() {
    if (this.theme === 'dark') {
      this.setTheme('light');
    } else if (this.theme === 'light') {
      this.setTheme('dark');
    } else {
      // auto - تحويل لـ dark
      this.setTheme('dark');
    }
  }
}

// استخدام الكلاس
// const darkMode = new DarkModeController();

// مثال: زر للتبديل
/*
<button onclick="darkMode.toggle()">تبديل الدارك مود</button>
*/

/* ============================================
   مثال كامل مع زر تبديل
   ============================================ */

// HTML مثال:
/*
<button id="darkModeToggle" class="dark-mode-toggle">
  <span class="light-icon">☀️</span>
  <span class="dark-icon">🌙</span>
</button>
*/

// JavaScript:
/*
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('darkModeToggle');
  const darkMode = new DarkModeController();
  
  // تحديث أيقونة الزر حسب الوضع
  function updateButtonIcon() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    toggleButton.querySelector('.light-icon').style.display = isDark ? 'none' : 'inline';
    toggleButton.querySelector('.dark-icon').style.display = isDark ? 'inline' : 'none';
  }
  
  toggleButton.addEventListener('click', function() {
    darkMode.toggle();
    updateButtonIcon();
  });
  
  // تحديث الأيقونة عند التحميل
  updateButtonIcon();
});
*/

