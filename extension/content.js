// 数据库配置
const DB_NAME = 'ClipNestDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// 初始化数据库
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('url', 'url', { unique: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// 保存图片信息到数据库
async function saveImageToDB(imageInfo) {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const image = {
      ...imageInfo,
      timestamp: new Date().getTime(),
      source: window.location.href
    };

    await new Promise((resolve, reject) => {
      const request = store.add(image);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return true;
  } catch (error) {
    console.error('保存到数据库失败:', error);
    return false;
  }
}

// 创建采集按钮元素
function createCollectButton() {
  const button = document.createElement('button');
  button.className = 'clipnest-collect-btn';
  button.textContent = '采集到 ClipNest';
  button.style.display = 'none';
  document.body.appendChild(button);
  return button;
}

// 检查图片是否符合采集条件
function isValidImage(img) {
  const url = img.src;
  return url && url.match(/\.(jpg|jpeg|png|gif)$/i);
}

// 获取图片信息
function getImageInfo(img) {
  return {
    url: img.src.startsWith('http') ? img.src : new URL(img.src, window.location.href).href,
    title: img.alt || img.title || ''
  };
}

// 发送图片到 ClipNest
async function collectImage(imageInfo) {
  try {
    // 保存到 IndexedDB
    const saved = await saveImageToDB(imageInfo);
    if (!saved) {
      throw new Error('保存到本地数据库失败');
    }

    // 显示成功提示
    showNotification('图片已成功采集到 ClipNest');
  } catch (error) {
    console.error('采集失败:', error);
    showNotification('采集失败，请重试', 'error');
  }
}

// 显示通知
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `clipnest-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // 2秒后自动移除通知
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// 初始化
function init() {
  const collectButton = createCollectButton();
  let currentImage = null;

  // 监听鼠标移动
  document.addEventListener('mousemove', (e) => {
    const target = e.target;
    
    // 如果鼠标悬停在图片上
    if (target.tagName === 'IMG' && isValidImage(target)) {
      currentImage = target;
      
      // 更新按钮位置
      const rect = target.getBoundingClientRect();
      collectButton.style.position = 'fixed';
      collectButton.style.left = `${rect.right - collectButton.offsetWidth - 10}px`;
      collectButton.style.top = `${rect.top + 10}px`;
      collectButton.style.display = 'block';
    } else if (!target.classList.contains('clipnest-collect-btn')) {
      collectButton.style.display = 'none';
      currentImage = null;
    }
  });

  // 监听按钮点击
  collectButton.addEventListener('click', () => {
    if (currentImage) {
      const imageInfo = getImageInfo(currentImage);
      collectImage(imageInfo);
    }
  });
}

// 启动扩展
init();