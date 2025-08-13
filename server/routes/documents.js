const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth } = require('../middleware/auth');
const TaxReturn = require('../models/TaxReturn');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', req.user.userId);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF, images, and Excel files
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload document
router.post('/upload/:returnId', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { returnId } = req.params;
    const { documentType, description } = req.body;

    // Verify tax return belongs to user
    const taxReturn = await TaxReturn.findOne({
      _id: returnId,
      userId: req.user.userId
    });

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Add document to tax return
    const documentInfo = {
      type: documentType || 'general',
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      description: description || '',
      uploadedAt: new Date()
    };

    taxReturn.documents.push(documentInfo);
    taxReturn.updatedAt = new Date();
    await taxReturn.save();

    res.json({
      message: 'Document uploaded successfully',
      document: documentInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get documents for tax return
router.get('/:returnId', auth, async (req, res) => {
  try {
    const { returnId } = req.params;

    const taxReturn = await TaxReturn.findOne({
      _id: returnId,
      userId: req.user.userId
    }).select('documents');

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    res.json({ documents: taxReturn.documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download document
router.get('/download/:returnId/:documentId', auth, async (req, res) => {
  try {
    const { returnId, documentId } = req.params;

    const taxReturn = await TaxReturn.findOne({
      _id: returnId,
      userId: req.user.userId
    });

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    const document = taxReturn.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if file exists
    try {
      await fs.access(document.path);
    } catch (error) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(document.path, document.name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:returnId/:documentId', auth, async (req, res) => {
  try {
    const { returnId, documentId } = req.params;

    const taxReturn = await TaxReturn.findOne({
      _id: returnId,
      userId: req.user.userId
    });

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    const document = taxReturn.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Remove document from database
    taxReturn.documents.pull(documentId);
    taxReturn.updatedAt = new Date();
    await taxReturn.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all documents for user (across all returns)
router.get('/', auth, async (req, res) => {
  try {
    const taxReturns = await TaxReturn.find({ userId: req.user.userId })
      .select('assessmentYear documents')
      .populate('documents');

    const allDocuments = [];
    taxReturns.forEach(taxReturn => {
      taxReturn.documents.forEach(doc => {
        allDocuments.push({
          ...doc.toObject(),
          assessmentYear: taxReturn.assessmentYear,
          returnId: taxReturn._id
        });
      });
    });

    res.json({ documents: allDocuments });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
