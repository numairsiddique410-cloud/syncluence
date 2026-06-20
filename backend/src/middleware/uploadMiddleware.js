import multer from "multer";
import path from "path";

// Storage engine define karna
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Yahan 'export const upload' zaroori hai
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Only images are allowed!"));
  },
});