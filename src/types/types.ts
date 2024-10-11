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
// types.ts
export interface FamilyRecord {
  FamilyId: string;
  FamilyName: string;
}

export interface RecentAttendance {
  AttendanceId: string;
  ClassDate: string;
  StudentName: string;
  ClassGroupName: string;
  Price: string;
}

export interface StudentRecord {
  StudentId: string;
  StudentName: string;
}

export interface AttendanceRecord {
  AttendanceId: string;
  ClassId: string;
  StudentName: string | undefined;
  Price: string;
}
