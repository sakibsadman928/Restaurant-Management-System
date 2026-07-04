import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const uploadImage = (buffer: Buffer): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'restaurant/menu' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve(result);
      })
      .end(buffer);
  });

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
