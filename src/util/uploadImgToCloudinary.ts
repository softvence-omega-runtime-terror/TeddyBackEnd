import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import config from "../config";

// Configure Cloudinary once at module level
cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// Function to delete a file from the local filesystem
export const deleteFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
    console.log(`File deleted successfully: ${filePath}`);
  } catch (err: any) {
    console.error(`Error deleting file: ${err.message}`);
  }
};

// Function to upload an image to Cloudinary (accepts both file path and buffer)
export const uploadImgToCloudinary = async (
  name: string, 
  filePathOrBuffer: string | Buffer
) => {
  try {
    let uploadResult;

    if (Buffer.isBuffer(filePathOrBuffer)) {
      // Upload from memory buffer (for cloud deployments)
      uploadResult = await new Promise((resolve, reject) => {
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
        uploadStream.end(filePathOrBuffer);
      });
    } else {
      // Upload from file path (for local development)
      await fs.access(filePathOrBuffer); // Verify file exists
      
      uploadResult = await cloudinary.uploader.upload(filePathOrBuffer, {
        public_id: name,
        resource_type: "image",
      });

      // Delete local file after successful upload
      await deleteFile(filePathOrBuffer);
    }

    console.log(`Image uploaded successfully: ${(uploadResult as any).secure_url}`);
    return uploadResult;
  } catch (error: any) {
    console.error(`Error uploading image to Cloudinary:`, error);
    // Attempt to clean up file on failure if it's a file path
    if (typeof filePathOrBuffer === 'string') {
      await deleteFile(filePathOrBuffer);
    }
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Function to handle multiple image uploads
export const uploadMultipleImages = async (filePaths: string[]) => {
  try {
    // Initialize an array to store the image URLs
    const imageUrls: string[] = [];

    // Loop through the file paths and upload each one
    for (const filePath of filePaths) {
      const imageName = `${Math.floor(
        100 + Math.random() * 900
      )}-${Date.now()}`; // Unique image name
      const uploadResult = await uploadImgToCloudinary(imageName, filePath);
      imageUrls.push((uploadResult as any).secure_url); // Store the secure URL of the uploaded image
    }

    // Return the array of image URLs
    return imageUrls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw new Error("Multiple image upload failed");
  }
};

// Multer storage configuration - Use memory storage for cloud deployments
const useMemoryStorage = process.env.NODE_ENV === 'production' || process.env.USE_MEMORY_STORAGE === 'true';

const storage = useMemoryStorage 
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), "uploads")); // Define folder for temporary file storage
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix); // Generate unique file name
      },
    });

// Multer upload setup
export const upload = multer({ storage: storage });