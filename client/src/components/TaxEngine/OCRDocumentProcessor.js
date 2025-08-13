import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload,
  Visibility,
  Edit,
  Check,
  Warning,
  Delete,
  Refresh,
  ExpandMore,
  PictureAsPdf,
  Image as ImageIcon,
  Description
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const OCRDocumentProcessor = ({
  onDataExtracted,
  supportedDocuments = ['form16', 'form26AS', 'interestCertificate', 'investmentProof', 'salarySlip']
}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({});

  // Document templates for OCR recognition
  const documentTemplates = {
    form16: {
      name: 'Form 16 - Salary Certificate',
      patterns: {
        employerName: /Employer Name[:\s]*([^\n]+)/i,
        employerTAN: /TAN[:\s]*([A-Z]{4}[0-9]{5}[A-Z])/i,
        employeeName: /Employee Name[:\s]*([^\n]+)/i,
        employeePAN: /PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i,
        grossSalary: /Gross Salary[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        tdsDeducted: /TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        standardDeduction: /Standard Deduction[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        taxableIncome: /Taxable Income[:\s]*[₹Rs.\s]*([0-9,]+)/i
      },
      icon: <Description />,
      color: 'primary'
    },
    form26AS: {
      name: 'Form 26AS - TDS Certificate',
      patterns: {
        panNumber: /PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z])/i,
        assessmentYear: /Assessment Year[:\s]*([0-9]{4}-[0-9]{2})/i,
        totalTDS: /Total TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        salaryTDS: /Salary.*TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        interestTDS: /Interest.*TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        otherTDS: /Other.*TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i
      },
      icon: <PictureAsPdf />,
      color: 'success'
    },
    interestCertificate: {
      name: 'Bank Interest Certificate',
      patterns: {
        bankName: /Bank Name[:\s]*([^\n]+)/i,
        accountNumber: /Account.*Number[:\s]*([0-9]+)/i,
        interestEarned: /Interest.*Earned[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        tdsDeducted: /TDS.*Deducted[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        financialYear: /Financial Year[:\s]*([0-9]{4}-[0-9]{2})/i
      },
      icon: <ImageIcon />,
      color: 'info'
    },
    investmentProof: {
      name: 'Investment Proof (80C, 80D, etc.)',
      patterns: {
        investmentType: /(PPF|ELSS|Insurance|NSC|ULIP|Health Insurance)/i,
        investmentAmount: /Amount[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        policyNumber: /Policy.*Number[:\s]*([A-Z0-9]+)/i,
        maturityDate: /Maturity.*Date[:\s]*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
        section: /Section[:\s]*(80[A-Z])/i
      },
      icon: <Description />,
      color: 'warning'
    },
    salarySlip: {
      name: 'Salary Slip',
      patterns: {
        basicSalary: /Basic.*Salary[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        hra: /HRA[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        allowances: /Allowances[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        grossPay: /Gross.*Pay[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        providentFund: /PF[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        professionalTax: /Professional.*Tax[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        tds: /TDS[:\s]*[₹Rs.\s]*([0-9,]+)/i,
        netPay: /Net.*Pay[:\s]*[₹Rs.\s]*([0-9,]+)/i
      },
      icon: <Description />,
      color: 'secondary'
    }
  };

  // Mock OCR processing function (in real implementation, this would call an OCR API)
  const processWithOCR = async (file, documentType) => {
    setProcessing(true);
    setProcessingProgress(prev => ({ ...prev, [file.name]: 0 }));

    // Simulate OCR processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProcessingProgress(prev => ({ ...prev, [file.name]: i }));
    }

    // Mock extracted text (in real implementation, this would come from OCR service)
    const mockExtractedText = generateMockOCRText(documentType);
    
    // Process the extracted text
    const extractedInfo = extractDataFromText(mockExtractedText, documentType);
    
    setProcessing(false);
    return extractedInfo;
  };

  // Generate mock OCR text based on document type
  const generateMockOCRText = (documentType) => {
    switch (documentType) {
      case 'form16':
        return `
          FORM 16
          Employer Name: ABC Company Ltd
          TAN: DELA12345F
          Employee Name: John Doe
          PAN: ABCDE1234F
          Gross Salary: Rs. 12,00,000
          Standard Deduction: Rs. 50,000
          TDS Deducted: Rs. 1,20,000
          Taxable Income: Rs. 11,50,000
        `;
      case 'form26AS':
        return `
          FORM 26AS
          PAN: ABCDE1234F
          Assessment Year: 2024-25
          Total TDS: Rs. 1,50,000
          Salary TDS: Rs. 1,20,000
          Interest TDS: Rs. 30,000
        `;
      case 'interestCertificate':
        return `
          Interest Certificate
          Bank Name: State Bank of India
          Account Number: 1234567890
          Interest Earned: Rs. 25,000
          TDS Deducted: Rs. 2,500
          Financial Year: 2023-24
        `;
      case 'investmentProof':
        return `
          Investment Certificate
          Investment Type: ELSS Mutual Fund
          Amount: Rs. 1,50,000
          Policy Number: MF123456
          Section: 80C
        `;
      case 'salarySlip':
        return `
          Salary Slip
          Basic Salary: Rs. 50,000
          HRA: Rs. 25,000
          Allowances: Rs. 15,000
          Gross Pay: Rs. 90,000
          PF: Rs. 6,000
          Professional Tax: Rs. 200
          TDS: Rs. 8,000
          Net Pay: Rs. 75,800
        `;
      default:
        return 'Sample document text for OCR processing';
    }
  };

  // Extract structured data from OCR text
  const extractDataFromText = (text, documentType) => {
    const template = documentTemplates[documentType];
    if (!template) return {};

    const extractedData = {};
    
    Object.entries(template.patterns).forEach(([field, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        let value = match[1].trim();
        
        // Clean up numeric values
        if (field.includes('salary') || field.includes('amount') || field.includes('tds') || field.includes('income')) {
          value = value.replace(/[₹Rs.,\s]/g, '');
          value = parseInt(value) || 0;
        }
        
        extractedData[field] = value;
      }
    });

    return extractedData;
  };

  // Auto-detect document type based on content
  const detectDocumentType = (text) => {
    const detectionPatterns = {
      form16: /form\s*16|salary\s*certificate|employer.*tan/i,
      form26AS: /form\s*26as|tax\s*deducted.*source/i,
      interestCertificate: /interest.*certificate|bank.*interest/i,
      investmentProof: /investment.*proof|policy.*certificate|section.*80/i,
      salarySlip: /salary.*slip|pay.*slip|monthly.*salary/i
    };

    for (const [docType, pattern] of Object.entries(detectionPatterns)) {
      if (pattern.test(text)) {
        return docType;
      }
    }

    return 'unknown';
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploaded',
      detectedDocType: null,
      extractedData: null,
      confidence: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file with OCR
    for (const fileObj of newFiles) {
      try {
        // Auto-detect document type first
        const mockText = generateMockOCRText('unknown');
        const detectedType = detectDocumentType(mockText);
        
        fileObj.detectedDocType = detectedType;
        fileObj.status = 'processing';
        
        // Process with OCR
        const extracted = await processWithOCR(fileObj.file, detectedType);
        
        fileObj.extractedData = extracted;
        fileObj.status = 'completed';
        fileObj.confidence = Math.random() * 20 + 80; // Mock confidence score
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? fileObj : f)
        );

        // Update global extracted data
        setExtractedData(prev => ({
          ...prev,
          [detectedType]: {
            ...prev[detectedType],
            ...extracted
          }
        }));
        
        onDataExtracted(fileObj.detectedDocType, extracted);
        
      } catch (error) {
        fileObj.status = 'error';
        fileObj.error = error.message;
      }
    }
  }, [onDataExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const reprocessFile = async (fileId) => {
    const fileObj = uploadedFiles.find(f => f.id === fileId);
    if (!fileObj) return;

    fileObj.status = 'processing';
    setUploadedFiles(prev => prev.map(f => f.id === fileId ? fileObj : f));

    try {
      const extracted = await processWithOCR(fileObj.file, fileObj.detectedDocType);
      fileObj.extractedData = extracted;
      fileObj.status = 'completed';
      
      setUploadedFiles(prev => prev.map(f => f.id === fileId ? fileObj : f));
      onDataExtracted(fileObj.detectedDocType, extracted);
    } catch (error) {
      fileObj.status = 'error';
      fileObj.error = error.message;
    }
  };

  const previewFile = (fileObj) => {
    setSelectedFile(fileObj);
    setShowPreview(true);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Automatic Document Processing & OCR
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Upload your tax documents (Form 16, 26AS, salary slips, investment proofs, etc.) 
        and our AI will automatically extract relevant information for your ITR filing.
      </Alert>

      {/* Upload Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'primary.50' : 'grey.50',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Upload Documents'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag & drop files here, or click to select files
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supported: JPG, PNG, PDF • Max size: 10MB
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processing && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Processing Documents...
            </Typography>
            {Object.entries(processingProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{fileName}</Typography>
                  <Typography variant="body2">{progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Processed Documents ({uploadedFiles.length})
            </Typography>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type Detected</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadedFiles.map((fileObj) => (
                  <TableRow key={fileObj.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {fileObj.type.includes('pdf') ? <PictureAsPdf /> : <ImageIcon />}
                        <Box ml={1}>
                          <Typography variant="body2">{fileObj.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {fileObj.detectedDocType && documentTemplates[fileObj.detectedDocType] ? (
                        <Chip
                          icon={documentTemplates[fileObj.detectedDocType].icon}
                          label={documentTemplates[fileObj.detectedDocType].name}
                          color={documentTemplates[fileObj.detectedDocType].color}
                          size="small"
                        />
                      ) : (
                        <Chip label="Unknown" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fileObj.status}
                        color={
                          fileObj.status === 'completed' ? 'success' :
                          fileObj.status === 'error' ? 'error' :
                          fileObj.status === 'processing' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {fileObj.confidence ? `${Math.round(fileObj.confidence)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => previewFile(fileObj)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reprocess">
                          <IconButton size="small" onClick={() => reprocessFile(fileObj.id)}>
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => removeFile(fileObj.id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Summary */}
      {Object.keys(extractedData).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Extracted Information Summary
            </Typography>
            
            {Object.entries(extractedData).map(([docType, data]) => (
              <Accordion key={docType}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center">
                    {documentTemplates[docType]?.icon}
                    <Typography sx={{ ml: 1 }}>
                      {documentTemplates[docType]?.name || docType}
                    </Typography>
                    <Chip
                      label={`${Object.keys(data).length} fields`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(data).map(([field, value]) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Typography variant="body2">
                            {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview: {selectedFile?.name}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detected Type: {selectedFile.detectedDocType}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Confidence: {selectedFile.confidence ? `${Math.round(selectedFile.confidence)}%` : 'N/A'}
              </Typography>
              
              {selectedFile.extractedData && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Extracted Data:
                  </Typography>
                  <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    {JSON.stringify(selectedFile.extractedData, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          {selectedFile && (
            <Button 
              variant="outlined" 
              onClick={() => reprocessFile(selectedFile.id)}
            >
              Reprocess
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRDocumentProcessor;
