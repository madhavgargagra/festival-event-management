// Controller managing Vendors compliance documentation and rating evaluation
const { Vendor } = require('../models');
const { logAudit } = require('./auditController');

// 1. Fetch all vendors list
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Upload compliance documentation (licenses, certificates) - self-service
const uploadComplianceDocs = async (req, res) => {
  const vendor_id = req.user.id;
  const { address } = req.body;

  try {
    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const oldVal = { ...vendor.toJSON() };
    const updateData = {};
    if (address) updateData.address = address;
    if (req.file) {
      updateData.compliance_info = `/uploads/vendor_docs/${req.file.filename}`;
      updateData.compliance_status = 'Pending'; // Reset to pending for Admin verification
    }

    await vendor.update(updateData);
    await logAudit('Vendor', vendor_id, 'UPDATE', req, oldVal, vendor);

    return res.status(200).json({ success: true, message: 'Compliance documents submitted successfully.', vendor });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Update vendor compliance status (Admin validation action)
const verifyVendorCompliance = async (req, res) => {
  const { id } = req.params;
  const { compliance_status } = req.body;

  try {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldVal = { ...vendor.toJSON() };
    await vendor.update({ compliance_status });
    await logAudit('Vendor', id, 'UPDATE', req, oldVal, vendor);

    return res.status(200).json({ success: true, message: 'Vendor compliance verification updated.', vendor });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Update vendor past performance rating score (Organizer/Admin evaluation feedback)
const evaluateVendorPerformance = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body; // Score from 1.00 to 5.00

  try {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const oldVal = { ...vendor.toJSON() };
    
    // Auto calculate average of new score and old score
    const newRating = (parseFloat(vendor.past_performance) + parseFloat(score)) / 2;

    await vendor.update({ past_performance: newRating.toFixed(2) });
    await logAudit('Vendor', id, 'UPDATE', req, oldVal, vendor);

    return res.status(200).json({ success: true, message: 'Vendor evaluation submitted.', vendor });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVendors,
  uploadComplianceDocs,
  verifyVendorCompliance,
  evaluateVendorPerformance
};
