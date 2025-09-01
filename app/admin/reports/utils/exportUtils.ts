export function exportToCSV(
  type: "students" | "payments",
  studentsData: any[],
  paymentsData: any[],
  dateRange: { from: string; to: string }
) {
  if (!studentsData || !paymentsData) return;

  let csvContent = "";
  let filename = "";

  if (type === "students") {
    filename = `students_${dateRange.from}_to_${dateRange.to}.csv`;
    csvContent =
      "Name,Email,Phone,Matric Number,Faculty,Level,State,Room,Bed\n";

    const filteredStudents = studentsData.filter(
      (student: any) =>
        student.created_at >= dateRange.from &&
        student.created_at <= dateRange.to + "T23:59:59"
    );

    filteredStudents.forEach((student: any) => {
      csvContent += `"${student.first_name} ${student.last_name}","${student.email}","${student.phone}","${student.matric_number}","${student.faculty}","${student.level}","${student.state_of_origin}","${student.block}${student.room}","${student.bedspace_label}"\n`;
    });
  } else {
    filename = `payments_${dateRange.from}_to_${dateRange.to}.csv`;
    csvContent =
      "Email,Phone,Amount Paid,Amount To Pay,Status,Invoice ID,Date\n";

    const filteredPayments = paymentsData.filter(
      (payment: any) =>
        payment.created_at >= dateRange.from &&
        payment.created_at <= dateRange.to + "T23:59:59"
    );

    filteredPayments.forEach((payment: any) => {
      csvContent += `"${payment.email}","${payment.phone}","${payment.amount_paid}","${payment.amount_to_pay}","${payment.status}","${payment.invoice_id}","${payment.created_at}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
