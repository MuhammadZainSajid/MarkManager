import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import './Marksheet.css';

export default function Marksheet() {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [section, setSection] = useState('');
  const [columns, setColumns] = useState(['Name', 'ID', 'Section', 'Total', 'GPA']);
  const [newColumnName, setNewColumnName] = useState('');
  const [students, setStudents] = useState([]);
  const [markSheetTitle, setMarkSheetTitle] = useState('');

  const calculateGPA = (average) => {
    if (average >= 90) return 4;
    if (average >= 85) return 3.75;
    if (average >= 80) return 3.5;
    if (average >= 75) return 3.25;
    if (average >= 70) return 3;
    if (average >= 66) return 2.75;
    if (average >= 63) return 2.5;
    if (average >= 60) return 2;
    if (average >= 55) return 1.5;
    return 0;
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || columns.includes(newColumnName)) return;

    const totalIndex = columns.indexOf('Total');
    const newColumns = [
      ...columns.slice(0, totalIndex),
      newColumnName,
      ...columns.slice(totalIndex),
    ];
    setColumns(newColumns);

    setStudents((prev) =>
      prev.map((stu) => ({
        ...stu,
        marks: { ...stu.marks, [newColumnName]: 0 },
      }))
    );

    setNewColumnName('');
  };

  const handleAddStudent = () => {
    if (!studentName || !studentId || !section) {
      alert('Fill all fields');
      return;
    }

    const newStudent = {
      id: uuidv4(),
      name: studentName,
      studentId,
      section,
      marks: columns.reduce((acc, col) => {
        if (!['Name', 'ID', 'Section', 'Total', 'GPA'].includes(col)) {
          acc[col] = 0;
        }
        return acc;
      }, {}),
      total: 0,
      gpa: 0,
    };

    setStudents((prev) => [...prev, newStudent]);
    setStudentName('');
    setStudentId('');
    setSection('');
  };

  const handleChangeMark = (studentIndex, column, value) => {
    const updated = [...students];
    const student = updated[studentIndex];
    student.marks[column] = parseInt(value) || 0;

    const total = Object.values(student.marks).reduce((sum, val) => sum + (val || 0), 0);
    // const criteriaCount = Object.keys(student.marks).length;
    // const avg = total / (criteriaCount || 1);

    student.total = total;
    student.gpa = calculateGPA(total);

    setStudents(updated);
  };

  const handleExportToExcel = () => {
    if (!markSheetTitle || students.length === 0) {
      alert('Please enter a title and at least one student');
      return;
    }

    const data = students.map((stu) => {
      const filteredMarks = {};
      Object.entries(stu.marks).forEach(([key, value]) => {
        if (!['Name', 'ID', 'Section', 'Total', 'GPA'].includes(key)) {
          filteredMarks[key] = value;
        }
      });

      return {
        Name: stu.name,
        ID: stu.studentId,
        Section: stu.section,
        ...filteredMarks,
        Total: stu.total,
        GPA: stu.gpa,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marksheet');

    const blob = new Blob(
      [s2ab(XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' }))],
      { type: 'application/octet-stream' }
    );

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${markSheetTitle.replace(/\s+/g, '_')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };

  return (
    <div className="marksheet-container">
      <h2>Marksheet Title</h2>
      <input
        className="input-field full-width"
        type="text"
        value={markSheetTitle}
        onChange={(e) => setMarkSheetTitle(e.target.value)}
        placeholder="e.g. Midterm 2025"
      />

      <h2>Add Student</h2>
      <input
        className="input-field"
        type="text"
        placeholder="Student Name"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
      />
      <input
        className="input-field"
        type="text"
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <input
        className="input-field"
        type="text"
        placeholder="Section"
        value={section}
        onChange={(e) => setSection(e.target.value)}
      />
      <button className="btn" onClick={handleAddStudent}>Add Student</button>

      <h3>Add Criteria (e.g., Quiz 1)</h3>
      <input
        className="input-field"
        type="text"
        value={newColumnName}
        onChange={(e) => setNewColumnName(e.target.value)}
        placeholder="New Criteria"
      />
      <button className="btn" onClick={handleAddColumn}>Add Criteria</button>

      <h3>Students Table</h3>
      <div className="marksheet-table-container">
        <table className="marksheet-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>
                  {['Name', 'ID', 'Section', 'Total', 'GPA'].includes(col) ? (
                    col
                  ) : (
                    <div className="criteria-cell">
                      <input
                        value={col}
                        onChange={(e) => {
                          const newCols = [...columns];
                          const newName = e.target.value;
                          newCols[i] = newName;
                          setColumns(newCols);
                          setStudents((prev) =>
                            prev.map((stu) => {
                              const newMarks = { ...stu.marks };
                              newMarks[newName] = newMarks[col] ?? 0;
                              delete newMarks[col];
                              return { ...stu, marks: newMarks };
                            })
                          );
                        }}
                      />
                      <button
                        className="delete-btn"
                        onClick={() => {
                          const newCols = columns.filter((c) => c !== col);
                          setColumns(newCols);
                          setStudents((prev) =>
                            prev.map((stu) => {
                              const newMarks = { ...stu.marks };
                              delete newMarks[col];
                              return { ...stu, marks: newMarks };
                            })
                          );
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((stu, idx) => (
              <tr key={stu.id}>
                {columns.map((col) => (
                  <td key={col}>
                    {col === 'Total'
                      ? stu.total
                      : col === 'GPA'
                      ? stu.gpa
                      : col === 'Name'
                      ? stu.name
                      : col === 'ID'
                      ? stu.studentId
                      : col === 'Section'
                      ? stu.section
                      : (
                        <input
                          className="marks-input"
                          value={stu.marks[col]}
                          onChange={(e) =>
                            handleChangeMark(idx, col, e.target.value)
                          }
                        />
                      )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn export-btn" onClick={handleExportToExcel}>
        Export to Excel
      </button>
    </div>
  );
}
