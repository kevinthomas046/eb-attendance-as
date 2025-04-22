/**
 * Copyright 2024 Elevation Beats Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  FamilyRecord,
  RecentAttendance,
  StudentRecord,
  AttendanceRecord,
  ClassRecord,
} from './types/types';

const SHEETS = {
  FAMILIES: 'Families',
  STUDENTS: 'Students',
  ATTENDANCE: 'Attendance',
  PAYMENTS: 'Payments',
  CLASSES: 'Classes',
  CLASS_GROUPS: 'ClassGroups',
};

/**
 * Special function that handles HTTP GET requests to the published web app.
 * @return {GoogleAppsScript.HTML.HtmlOutput} The HTML page to be served.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
function doGet() {
  Logger.log('Loading page');
  return HtmlService.createTemplateFromFile('page')
    .evaluate()
    .setTitle('Attendance | Elevation Beats Inc');
}

/**
 * Includes template based on filename that has a nested include
 * @param filename file name to be included
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
function includeTemplate(filename: string) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Includes template based on filename
 * @param filename file name to be included
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Retrieves a reference to a Google sheet by name.
 * @param {string} sheetName Name of the sheet to retrieve
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Google sheet reference
 */
function getSheetByName(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet with name ${sheetName} not found.`);
  }
  return sheet;
}

function getClasses() {
  const classesSheet = getSheetByName(SHEETS.CLASSES);
  const classesData = classesSheet.getDataRange().getValues();

  const classes = classesData.slice(1).reduce(
    (danceClasses, danceClass) => {
      const [id, , date, price, classGroup] = danceClass;
      if (classGroup && date) {
        const displayDate = new Date(date).toLocaleDateString();
        const today = Date.parse(new Date().toLocaleDateString());
        const classDate = Date.parse(displayDate);
        const priorOrUpcoming =
          classDate >= today ? 'upcomingClasses' : 'priorClasses';

        danceClasses[priorOrUpcoming].push({
          id,
          date: displayDate,
          price,
          classGroup,
          displayName: `${displayDate} - ${classGroup}`,
        });

        danceClasses[priorOrUpcoming].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (priorOrUpcoming === 'upcomingClasses') {
            return dateA > dateB ? 1 : -1;
          } else {
            return dateA < dateB ? 1 : -1;
          }
        });
      }
      return danceClasses;
    },
    {
      upcomingClasses: [] as ClassRecord[],
      priorClasses: [] as ClassRecord[],
    }
  );

  console.log(classes);

  return classes;
}

function getAttendanceForClass(classLookupId: number) {
  const attendanceSheet = getSheetByName(SHEETS.ATTENDANCE);
  const attendanceData = attendanceSheet.getDataRange().getValues();
  const studentsSheet = getSheetByName(SHEETS.STUDENTS);
  const studentsData = studentsSheet.getDataRange().getValues();
  const classesSheet = getSheetByName(SHEETS.CLASSES);
  const classesData = classesSheet.getDataRange().getValues();

  const studentsPresent = attendanceData
    .slice(1)
    .filter(([, , classId]) => classLookupId === classId)
    .map(([, studentId]) => studentId);

  const [, classGroupId] =
    classesData.slice(1).find(([classId]) => classId === classLookupId) || [];
  const allStudents = studentsData
    .slice(1)
    .reduce((students, student) => {
      const [id, name, , studentClassGroupId, isActive] = student;

      const isStudentPresent = studentsPresent.includes(id);

      if (
        studentClassGroupId === classGroupId &&
        (isStudentPresent || isActive)
      ) {
        students.push({
          id,
          name,
          isPresent: studentsPresent.includes(id),
        });
      }

      return students;
    }, [])
    .sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });

  return allStudents;
}

/**
 * Deletes all current attendance for classLookupId and inserts all students
 * @param classLookupId Class ID
 * @param presentStudents List of student IDs to be marked as present
 */
function submitAttendanceForClass(
  classLookupId: number,
  presentStudents: number[]
) {
  const attendanceSheet = getSheetByName(SHEETS.ATTENDANCE);
  const attendanceData = attendanceSheet.getDataRange().getValues();
  attendanceData
    .slice(1)
    .reverse()
    .forEach(([, studentId, classId], index) => {
      if (classId === classLookupId) {
        const rowNumber = attendanceData.length - index;
        console.log(
          `Deleting student ${studentId} from class ${classId}, row ${rowNumber}`
        );
        attendanceSheet.deleteRow(rowNumber);
      }
    });

  const lastRow = attendanceSheet.getLastRow();
  const studentValues = attendanceSheet.getRange(`B1:B${lastRow}`).getValues();
  const lastStudentRow =
    lastRow -
    studentValues.reverse().findIndex(([studentId]) => studentId !== '');

  console.log(lastStudentRow);

  presentStudents.forEach((studentId, index) => {
    const newRow = lastStudentRow + index + 1;
    attendanceSheet
      .getRange(`B${newRow}:C${newRow}`)
      .setValues([[studentId, classLookupId]]);
  });
}
