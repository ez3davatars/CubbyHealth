import { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { getAllPartners, PartnerCompany } from '../lib/affiliateTracking';
import { getPartnerImages, uploadPartnerImage, deletePartnerImage, reorderImages, PartnerImage } from '../lib/imageUpload';

export default function PartnerImageManager() {
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [images, setImages] = useState<PartnerImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageType, setImageType] = useState<'logo' | 'product'>('product');
  const [caption, setCaption] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      loadImages(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  async function loadPartners() {
    const data = await getAllPartners();
    setPartners(data);
  }

  async function loadImages(partnerId: string) {
    const data = await getPartnerImages(partnerId);
    setImages(data);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPartnerId) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 15MB');
      return;
    }

    setUploading(true);
    try {
      await uploadPartnerImage(selectedPartnerId, file, imageType, caption || undefined);
      setCaption('');
      loadImages(selectedPartnerId);
      e.target.value = '';
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error?.message || 'Failed to upload image';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image: PartnerImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deletePartnerImage(image.id, image.storage_path);
      loadImages(selectedPartnerId);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];

    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const imageIds = images.map(img => img.id);
      await reorderImages(selectedPartnerId, imageIds);
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Failed to reorder images');
      loadImages(selectedPartnerId);
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upload Partner Images</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Partner *
            </label>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a partner...</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPartnerId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="product"
                      checked={imageType === 'product'}
                      onChange={(e) => setImageType(e.target.value as 'product')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Product Image</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="logo"
                      checked={imageType === 'logo'}
                      onChange={(e) => setImageType(e.target.value as 'logo')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Logo</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe this image..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 15MB</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedPartnerId && images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Uploaded Images</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Drag and drop images to reorder them</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-blue-500 transition-all">
                  <img
                    src={image.image_url}
                    alt={image.caption || 'Partner image'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 p-2 bg-gray-900/70 text-white rounded-lg">
                  <GripVertical className="w-4 h-4" />
                </div>
                {image.caption && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{image.caption}</p>
                )}
                <span className="mt-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded inline-block">
                  {image.image_type}
                </span>
                <button
                  onClick={() => handleDeleteImage(image)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPartnerId && images.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No images uploaded yet for this partner</p>
        </div>
      )}
    </div>
  );
}
