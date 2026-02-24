import { useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function PortfolioScreenshot() {
  const [screenshots, setScreenshots] = useLocalStorage('wp_portfolio_screenshots', []);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      // Limit to 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please use an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshots((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: file.name,
            data: event.target.result,
            date: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemove = (id) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card
      title="Portfolio Screenshots"
      subtitle="Upload pictures of your current holdings from your brokerage"
      action={
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          Upload Image
        </Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {screenshots.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-800 rounded-xl p-12 text-center cursor-pointer hover:border-gray-700 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-gray-500">Click or drag to upload a screenshot of your portfolio</p>
          <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          {screenshots.map((shot) => (
            <div key={shot.id} className="relative group">
              <div className="bg-gray-850 rounded-xl overflow-hidden border border-gray-800">
                <img
                  src={shot.data}
                  alt={shot.name}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-400">{shot.name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(shot.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(shot.id)}
                    className="text-gray-600 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            className="w-full border-2 border-dashed border-gray-800 rounded-xl py-4 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            + Upload another screenshot
          </button>
        </div>
      )}
    </Card>
  );
}
