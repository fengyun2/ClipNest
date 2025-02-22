import { useState } from 'react';
import axios from 'axios';

interface ImageItem {
  url: string;
  title?: string;
}

export default function CollectPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setImages([]);

    try {
      const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
      const html = response.data;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const imgElements = doc.getElementsByTagName('img');

      const collectedImages: ImageItem[] = [];
      for (const img of imgElements) {
        const imgUrl = img.src;
        const imgTitle = img.alt || img.title || '';
        if (imgUrl && imgUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
          collectedImages.push({
            url: imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, url).href,
            title: imgTitle
          });
        }
      }

      if (collectedImages.length === 0) {
        setError('未找到任何图片');
      } else {
        setImages(collectedImages);
      }
    } catch (err) {
      setError('图片采集失败，请确保输入的网址正确且可访问');
      console.error('采集错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageUrl.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  const [collectStatus, setCollectStatus] = useState<{[key: string]: boolean}>({});

  const handleCollect = async (image: ImageItem) => {
    try {
      // 标记该图片正在采集中
      setCollectStatus(prev => ({ ...prev, [image.url]: true }));
      
      // TODO: 这里可以添加实际的采集逻辑，比如发送到后端API
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟API调用
      
      // 采集成功后的提示
      alert('图片采集成功！');
    } catch (err) {
      console.error('采集失败:', err);
      alert('图片采集失败，请重试');
    } finally {
      // 重置采集状态
      setCollectStatus(prev => ({ ...prev, [image.url]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">图片采集</h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            从花瓣、知乎、Twitter等网站采集图片
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-semibold leading-6 text-gray-900">
                网页地址
              </label>
              <div className="mt-2.5">
                <input
                  type="url"
                  name="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}
          <div className="mt-10">
            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? '采集中...' : '开始采集'}
            </button>
          </div>
        </form>

        {images.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-semibold mb-4">采集结果 ({images.length} 张图片)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(image.url)}
                        className="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                      >
                        下载
                      </button>
                      <button
                        onClick={() => handleCollect(image)}
                        disabled={collectStatus[image.url]}
                        className="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                      >
                        {collectStatus[image.url] ? '采集中...' : '采集'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}