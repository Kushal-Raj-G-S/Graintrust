/**
 * 🌾 GrainTrust Blockchain Integration - Ready-to-Use Code
 * Copy these functions into your Next.js frontend
 */

// ============================================
// 1. BLOCKCHAIN IMAGE RECORDING
// ============================================

/**
 * Record image to blockchain after farmer uploads
 * Call this AFTER uploading image to your storage
 */
export async function recordImageToBlockchain({
  batchId,
  farmerName,
  grainType,
  quantity,
  imageHash,
  location,
  stageName,
  isFirstImage
}) {
  try {
    console.log('📸 Recording image to blockchain...');
    
    const response = await fetch('http://172.29.54.144:9000/record-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        batchId,
        farmerName,
        grainType,
        quantity,
        imageHash,
        location,
        stageName,
        isFirstImage
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Blockchain recording failed');
    }
    
    console.log('✅ Blockchain recorded:', result.transactionId);
    
    return {
      success: true,
      transactionId: result.transactionId,
      blockNumber: result.blockNumber,
      imageHash: result.imageHash,
      currentStage: result.currentStage,
      totalStages: result.totalStages
    };
    
  } catch (error) {
    console.error('❌ Blockchain recording error:', error);
    throw error;
  }
}

// ============================================
// 2. INTEGRATED UPLOAD HANDLER
// ============================================

/**
 * Complete upload handler with blockchain integration
 * Replace your existing upload handler with this
 */
export async function uploadImageWithBlockchain({
  file,
  batchId,
  farmerName,
  grainType,
  quantity,
  location,
  stageName,
  isFirstImage
}) {
  try {
    // Step 1: Upload to your storage (IPFS/Supabase/S3)
    console.log('📤 Uploading to storage...');
    const storageResult = await uploadToStorage(file);
    
    // Step 2: Record to blockchain
    console.log('🔗 Recording to blockchain...');
    const blockchainResult = await recordImageToBlockchain({
      batchId,
      farmerName,
      grainType,
      quantity,
      imageHash: storageResult.hash, // or storageResult.url
      location,
      stageName,
      isFirstImage
    });
    
    // Step 3: Save to database with blockchain details
    console.log('💾 Saving to database...');
    const savedRecord = await saveToDatabase({
      batchId,
      imageUrl: storageResult.url,
      imageHash: storageResult.hash,
      stageName,
      // Blockchain details
      blockchainTxId: blockchainResult.transactionId,
      blockNumber: blockchainResult.blockNumber,
      blockchainRecordedAt: new Date().toISOString()
    });
    
    console.log('✅ Upload complete!');
    
    return {
      success: true,
      image: savedRecord,
      blockchain: blockchainResult
    };
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// ============================================
// 3. CERTIFICATE GENERATION
// ============================================

/**
 * Generate blockchain certificate with QR code
 * Call after all 7 stages complete (14+ images)
 */
export async function generateBlockchainCertificate(batchId) {
  try {
    console.log('📜 Generating certificate...');
    
    const response = await fetch('http://172.29.54.144:9000/generate-certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ batchId })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Certificate generation failed');
    }
    
    console.log('✅ Certificate generated:', result.certificateId);
    
    return {
      success: true,
      certificateId: result.certificateId,
      qrCodeUrl: result.qrCodeUrl,
      certificateHash: result.certificateHash,
      blockchain: result.blockchain,
      batch: result.batch
    };
    
  } catch (error) {
    console.error('❌ Certificate generation failed:', error);
    throw error;
  }
}

// ============================================
// 4. QR CODE GENERATION
// ============================================

/**
 * Generate QR code image from URL
 * Requires: npm install qrcode
 */
import QRCode from 'qrcode';

export async function generateQRCodeImage(url, options = {}) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: options.width || 300,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
    
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw error;
  }
}

// ============================================
// 5. REACT COMPONENT EXAMPLE
// ============================================

/**
 * Example React component for certificate display
 */
import { useState } from 'react';
import Image from 'next/image';

export function CertificateDisplay({ batchId }) {
  const [certificate, setCertificate] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function handleGenerateCertificate() {
    try {
      setLoading(true);
      
      // Generate certificate
      const cert = await generateBlockchainCertificate(batchId);
      setCertificate(cert);
      
      // Generate QR code
      const qr = await generateQRCodeImage(cert.qrCodeUrl);
      setQrCode(qr);
      
    } catch (error) {
      alert('Failed to generate certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (!certificate) {
    return (
      <button 
        onClick={handleGenerateCertificate}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Generating...' : '🎉 Generate Certificate & QR Code'}
      </button>
    );
  }
  
  return (
    <div className="certificate-container">
      <h2>🎉 Blockchain Certificate Generated!</h2>
      
      <div className="certificate-details">
        <p><strong>Certificate ID:</strong> {certificate.certificateId}</p>
        <p><strong>Batch ID:</strong> {certificate.batch.batchId}</p>
        <p><strong>Farmer:</strong> {certificate.batch.farmerName}</p>
        <p><strong>Grain Type:</strong> {certificate.batch.grainType}</p>
        <p><strong>Total Images:</strong> {certificate.batch.totalImages}</p>
        <p><strong>Blockchain Verified:</strong> ✅ Yes</p>
      </div>
      
      <div className="qr-code-section">
        <h3>Scan to Verify Supply Chain</h3>
        <Image 
          src={qrCode} 
          alt="QR Code" 
          width={300} 
          height={300}
        />
        <p className="qr-url">{certificate.qrCodeUrl}</p>
        <p className="qr-info">
          Scan this QR code to view the complete journey from farm to table
        </p>
      </div>
      
      <div className="action-buttons">
        <button onClick={() => downloadCertificate(certificate)}>
          📥 Download Certificate
        </button>
        <button onClick={() => window.print()}>
          🖨️ Print Certificate
        </button>
        <button onClick={() => shareCertificate(certificate.qrCodeUrl)}>
          📤 Share
        </button>
      </div>
    </div>
  );
}

// ============================================
// 6. HELPER FUNCTIONS
// ============================================

// Check if batch is ready for certificate generation
export function isBatchReadyForCertificate(batch) {
  const hasAllStages = batch.stages?.length === 7;
  const hasEnoughImages = batch.totalImages >= 14;
  const eachStageHasTwoImages = batch.stages?.every(stage => 
    stage.imageCount >= 2
  );
  
  return hasAllStages && hasEnoughImages && eachStageHasTwoImages;
}

// Download certificate as PDF or image
export function downloadCertificate(certificate) {
  // Implementation depends on your PDF library
  // Example: using html2canvas + jsPDF
  const element = document.querySelector('.certificate-container');
  
  html2canvas(element).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10);
    pdf.save(`certificate-${certificate.certificateId}.pdf`);
  });
}

// Share certificate via Web Share API
export function shareCertificate(url) {
  if (navigator.share) {
    navigator.share({
      title: 'GrainTrust Blockchain Certificate',
      text: 'Verify our supply chain journey on blockchain',
      url: url
    }).catch(err => console.log('Share failed:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url);
    alert('Verification URL copied to clipboard!');
  }
}

// ============================================
// 7. API ROUTE EXAMPLE (Next.js)
// ============================================

/**
 * Create: /api/upload-image/route.ts
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const metadata = JSON.parse(formData.get('metadata'));
    
    // Upload with blockchain integration
    const result = await uploadImageWithBlockchain({
      file,
      batchId: metadata.batchId,
      farmerName: metadata.farmerName,
      grainType: metadata.grainType,
      quantity: metadata.quantity,
      location: metadata.location,
      stageName: metadata.stageName,
      isFirstImage: metadata.isFirstImage
    });
    
    return Response.json(result);
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// 8. FRONTEND FORM EXAMPLE
// ============================================

/**
 * Example form for image upload
 */
export function ImageUploadForm({ batchData }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!file) {
      alert('Please select an image');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        batchId: batchData.id,
        farmerName: batchData.farmerName,
        grainType: batchData.grainType,
        quantity: batchData.quantity,
        location: batchData.location,
        stageName: batchData.currentStage,
        isFirstImage: batchData.imageCount === 0
      }));
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Image uploaded and recorded on blockchain!');
        console.log('Transaction ID:', result.blockchain.transactionId);
        // Refresh batch data
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Upload Image - Stage: {batchData.currentStage}</h3>
      
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : '📤 Upload & Record to Blockchain'}
      </button>
    </form>
  );
}

// ============================================
// 9. STAGE NAMES CONSTANT
// ============================================

export const FARMING_STAGES = [
  "Land Preparation",
  "Sowing",
  "Germination",
  "Vegetative Growth",
  "Flowering & Pollination",
  "Harvesting",
  "Post-Harvest Processing"
];

// ============================================
// 10. ERROR HANDLING
// ============================================

export class BlockchainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
  }
}

export function handleBlockchainError(error) {
  if (error.message.includes('Batch does not exist')) {
    return {
      action: 'retry_with_first_image',
      message: 'Batch not found. Creating new batch...'
    };
  } else if (error.message.includes('Missing required field')) {
    return {
      action: 'show_validation',
      message: 'Please fill all required fields'
    };
  } else if (error.message.includes('insufficient images')) {
    return {
      action: 'show_requirement',
      message: 'Each stage needs at least 2 images'
    };
  } else {
    return {
      action: 'show_error',
      message: 'Blockchain recording failed. Please try again.'
    };
  }
}

/**
 * 🎯 INTEGRATION STEPS:
 * 
 * 1. Install QR code library:
 *    npm install qrcode html2canvas jspdf
 * 
 * 2. Import functions in your upload component:
 *    import { uploadImageWithBlockchain, generateBlockchainCertificate } from './blockchain-utils';
 * 
 * 3. Replace your upload handler with uploadImageWithBlockchain()
 * 
 * 4. Add certificate button after 7 stages complete
 * 
 * 5. Display QR code to farmer
 * 
 * 6. Test with batch: 7c24ea9d-c016-4362-9c02-b97407a40186
 */
