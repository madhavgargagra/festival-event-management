// File upload middleware configuration using multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configure dynamic disk storage based on upload category
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let type = req.body.uploadType || req.query.uploadType || 'general';
    let folder = 'public/uploads/';
    
    if (type === 'invoice') folder += 'invoices/';
    else if (type === 'vendor_doc') folder += 'vendor_docs/';
    else if (type === 'volunteer_id' || type === 'certification') folder += 'volunteer_id/';
    else if (type === 'receipt' || type === 'contribution') folder += 'invoices/'; // Map to invoices or create proofs
    else folder += 'invoices/';

    // Ensure local directory path exists
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Validate file types/extensions
const fileFilter = (req, file, cb) => {
  let type = req.body.uploadType || req.query.uploadType || 'general';
  const fileExt = path.extname(file.originalname).toLowerCase();

  // Extension validation mapping
  if (type === 'invoice') {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(fileExt)) return cb(null, true);
    return cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed for invoices'));
  } 
  
  if (type === 'vendor_doc') {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(fileExt)) return cb(null, true);
    return cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed for compliance docs'));
  } 
  
  if (type === 'volunteer_id' || type === 'certification') {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(fileExt)) return cb(null, true);
    return cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed for certifications'));
  } 
  
  if (type === 'receipt' || type === 'contribution') {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(fileExt)) return cb(null, true);
    return cb(new Error('Only PDF and image files are allowed for receipts'));
  }

  cb(null, true);
};

// 3. Initialize Multer instance with 10MB limit (matches max spec limit for invoice docs)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes
  }
});

module.exports = upload;
