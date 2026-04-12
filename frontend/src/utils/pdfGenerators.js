import jsPDF from "jspdf";

export const generatePrescriptionPDF = (presc) => {
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 0;

    // Header background
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 45, "F");

    // Hospital name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.setFont("helvetica", "bold");
    pdf.text("LIONHS Care Hospital", pageWidth / 2, 18, { align: "center" });
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Excellence in Precision Healthcare • Est. 1998", pageWidth / 2, 26, { align: "center" });
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - 40, 32, pageWidth / 2 + 40, 32);
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("DIGITAL MEDICAL PRESCRIPTION", pageWidth / 2, 40, { align: "center" });

    y = 55;

    // Prescription ID & Date
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(`REFERENCE ID: #${presc._id.slice(-8).toUpperCase()}`, 15, y);
    pdf.text(`ISSUED ON: ${new Date(presc.createdAt).toLocaleDateString()}`, pageWidth - 15, y, { align: "right" });
    y += 8;

    // Divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    // Patient & Doctor Info
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, y, (pageWidth - 35) / 2, 32, 4, 4, "F");
    pdf.roundedRect(pageWidth / 2 + 3, y, (pageWidth - 35) / 2, 32, 4, 4, "F");

    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("PATIENT INFORMATION", 20, y + 8);
    pdf.text("TREATING PHYSICIAN", pageWidth / 2 + 8, y + 8);

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(presc.patientId?.fullName || "Patient", 20, y + 18);
    pdf.text(`Dr. ${presc.doctorId?.userId?.fullName || "Doctor"}`, pageWidth / 2 + 8, y + 18);

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${presc.patientId?.email || "No email provided"}`, 20, y + 25);
    pdf.text(`${presc.doctorId?.specialization || "Medical Specialist"}`, pageWidth / 2 + 8, y + 25);
    y += 40;

    // Medicines table header
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(15, y, pageWidth - 30, 12, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Medication Name", 20, y + 8);
    pdf.text("Qty", 75, y + 8);
    pdf.text("Dosage Schedule", 90, y + 8);
    pdf.text("Duration", 140, y + 8);
    pdf.text("Timing", 165, y + 8);
    y += 15;

    // Medicine rows
    presc.medicines?.forEach((med, idx) => {
      const rowHeight = 16;
      if (y + rowHeight > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }

      const bgColor = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      pdf.setFillColor(...bgColor);
      pdf.rect(15, y, pageWidth - 30, rowHeight, "F");

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(med.name, 20, y + 7);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);

      pdf.text(med.quantity || "1", 75, y + 7);

      const dosageParts = [];
      if (med.dosage?.morning) dosageParts.push("Morning");
      if (med.dosage?.noon) dosageParts.push("Noon");
      if (med.dosage?.evening) dosageParts.push("Evening");
      pdf.text(dosageParts.join(" - ") || "As directed", 90, y + 7);
      pdf.text(med.duration || "As directed", 140, y + 7);
      pdf.text(med.mealTiming || "—", 165, y + 7);

      if (med.description) {
         pdf.setFontSize(7);
         pdf.setTextColor(148, 163, 184);
         pdf.text(`Note: ${med.description}`, 20, y + 12);
      }

      y += rowHeight;
    });

    y += 6;

    if (presc.generalNotes) {
      if (y + 30 > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(15, y, pageWidth - 30, 25, 4, 4, "F");
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("ADMINISTRATIVE NOTES / CLINICAL ADVICE:", 20, y + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(51, 65, 85);
      const noteLines = pdf.splitTextToSize(presc.generalNotes, pageWidth - 40);
      pdf.text(noteLines, 20, y + 15);
      y += 30;
    }

    // Footer
    const footerY = pageHeight - 20;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("This is an electronically generated record from LIONHS Care Hospital Management System.", pageWidth / 2, footerY + 2, { align: "center" });
    pdf.text("Verification Code: " + presc._id.toUpperCase(), pageWidth / 2, footerY + 7, { align: "center" });

    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } catch (err) {
    console.error("PDF generation error:", err);
  }
};

export const generateInvoicePDF = ({
  patientName,
  doctorName,
  date,
  amount,
  paymentStatus,
  transactionId
}) => {
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFillColor(15, 23, 42); 
    pdf.rect(0, 0, pageWidth, 40, "F");
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("LIONHS Care Invoice", pageWidth / 2, 18, { align: "center" });
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Electronic Billing Statement • Tax Invoice", pageWidth / 2, 26, { align: "center" });

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL TO:", 15, 55);
    pdf.setFont("helvetica", "normal");
    pdf.text(patientName || "Patient", 15, 62);

    pdf.setFont("helvetica", "bold");
    pdf.text("DOCTOR:", 120, 55);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Dr. ${doctorName || "Doctor"}`, 120, 62);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, 80, pageWidth - 15, 80);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", 20, 95);
    pdf.text("Date", 100, 95);
    pdf.text("Amount", pageWidth - 20, 95, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.text(`Consultation Fee`, 20, 110);
    pdf.text(new Date(date).toLocaleDateString(), 100, 110);
    const amountVal = amount ? Number(amount).toFixed(2) : '1500.00';
    pdf.text(`Rs. ${amountVal}`, pageWidth - 20, 110, { align: "right" });

    pdf.line(15, 120, pageWidth - 15, 120);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Total Paid:", 120, 135);
    pdf.text(`Rs. ${amountVal}`, pageWidth - 20, 135, { align: "right" });

    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Payment Status: ${paymentStatus || "SUCCESSFUL"}`, 20, 150);
    if (transactionId) {
      pdf.text(`Transaction ID: ${transactionId}`, 20, 155);
    }
    
    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, 165, pageWidth - 15, 165);
    pdf.setFontSize(7);
    pdf.text("Thank you for choosing LIONHS Care.", pageWidth / 2, 172, { align: "center" });

    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } catch (err) {
    console.error("PDF Failed:", err);
  }
};
