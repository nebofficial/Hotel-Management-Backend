function calculateAttendanceRate(records = []) {
  const working = records.filter((r) => r.attendanceStatus && r.attendanceStatus !== 'Off');
  const present = working.filter((r) => r.attendanceStatus === 'Present');
  const absent = working.filter((r) => r.attendanceStatus === 'Absent');
  const onLeave = working.filter((r) => r.attendanceStatus === 'On Leave');

  const total = working.length;
  const rate = total ? (present.length / total) * 100 : 0;

  return {
    totalScheduled: total,
    present: present.length,
    absent: absent.length,
    onLeave: onLeave.length,
    rate,
  };
}

module.exports = { calculateAttendanceRate };

