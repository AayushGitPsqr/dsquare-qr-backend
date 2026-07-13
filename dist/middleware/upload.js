import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary, initializeCloudinary } from "../services/cloudinaryService.js";
import { env } from "../config/env.js";
// Initialize Cloudinary
initializeCloudinary();
// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: env.cloudinaryFolder,
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalname.split(".")[0]}`
    })
});
export const uploadCardImage = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Invalid image type. Use JPG, JPEG, or PNG."));
    }
});
export { enhanceUploadedImage } from "./imageEnhancement.js";
