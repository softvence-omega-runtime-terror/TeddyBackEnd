import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import config from "../config";

// Configure Cloudinary once at module level
cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// Function to upload an image to Cloudinary (from memory buffer ONLY)
export const uploadImgToCloudinary = async (
  name: string, 
  fileBuffer: Buffer
) => {
  try {
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('File must be a Buffer. Ensure multer is using memoryStorage.');
    }

    // Upload from memory buffer directly to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: name,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    console.log(`Image uploaded successfully: ${(uploadResult as any).secure_url}`);
    return uploadResult;
  } catch (error: any) {
    console.error(`Error uploading image to Cloudinary:`, error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Function to handle multiple image uploads (from memory buffers)
export const uploadMultipleImages = async (fileBuffers: Buffer[]) => {
  try {
    // Initialize an array to store the image URLs
    const imageUrls: string[] = [];

    // Loop through the file buffers and upload each one
    for (const fileBuffer of fileBuffers) {
      const imageName = `${Math.floor(
        100 + Math.random() * 900
      )}-${Date.now()}`; // Unique image name
      const uploadResult = await uploadImgToCloudinary(imageName, fileBuffer);
      imageUrls.push((uploadResult as any).secure_url); // Store the secure URL of the uploaded image
    }

    // Return the array of image URLs
    return imageUrls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw new Error("Multiple image upload failed");
  }
};

// Multer storage configuration - Use memory storage ONLY (no local folder dependency)
const storage = multer.memoryStorage();

// Multer upload setup
export const upload = multer({ storage: storage });